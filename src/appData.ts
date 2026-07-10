import type {
  ActiveSession,
  AppState,
  ExerciseTemplate,
  HistoryEntry,
  LocalAccount,
  MatchItem,
  ProgramExercise,
  TrainingProgram,
  WorkoutDay
} from "./appTypes";

export const STORAGE_KEY = "tm-react-workbench-state-v1";
export const AUTH_STORAGE_KEY = "tm-react-workbench-auth-v1";

const id = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const createId = id;

export const exerciseCatalog: ExerciseTemplate[] = [
  {
    id: "ex-leg-press",
    name: "Pin Loaded Leg Press",
    muscle: "Ben",
    equipment: "Maskine",
    description: "Stabil benpres med kontrolleret dybde og rolig excentrisk fase.",
    image: "/photos/program-training.jpg"
  },
  {
    id: "ex-cable-fly",
    name: "Single Arm Cable Flyes",
    muscle: "Bryst",
    equipment: "Kabel",
    description: "Ensidig fly med fokus på skulderposition og kontakt i brystet.",
    image: "/photos/logger-training.jpg"
  },
  {
    id: "ex-bench",
    name: "Barbell Bench Press",
    muscle: "Bryst",
    equipment: "Stang",
    description: "Klassisk pres med stabil opspænding og tydelig progression.",
    image: "/photos/hero-training.jpg"
  },
  {
    id: "ex-row",
    name: "Seated Cable Row",
    muscle: "Ryg",
    equipment: "Kabel",
    description: "Rygtræk med kontrolleret skulderblad og neutral torso.",
    image: "/photos/coach-training.jpg"
  },
  {
    id: "ex-raise",
    name: "Lateral Raise",
    muscle: "Skuldre",
    equipment: "Håndvægte",
    description: "Let sidehævning med stop før momentum overtager.",
    image: "/photos/team-training.jpg"
  },
  {
    id: "ex-plank",
    name: "Planke",
    muscle: "Core",
    equipment: "Kropsvægt",
    description: "Isometrisk core-arbejde med stabil vejrtrækning."
  }
];

export const matchSeed: MatchItem[] = [
  {
    ...exerciseCatalog[1],
    id: "match-cable-fly",
    level: "Mellem"
  },
  {
    ...exerciseCatalog[3],
    id: "match-row",
    level: "Let"
  },
  {
    ...exerciseCatalog[4],
    id: "match-raise",
    level: "Mellem"
  },
  {
    ...exerciseCatalog[5],
    id: "match-plank",
    level: "Hård"
  }
];

export function createProgramExercise(
  template: ExerciseTemplate = exerciseCatalog[0]
): ProgramExercise {
  return {
    id: id("pex"),
    exerciseId: template.id,
    name: template.name,
    sets: 3,
    reps: template.id === "ex-plank" ? "45 sek" : "8-12",
    weight: template.id === "ex-plank" ? "bw" : "0",
    restSeconds: 120,
    note: "",
    unit: template.id === "ex-plank" ? "time" : "kg",
    amrap: false,
    dropset: false
  };
}

export function createWorkoutDay(name = "Ny træningsdag"): WorkoutDay {
  return {
    id: id("day"),
    name,
    description: "Tilpas dagen med øvelser, standarder og noter.",
    weekday: "Mandag",
    exercises: [createProgramExercise(exerciseCatalog[0])]
  };
}

export function createTrainingProgram(name = "Nyt program"): TrainingProgram {
  return {
    id: id("program"),
    name,
    description: "Byg programmet op dag for dag.",
    center: "Træningscenter",
    active: false,
    visibility: "Privat",
    days: [createWorkoutDay("Push")]
  };
}

function seedProgramExercise(input: {
  id: string;
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  weight: string;
  restSeconds: number;
  note?: string;
}): ProgramExercise {
  return {
    ...createProgramExercise(exerciseCatalog[0]),
    ...input,
    unit: "kg",
    amrap: false,
    dropset: false,
    note: input.note ?? ""
  };
}

