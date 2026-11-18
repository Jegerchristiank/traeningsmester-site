import assert from "node:assert/strict";
import test from "node:test";
import {
  createBenchSession, formatWeight, readBenchSnapshot, setError, updateBenchSession,
  type BenchSession,
} from "../src/benchSession.ts";

type Action = Parameters<typeof updateBenchSession>[1];
const started = Date.UTC(2026, 10, 18, 13);
function step(session: BenchSession, action: Action, delay = 0): BenchSession {
  const next = updateBenchSession(session, action, started + delay);
  assert.ok(next, action.type);
  return next;
}

test("weight and repetitions stay editable; only valid sets become results", () => {
  const initial = createBenchSession();
  assert.deepEqual(initial.rows.map(({ weight, reps }) => [weight, reps]), [
    ["62,5", "8"], ["60", "8"], ["60", "8"],
  ]);
  for (const weight of ["", "   ", "-1", "uendelig", "Infinity"]) {
    const edited = step(initial, { type: "draft", index: 0, field: "weight", value: weight });
    assert.equal(updateBenchSession(edited, { type: "save", index: 0 }, started), null);
    assert.equal(edited.rows[0].weight, weight);
  }
  for (const reps of ["0", "-3", "2,5", ""]) assert.ok(setError({ weight: "60", reps }));
  assert.equal(setError({ weight: "0", reps: "1" }), null);
  for (const input of ["67.5", "67,5"]) {
    const drafted = step(initial, { type: "draft", index: 0, field: "weight", value: input });
    const saved = step(drafted, { type: "save", index: 0 });
    assert.deepEqual(saved.rows[0].saved, { weight: 67.5, reps: 8 });
    assert.equal(formatWeight(saved.rows[0].saved!.weight), "67,5");
    assert.equal(saved.rows[1].weight, "60");
    assert.equal(saved.history.length, 1);
  }
});

test("rest belongs to a new set, survives reload, and ends at its absolute deadline", () => {
  let session = step(createBenchSession(), { type: "save", index: 0 });
  assert.equal(session.restUntil, started + 120_000);
  const snapshot = JSON.stringify(session);
  assert.equal(readBenchSnapshot(snapshot, started + 14_000).restUntil, started + 120_000);
  const expired = readBenchSnapshot(snapshot, started + 120_000);
  assert.equal(expired.restUntil, null);
  assert.equal(expired.restIndex, null);
  assert.deepEqual(expired.rows[0].saved, session.rows[0].saved);
  session = step(session, { type: "draft", index: 0, field: "reps", value: "9" }, 30_000);
  session = step(session, { type: "save", index: 0 }, 30_010);
  assert.equal(session.restUntil, started + 120_000);
  session = step(session, { type: "uncheck", index: 0 }, 40_000);
  assert.equal(session.restUntil, null);
  session = step(session, { type: "save", index: 0 }, 50_000);
  assert.equal(session.restUntil, null);
  session = step(session, { type: "save", index: 1 }, 70_000);
  assert.equal(session.restUntil, started + 190_000);
  session = step(session, { type: "save", index: 2 }, 95_000);
  assert.equal(session.restUntil, started + 190_000);
  assert.equal(step(session, { type: "skipRest" }).restUntil, null);
});

test("finish captures pending edits and preserves the actual order for the next workout", () => {
  let session = createBenchSession();
  assert.equal(updateBenchSession(session, { type: "finish" }, started), null);
  session = step(session, { type: "save", index: 2 });
  session = step(session, { type: "save", index: 0 }, 10_000);
  session = step(session, { type: "draft", index: 0, field: "reps", value: "" });
  assert.equal(updateBenchSession(session, { type: "finish" }, started + 20_000), null);
  session = step(session, { type: "draft", index: 0, field: "reps", value: "7" });
  assert.equal(session.history[0].sets[0].weight, 60);
  const finished = step(session, { type: "finish" }, 20_000);
  assert.equal(finished.phase, "finished");
  assert.equal(finished.restUntil, null);
  assert.deepEqual(finished.history[0].sets, [
    { number: 1, weight: 60, reps: 8 },
    { number: 2, weight: 62.5, reps: 7 },
  ]);
  assert.equal(updateBenchSession(finished, { type: "finish" }, started + 21_000), null);
  const next = step(readBenchSnapshot(JSON.stringify(finished), started + 60_000), { type: "nextWorkout" });
  assert.deepEqual(next.history, finished.history);
  assert.ok(next.rows.every((row) => !row.saved && row.weight === "60" && row.reps === "8"));
});

test("a broken session storage record yields a fresh example", () => {
  for (const raw of [null, "broken", "{}", '{"phase":"workout","rows":[]}']) {
    assert.deepEqual(readBenchSnapshot(raw, started), createBenchSession());
  }
});
