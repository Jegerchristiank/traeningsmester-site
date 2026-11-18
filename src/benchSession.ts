import { useCallback, useEffect, useRef, useState } from "react";

type BenchValues = { weight: number; reps: number };
export type BenchRow = {
  weight: string;
  reps: string;
  saved: BenchValues | null;
  registrationOrder: number | null;
};
export type BenchHistory = {
  completedAt: number | null;
  sets: (BenchValues & { number: number })[];
};
export type BenchSession = {
  phase: "workout" | "finished";
  rows: BenchRow[];
  history: BenchHistory[];
  restUntil: number | null;
  restIndex: number | null;
};
type DraftField = "weight" | "reps";
type Action =
  | { type: "draft"; index: number; field: DraftField; value: string }
  | { type: "save" | "uncheck"; index: number }
  | { type: "skipRest" }
  | { type: "finish" }
  | { type: "nextWorkout" };

const storageKey = "tm:bench-example:v1";
const restDuration = 120_000;
const plan = { weight: 60, reps: 8 };

export const formatWeight = (weight: number) =>
  String(weight).replace(".", ",");

function freshRows(firstExample: boolean): BenchRow[] {
  return Array.from({ length: 3 }, (_, index) => ({
    weight: formatWeight(firstExample && index === 0 ? 62.5 : plan.weight),
    reps: String(plan.reps),
    saved: null,
    registrationOrder: null,
  }));
}

export function createBenchSession(): BenchSession {
  return {
    phase: "workout",
    rows: freshRows(true),
    history: [
      {
        completedAt: null,
        sets: [1, 2, 3].map((number) => ({ ...plan, number })),
      },
    ],
    restUntil: null,
    restIndex: null,
  };
}

function numberFromDraft(value: string): number {
  const normalized = value.trim().replace(",", ".");
  return normalized ? Number(normalized) : NaN;
}

export function setError(row: Pick<BenchRow, DraftField>): string | null {
  const weight = numberFromDraft(row.weight);
  const reps = numberFromDraft(row.reps);
  if (!Number.isFinite(weight) || weight < 0)
    return "Skriv en vægt på 0 kg eller mere.";
  if (!Number.isInteger(reps) || reps < 1)
    return "Skriv et helt antal gentagelser på mindst 1.";
  return null;
}

function draftValues(row: BenchRow): BenchValues {
  return {
    weight: numberFromDraft(row.weight),
    reps: numberFromDraft(row.reps),
  };
}

function hasPendingEdit(row: BenchRow) {
  const draft = draftValues(row);
  return (
    row.saved !== null &&
    (row.saved.weight !== draft.weight || row.saved.reps !== draft.reps)
  );
}

const clearRest = { restUntil: null, restIndex: null };