const starterProgram: TrainingProgram = {
  id: "program-starter-ppl",
  name: "Fase 2 efter recovery",
  description: "Denne træningsplan kommer efter recovery",
  center: "Fitness World",
  image: "/photos/recovery-program.png",
  active: true,
  visibility: "Privat",
  days: [
    {
      id: "day-push",
      name: "Push",
      description: "God dag til en god mand",
      weekday: "Mandag",
      image: "/photos/push-day.png",
      exercises: [
        seedProgramExercise({
          id: "push-pec-deck",
          exerciseId: "seed-pec-deck",
          name: "Pin Loaded Pec Deck Flyes",
          sets: 2,
          reps: "8-12",
          weight: "66",
          restSeconds: 60
        }),
        seedProgramExercise({
          id: "push-cable-fly",
          exerciseId: "ex-cable-fly",
          name: "Single Arm Cable Flyes",
          sets: 2,
          reps: "6-10",
          weight: "10",
          restSeconds: 60,
          note: "Med håndtag, kontrolleret"
        }),
        seedProgramExercise({
          id: "push-bench",
          exerciseId: "ex-bench",
          name: "Barbell Bench Press",
          sets: 3,
          reps: "3-8",
          weight: "70",
          restSeconds: 150
        }),
        seedProgramExercise({
          id: "push-skull-crushers",
          exerciseId: "seed-skull-crushers",
          name: "Lying Barbell Skull Crushers",
          sets: 2,
          reps: "8-12",
          weight: "15",
          restSeconds: 90
        }),
        seedProgramExercise({
          id: "push-rope-pushdowns",
          exerciseId: "seed-rope-pushdowns",
          name: "Cable Rope Pushdowns",
          sets: 2,
          reps: "6-10",
          weight: "40",
          restSeconds: 90
        }),
        seedProgramExercise({
          id: "push-single-tricep",
          exerciseId: "seed-single-tricep",
          name: "Single Arm Tricep Cable",
          sets: 2,
          reps: "8-12",
          weight: "12",
          restSeconds: 75
        }),
        seedProgramExercise({
          id: "push-lateral-raise",
          exerciseId: "ex-raise",
          name: "Lateral Raise",
          sets: 3,
          reps: "10-15",
          weight: "8",
          restSeconds: 75
        })
      ]
    },
    {
      id: "day-pull",
      name: "Pull",
      description: "Husk kalk!!",
      weekday: "Onsdag",
      exercises: [
        {
          ...createProgramExercise(exerciseCatalog[3]),
          id: "pull-row",
          sets: 4,
          reps: "8-12",
          weight: "55",
          restSeconds: 120
        }
      ]
    },
    {
      id: "day-legs",
      name: "Legs",
      description: "Ben og core uden unødvendig støj.",
      weekday: "Fredag",
      image: "/photos/program-training.jpg",
      exercises: [
        {
          ...createProgramExercise(exerciseCatalog[0]),
          id: "legs-press",
          sets: 3,
          reps: "10-15",
          weight: "120",
          restSeconds: 150
        },
        {
          ...createProgramExercise(exerciseCatalog[5]),
          id: "legs-plank",
          sets: 3,
          reps: "45 sek",
          weight: "bw",
          restSeconds: 75
        }
      ]
    }
  ]
};

function todayIso(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
}

const seedHistory: HistoryEntry[] = [
  {
    id: "hist-cycling",
    title: "Cykling",
    kind: "Cardio",
    date: todayIso(-1),
    durationMinutes: 34,
    distanceKm: 12.4,
    volumeKg: 0,
    sets: 0,
    exercises: ["Udendørs cykling"],
    note: "Rolig tur med jævn intensitet."
  },
  {
    id: "hist-strength",
    title: "Push",
    kind: "Styrketræning",
    date: todayIso(-3),
    durationMinutes: 58,
    volumeKg: 951,
    sets: 13,
    exercises: ["Single Arm Cable Flyes", "Barbell Bench Press"],
    note: "Bedre kontrol på flyes."
  }
];