export function updateBenchSession(
  session: BenchSession,
  action: Action,
  now: number,
): BenchSession | null {
  if (action.type === "nextWorkout") {
    if (session.phase !== "finished") return null;
    return {
      ...session,
      phase: "workout",
      rows: freshRows(false),
      ...clearRest,
    };
  }
  if (session.phase !== "workout") return null;
  if (action.type === "skipRest") return { ...session, ...clearRest };
  if (action.type === "finish") {
    const completed = session.rows.filter((row) => row.saved !== null);
    if (!completed.length || completed.some((row) => setError(row)))
      return null;
    // A visitor may finish before autosave fires. Capture the values they see.
    const rows = session.rows.map((row) =>
      row.saved ? { ...row, saved: draftValues(row) } : row,
    );
    const sets = rows
      .flatMap((row) =>
        row.saved && row.registrationOrder !== null
          ? [{ order: row.registrationOrder, values: row.saved }]
          : [],
      )
      .sort((a, b) => a.order - b.order)
      .map(({ values }, index) => ({ number: index + 1, ...values }));
    return {
      ...session,
      phase: "finished",
      rows,
      ...clearRest,
      history: [{ completedAt: now, sets }, ...session.history],
    };
  }

  const row = session.rows[action.index];
  if (!row) return null;
  const rows = session.rows.slice();
  if (action.type === "draft") {
    rows[action.index] = { ...row, [action.field]: action.value };
    return { ...session, rows };
  }
  if (action.type === "uncheck") {
    if (!row.saved) return null;
    rows[action.index] = { ...row, saved: null };
    return {
      ...session,
      rows,
      ...(session.restIndex === action.index ? clearRest : {}),
    };
  }
  if (setError(row)) return null;
  const registrationOrder =
    row.registrationOrder ??
    Math.max(0, ...rows.map((item) => item.registrationOrder ?? 0)) + 1;
  rows[action.index] = { ...row, saved: draftValues(row), registrationOrder };
  // Revising, rechecking or recording the final set never starts a new timer.
  if (row.registrationOrder === null && rows.some((other) => !other.saved)) {
    return {
      ...session,
      rows,
      restUntil: now + restDuration,
      restIndex: action.index,
    };
  }
  return { ...session, rows };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validValues(value: unknown): value is BenchValues {
  return (
    isRecord(value) &&
    typeof value.weight === "number" &&
    Number.isFinite(value.weight) &&
    value.weight >= 0 &&
    typeof value.reps === "number" &&
    Number.isInteger(value.reps) &&
    value.reps > 0
  );
}

function validSession(value: unknown): value is BenchSession {
  if (
    !isRecord(value) ||
    (value.phase !== "workout" && value.phase !== "finished")
  )
    return false;
  const rowsValid =
    Array.isArray(value.rows) &&
    value.rows.length === 3 &&
    value.rows.every(
      (row) =>
        isRecord(row) &&
        typeof row.weight === "string" &&
        typeof row.reps === "string" &&
        (row.registrationOrder === null ||
          (Number.isInteger(row.registrationOrder) &&
            Number(row.registrationOrder) > 0)) &&
        (row.saved === null ||
          (row.registrationOrder !== null && validValues(row.saved))),
    );
  const historyValid =
    Array.isArray(value.history) &&
    value.history.length > 0 &&
    value.history.every(
      (entry) =>
        isRecord(entry) &&
        (entry.completedAt === null || Number.isFinite(entry.completedAt)) &&
        Array.isArray(entry.sets) &&
        entry.sets.length > 0 &&
        entry.sets.length <= 3 &&
        entry.sets.every(
          (set) =>
            isRecord(set) &&
            Number.isInteger(set.number) &&
            Number(set.number) >= 1 &&
            Number(set.number) <= 3 &&
            validValues(set),
        ),
    );
  const timerValid =
    (value.restUntil === null && value.restIndex === null) ||
    (Number.isFinite(value.restUntil) &&
      Number.isInteger(value.restIndex) &&
      Number(value.restIndex) >= 0 &&
      Number(value.restIndex) < 3);
  return rowsValid && historyValid && timerValid;
}

export function readBenchSnapshot(
  raw: string | null,
  now: number,
): BenchSession {
  try {
    const stored: unknown = raw ? JSON.parse(raw) : null;
    if (validSession(stored)) {
      return stored.restUntil !== null && stored.restUntil <= now
        ? { ...stored, ...clearRest }
        : stored;
    }
  } catch {
    // An invalid snapshot cannot represent a workout.
  }
  return createBenchSession();
}

function restoreSession() {
  try {
    return readBenchSnapshot(
      window.sessionStorage.getItem(storageKey),
      Date.now(),
    );
  } catch {
    // Session storage may be unavailable in private or embedded browsers.
    return createBenchSession();
  }
}

export function useBenchSession() {
  // Server and first browser render share a deterministic example.
  const [session, setSession] = useState(createBenchSession);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(0);
  const latest = useRef<BenchSession | null>(null);

  useEffect(() => {
    latest.current ??= restoreSession();
    setSession(latest.current);
    setNow(Date.now());
    setReady(true);
  }, []);

  const apply = useCallback((action: Action) => {
    const timestamp = Date.now();
    const current = latest.current ?? restoreSession();
    const next = updateBenchSession(current, action, timestamp);
    if (!next) return false;
    latest.current = next;
    setSession(next);
    setNow(timestamp);
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // The exercise still works in this page when storage is unavailable.
    }
    return true;
  }, []);

  useEffect(() => {
    if (!ready || session.phase !== "workout") return;
    const pending = session.rows.flatMap((row, index) =>
      hasPendingEdit(row) && !setError(row) ? [index] : [],
    );
    if (!pending.length) return;
    const timer = window.setTimeout(() => {
      for (const index of pending) {
        if (latest.current?.rows[index]?.saved) apply({ type: "save", index });
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [ready, session.phase, session.rows, apply]);

  useEffect(() => {
    const deadline = session.restUntil;
    if (deadline === null) return;
    let timer: number;
    const tick = () => {
      window.clearTimeout(timer);
      const timestamp = Date.now();
      const left = deadline - timestamp;
      setNow(timestamp);
      if (left > 0) timer = window.setTimeout(tick, left % 1000 || 1000);
      else if (latest.current?.restUntil === deadline)
        apply({ type: "skipRest" });
    };
    tick();
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("pageshow", tick);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("pageshow", tick);
    };
  }, [session.restUntil, apply]);

  return {
    session,
    ready,
    remaining:
      session.restUntil === null
        ? 0
        : Math.max(0, Math.ceil((session.restUntil - now) / 1000)),
    setDraft: (index: number, field: DraftField, value: string) =>
      apply({ type: "draft", index, field, value }),
    saveSet: (index: number) => apply({ type: "save", index }),
    uncheckSet: (index: number) => apply({ type: "uncheck", index }),
    skipRest: () => apply({ type: "skipRest" }),
    finish: () => apply({ type: "finish" }),
    nextWorkout: () => apply({ type: "nextWorkout" }),
  };
}