export const defaultState: AppState = {
  auth: {
    loggedIn: false,
    onboardingCompleted: true
  },
  profile: {
    name: "Christian",
    email: "christian@example.com",
    phone: "53637360",
    mode: "Personlig",
    theme: "light",
    bodyweight: "82",
    trainingFlow: true,
    trackerLogging: true,
    restTimer: true,
    countdown: true,
    deloadSuggestions: true,
    liveActivity: true,
    keepScreenAwake: true,
    helperText: true,
    cardioShortcut: true,
    trainingForms: ["Styrketræning"],
    onboardingStartMode: "starter"
  },
  programs: [starterProgram],
  activeSession: null,
  history: seedHistory,
  matchQueue: matchSeed,
  likedMatches: [],
  skippedMatches: [],
  social: {
    friendCode: "579417",
    hiddenHistoryIds: []
  }
};

const defaultAccounts: LocalAccount[] = [
  {
    email: "christian@example.com",
    name: "Christian",
    passwordHash: "ec344c84d0f6e51ba0135e5737611df217cf67ec17c7a4874ff3503157558c90",
    createdAt: "2026-06-25T00:00:00.000Z"
  },
  {
    email: "test@test.dk",
    name: "Testbruger",
    passwordHash: "b28b18c2b8610f517b652287f8b14ea92dfcab5373f7d718508f1a5f6cf07551",
    createdAt: "2026-06-25T00:00:00.000Z"
  }
];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function accountStateKey(email: string) {
  return `${STORAGE_KEY}:${normalizeEmail(email)}`;
}

function mergeState(parsed: Partial<AppState>): AppState {
  const programs = (parsed.programs ?? defaultState.programs).map((program) =>
    program.id === starterProgram.id &&
    (program.name === "Push Pull Legs" ||
      program.days[0]?.exercises.length < starterProgram.days[0]?.exercises.length)
      ? { ...starterProgram, active: program.active }
      : program
  );

  return {
    ...defaultState,
    ...parsed,
    auth: { ...defaultState.auth, ...parsed.auth },
    profile: { ...defaultState.profile, ...parsed.profile },
    social: { ...defaultState.social, ...parsed.social },
    programs,
    history: parsed.history ?? defaultState.history,
    matchQueue: parsed.matchQueue ?? defaultState.matchQueue,
    likedMatches: parsed.likedMatches ?? defaultState.likedMatches,
    skippedMatches: parsed.skippedMatches ?? defaultState.skippedMatches,
    activeSession: parsed.activeSession ?? null
  };
}

function stableFriendCode(email: string) {
  let hash = 0;
  for (const char of normalizeEmail(email)) {
    hash = (hash * 31 + char.charCodeAt(0)) % 900000;
  }
  return String(100000 + hash).slice(0, 6);
}

function fallbackHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fallback-${(hash >>> 0).toString(16)}`;
}

export async function hashLocalPassword(email: string, password: string) {
  const value = `${normalizeEmail(email)}:${password}`;
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.subtle) {
    const bytes = new TextEncoder().encode(value);
    const digest = await cryptoApi.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  return fallbackHash(value);
}

export function loadAccounts(): LocalAccount[] {
  if (typeof window === "undefined") return defaultAccounts;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as LocalAccount[]) : [];
    const merged = [...defaultAccounts];
    for (const account of parsed) {
      const email = normalizeEmail(account.email);
      if (!email || !account.passwordHash) continue;
      const index = merged.findIndex((item) => item.email === email);
      const normalized = { ...account, email };
      if (index >= 0) merged[index] = { ...merged[index], ...normalized };
      else merged.push(normalized);
    }
    return merged;
  } catch {
    return defaultAccounts;
  }
}

export function saveAccounts(accounts: LocalAccount[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    /* Local auth persistence can be unavailable in restricted browser contexts. */
  }
}

export async function authenticateLocalAccount(email: string, password: string) {
  const cleanEmail = normalizeEmail(email);
  const accounts = loadAccounts();
  const account = accounts.find((item) => item.email === cleanEmail);
  if (!account) return null;
  const passwordHash = await hashLocalPassword(cleanEmail, password);
  if (account.passwordHash !== passwordHash) return null;
  const updated = accounts.map((item) =>
    item.email === cleanEmail
      ? { ...item, lastLoginAt: new Date().toISOString() }
      : item
  );
  saveAccounts(updated);
  return updated.find((item) => item.email === cleanEmail) ?? account;
}

export async function registerLocalAccount(input: {
  email: string;
  name: string;
  password: string;
}) {
  const cleanEmail = normalizeEmail(input.email);
  const accounts = loadAccounts();
  if (accounts.some((account) => account.email === cleanEmail)) {
    return null;
  }
  const now = new Date().toISOString();
  const account: LocalAccount = {
    email: cleanEmail,
    name: input.name.trim() || cleanEmail,
    passwordHash: await hashLocalPassword(cleanEmail, input.password),
    createdAt: now,
    lastLoginAt: now
  };
  saveAccounts([...accounts, account]);
  return account;
}

export function loadState(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return mergeState(JSON.parse(raw) as Partial<AppState>);
  } catch {
    return defaultState;
  }
}

export function loadStateForAccount(
  account: Pick<LocalAccount, "email" | "name">,
  options: { onboardingCompleted?: boolean } = {}
): AppState {
  if (typeof window === "undefined") {
    return {
      ...defaultState,
      auth: {
        loggedIn: true,
        onboardingCompleted:
          options.onboardingCompleted ?? defaultState.auth.onboardingCompleted
      },
      profile: {
        ...defaultState.profile,
        email: normalizeEmail(account.email),
        name: account.name
      },
      social: {
        ...defaultState.social,
        friendCode: stableFriendCode(account.email)
      }
    };
  }
  try {
    const raw = window.localStorage.getItem(accountStateKey(account.email));
    const parsed = raw ? mergeState(JSON.parse(raw) as Partial<AppState>) : defaultState;
    return {
      ...parsed,
      auth: {
        ...parsed.auth,
        loggedIn: true,
        onboardingCompleted:
          options.onboardingCompleted ?? parsed.auth.onboardingCompleted
      },
      profile: {
        ...parsed.profile,
        email: normalizeEmail(account.email),
        name: account.name || parsed.profile.name
      },
      social: {
        ...parsed.social,
        friendCode: parsed.social.friendCode || stableFriendCode(account.email)
      }
    };
  } catch {
    return {
      ...defaultState,
      auth: {
        loggedIn: true,
        onboardingCompleted:
          options.onboardingCompleted ?? defaultState.auth.onboardingCompleted
      },
      profile: {
        ...defaultState.profile,
        email: normalizeEmail(account.email),
        name: account.name
      },
      social: {
        ...defaultState.social,
        friendCode: stableFriendCode(account.email)
      }
    };
  }
}

export function saveState(state: AppState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (state.profile.email) {
      window.localStorage.setItem(accountStateKey(state.profile.email), JSON.stringify(state));
    }
  } catch {
    /* Local persistence can be unavailable in restricted browser contexts. */
  }
}

export function buildSession(program: TrainingProgram, day: WorkoutDay): ActiveSession {
  return {
    id: id("session"),
    programId: program.id,
    dayId: day.id,
    startedAt: new Date().toISOString(),
    logs: day.exercises.flatMap((exercise) =>
      Array.from({ length: exercise.sets }, (_, index) => ({
        id: id("set"),
        exerciseId: exercise.id,
        setIndex: index + 1,
        reps: exercise.reps,
        weight: exercise.weight,
        done: false
      }))
    )
  };
}

export function sessionToHistory(
  session: ActiveSession,
  program: TrainingProgram,
  day: WorkoutDay
): HistoryEntry {
  const completedLogs = session.logs.filter((log) => log.done);
  const volumeKg = completedLogs.reduce((sum, log) => {
    const exercise = day.exercises.find((item) => item.id === log.exerciseId);
    const reps = Number.parseInt(log.reps, 10);
    const weight = Number.parseFloat(log.weight.replace(",", "."));
    if (!Number.isFinite(reps) || !Number.isFinite(weight)) return sum;
    return sum + reps * weight;
  }, 0);
  const durationMinutes = Math.max(
    1,
    Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000)
  );

  return {
    id: id("hist"),
    title: day.name,
    kind: "Styrketræning",
    date: new Date().toISOString(),
    durationMinutes,
    volumeKg: Math.round(volumeKg),
    sets: completedLogs.length,
    exercises: day.exercises.map((exercise) => exercise.name),
    note: `${program.name} · ${program.center}`
  };
}
