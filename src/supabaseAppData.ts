import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  createId,
  defaultState,
  exerciseCatalog,
  loadStateForAccount
} from "./appData";
import type {
  AppState,
  ExerciseTemplate,
  ExerciseUnit,
  HistoryEntry,
  LocalAccount,
  MatchItem,
  ProfileMode,
  ProgramExercise,
  TrainingProgram,
  WorkoutDay
} from "./appTypes";
import {
  getSupabaseClient,
  getSupabaseSession,
  resolveSupabaseAssetUrl,
  signOutSupabase
} from "./supabaseClient";

type Row = Record<string, unknown>;
type RemoteList<T> = { loaded: boolean; items: T[] };
type RemoteMatchState = {
  loaded: boolean;
  queue: MatchItem[];
  liked: MatchItem[];
  skipped: MatchItem[];
};

export type SupabaseAccountState = {
  account: LocalAccount;
  state: AppState;
};

const exerciseColumns =
  "id,navn,name_da,name_en,image_url,imagine_url,beskrivelse,muskelgruppe,primary_muscle_group,equipment_raw";

function isRow(value: unknown): value is Row {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function rows(value: unknown): Row[] {
  return Array.isArray(value) ? value.filter(isRow) : [];
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function integerValue(value: unknown, fallback = 0) {
  return Math.trunc(numberValue(value, fallback));
}

function boolValue(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    return ["true", "1", "yes", "y", "on"].includes(value.trim().toLowerCase());
  }
  return fallback;
}

function dateValue(value: unknown) {
  const rawValue = text(value);
  if (!rawValue) return null;
  const timestamp = Date.parse(rawValue);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function profileModeKey(mode: ProfileMode) {
  return mode === "Træner" ? "trainer" : "personal";
}

function profileModeTitle(value: unknown, fallback: ProfileMode): ProfileMode {
  const normalized = text(value).toLowerCase();
  if (["trainer", "coach", "traener", "træner"].includes(normalized)) return "Træner";
  if (["personal", "personlig", "privat"].includes(normalized)) return "Personlig";
  return fallback;
}

function displayNameFromUser(user: User) {
  const metadata = isRow(user.user_metadata) ? user.user_metadata : {};
  return (
    text(metadata.name) ||
    text(metadata.full_name) ||
    text(metadata.display_name) ||
    text(user.email).split("@")[0] ||
    "Træningsmester"
  );
}

function accountFromUser(user: User): LocalAccount {
  const email = text(user.email).toLowerCase();
  return {
    email,
    name: displayNameFromUser(user),
    passwordHash: "supabase-managed",
    createdAt: user.created_at ?? new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    provider: "supabase",
    remoteUserId: user.id
  };
}

function exerciseName(row: Row, fallback = "Øvelse") {
  return text(row.name_da) || text(row.navn) || text(row.name_en) || fallback;
}

function exerciseTemplateFromRow(row: Row): ExerciseTemplate {
  return {
    id: text(row.id, createId("remote-ex")),
    name: exerciseName(row),
    muscle: text(row.primary_muscle_group) || text(row.muskelgruppe, "Ukendt"),
    equipment: text(row.equipment_raw, "Udstyr"),
    description: text(row.beskrivelse, "Ingen beskrivelse endnu."),
    image: resolveSupabaseAssetUrl(text(row.image_url) || text(row.imagine_url))
  };
}

function matchItemFromExercise(row: Row): MatchItem {
  return {
    ...exerciseTemplateFromRow(row),
    level: "Mellem"
  };
}

function programExerciseFromRows(row: Row, exerciseRow: Row | undefined): ProgramExercise {
  const repsFrom = integerValue(row.gentagelser);
  const repsTo = integerValue(row.setsTo);
  const reps =
    repsFrom > 0 && repsTo > 0 && repsFrom !== repsTo
      ? `${repsFrom}-${repsTo}`
      : repsFrom > 0
        ? String(repsFrom)
        : text(row.reps, "8-12");
  const weight = text(row.vaegt) || text(row.weight, "0");
  const unit: ExerciseUnit =
    weight.toLowerCase() === "bw" || weight.toLowerCase() === "kropsvægt"
      ? "bw"
      : reps.toLowerCase().includes("sek")
        ? "time"
        : "kg";

  return {
    id: text(row.id, createId("remote-pex")),
    exerciseId: text(row.exercise_id, text(exerciseRow?.id, createId("remote-ex"))),
    name: exerciseRow ? exerciseName(exerciseRow) : "Øvelse",
    sets: Math.max(1, integerValue(row.sets, 3)),
    reps,
    weight,
    restSeconds: Math.max(0, integerValue(row.rest_seconds, 120)),
    note: text(row.notes),
    unit,
    amrap: row.amrap_set_index !== null && row.amrap_set_index !== undefined,
    dropset: boolValue(row.dropset_enabled),
    supersetGroupId: text(row.superset_group_id) || undefined,
    supersetPosition:
      row.superset_position === null || row.superset_position === undefined
        ? undefined
        : integerValue(row.superset_position)
  };
}

function logReadError(scope: string, error: unknown) {
  console.warn(`Supabase ${scope} kunne ikke hentes`, error);
}

async function fetchUserSettings(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from("user_settings")
    .select(
      "user_id,FLOW,TRACKER,bodyweight_kg,username,phone_number,set_rest_timer_enabled,helptext,onboarding_completed_at"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    logReadError("settings", error);
    return { loaded: false, row: null as Row | null };
  }
  return { loaded: true, row: isRow(data) ? data : null };
}

async function fetchExerciseRowsByIds(client: SupabaseClient, ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (!uniqueIds.length) return [] as Row[];
  const { data, error } = await client
    .from("exercises")
    .select(exerciseColumns)
    .in("id", uniqueIds);
  if (error) {
    logReadError("øvelsesdetaljer", error);
    return [] as Row[];
  }
  return rows(data);
}

async function fetchPrograms(
  client: SupabaseClient,
  userId: string,
  profileMode: string
): Promise<RemoteList<TrainingProgram>> {
  const planSelect = "id,user_id,name,description,image_url,isPrimary,current_index,created_at,profile_mode";
  let planRows: Row[] = [];

  const accessible = await client
    .from("accessible_plans_view")
    .select(planSelect)
    .eq("profile_mode", profileMode)
    .order("isPrimary", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(25);

  if (accessible.error) {
    const fallback = await client
      .from("plan")
      .select(planSelect)
      .eq("user_id", userId)
      .eq("profile_mode", profileMode)
      .order("isPrimary", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(25);
    if (fallback.error) {
      logReadError("programmer", fallback.error);
      return { loaded: false, items: [] };
    }
    planRows = rows(fallback.data);
  } else {
    planRows = rows(accessible.data);
  }

  if (!planRows.length) return { loaded: true, items: [] };

  const planIds = planRows.map((row) => text(row.id)).filter(Boolean);
  const dayResponse = await client
    .from("plan_workouts")
    .select("id,plan_id,workout_id,dayOfTheWeek,Index,notes")
    .in("plan_id", planIds)
    .order("Index", { ascending: true });

  if (dayResponse.error) {
    logReadError("træningsdage", dayResponse.error);
    return { loaded: false, items: [] };
  }

  const dayRows = rows(dayResponse.data);
  const workoutIds = dayRows.map((row) => text(row.workout_id)).filter(Boolean);
  const workoutResponse = workoutIds.length
    ? await client
        .from("workout")
        .select("id,user_id,name,description,image_url,profile_mode,created_at")
        .in("id", Array.from(new Set(workoutIds)))
    : { data: [], error: null };

  if (workoutResponse.error) {
    logReadError("workouts", workoutResponse.error);
    return { loaded: false, items: [] };
  }

  const workoutRows = rows(workoutResponse.data);
  const workoutExerciseResponse = workoutIds.length
    ? await client
        .from("workout_exercises")
        .select(
          "id,workout_day_id,exercise_id,sets,gentagelser,setsTo,vaegt,notes,rest_seconds,dropset_enabled,superset_group_id,superset_position,amrap_set_index,created_at"
        )
        .in("workout_day_id", Array.from(new Set(workoutIds)))
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (workoutExerciseResponse.error) {
    logReadError("programøvelser", workoutExerciseResponse.error);
    return { loaded: false, items: [] };
  }

  const workoutExerciseRows = rows(workoutExerciseResponse.data);
  const exerciseRows = await fetchExerciseRowsByIds(
    client,
    workoutExerciseRows.map((row) => text(row.exercise_id)).filter(Boolean)
  );

  const workoutsById = new Map(workoutRows.map((row) => [text(row.id), row]));
  const exercisesById = new Map(exerciseRows.map((row) => [text(row.id), row]));
  const workoutExercisesByWorkoutId = new Map<string, Row[]>();
  for (const row of workoutExerciseRows) {
    const workoutId = text(row.workout_day_id);
    workoutExercisesByWorkoutId.set(workoutId, [
      ...(workoutExercisesByWorkoutId.get(workoutId) ?? []),
      row
    ]);
  }

  const daysByPlanId = new Map<string, WorkoutDay[]>();
  for (const row of dayRows) {
    const planId = text(row.plan_id);
    const workoutId = text(row.workout_id);
    const workout = workoutsById.get(workoutId);
    const exercises = (workoutExercisesByWorkoutId.get(workoutId) ?? []).map((exerciseRow) =>
      programExerciseFromRows(exerciseRow, exercisesById.get(text(exerciseRow.exercise_id)))
    );
    const day: WorkoutDay = {
      id: text(row.id, workoutId || createId("remote-day")),
      name: text(workout?.name, "Træningsdag"),
      description: text(workout?.description) || text(row.notes),
      weekday: text(row.dayOfTheWeek, "Mandag"),
      image: resolveSupabaseAssetUrl(text(workout?.image_url)),
      exercises
    };
    daysByPlanId.set(planId, [...(daysByPlanId.get(planId) ?? []), day]);
  }

  const programs = planRows.map((row, index): TrainingProgram => {
    const planId = text(row.id, createId("remote-program"));
    return {
      id: planId,
      name: text(row.name, "Program"),
      description: text(row.description),
      center: "Træningscenter",
      image: resolveSupabaseAssetUrl(text(row.image_url)),
      active: boolValue(row.isPrimary) || index === 0,
      visibility: text(row.user_id) === userId ? "Privat" : "Delt",
      days: daysByPlanId.get(planId) ?? []
    };
  });

  return { loaded: true, items: programs };
}

function historyFromStrengthRows(strengthRows: Row[]): HistoryEntry[] {
  const groups = new Map<string, Row[]>();
  for (const row of strengthRows) {
    const date = dateValue(row.trackerlog_created_at);
    if (!date) continue;
    const dayKey = date.slice(0, 10);
    const workoutId = text(row.workout_id, "workout");
    const key = `${dayKey}:${workoutId}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return Array.from(groups.entries()).map(([key, group]) => {
    const first = group[0];
    const date = dateValue(first.trackerlog_created_at) ?? new Date().toISOString();
    const exerciseNames = Array.from(
      new Set(group.map((row) => exerciseName(row, "Øvelse")).filter(Boolean))
    );
    const volumeKg = group.reduce((sum, row) => {
      const reps = numberValue(row.reps);
      const weight = numberValue(row.weight);
      return sum + reps * weight;
    }, 0);
    const durationMinutes = Math.max(
      0,
      Math.round(Math.max(...group.map((row) => numberValue(row.duration_seconds))) / 60)
    );
    return {
      id: `remote-strength-${key}`,
      title: text(first.workout_name, "Styrketræning"),
      kind: "Styrketræning",
      date,
      durationMinutes,
      volumeKg: Math.round(volumeKg),
      sets: group.length,
      exercises: exerciseNames,
      note: "Supabase"
    };
  });
}

function activityTitle(value: unknown) {
  const family = text(value).toLowerCase();
  if (family.includes("run")) return "Løb";
  if (family.includes("walk")) return "Gang";
  if (family.includes("cycl") || family.includes("bike")) return "Cykling";
  if (family.includes("swim")) return "Svømning";
  if (family.includes("row")) return "Roning";
  if (family.includes("elliptical") || family.includes("cross")) return "Crosstrainer";
  if (family.includes("ski")) return "Ski";
  return text(value, "Cardio");
}

function durationMinutesFromActivity(row: Row) {
  const direct = numberValue(row.total_duration_seconds);
  if (direct > 0) return Math.round(direct / 60);
  const started = Date.parse(text(row.started_at));
  const ended = Date.parse(text(row.ended_at));
  if (Number.isFinite(started) && Number.isFinite(ended) && ended > started) {
    return Math.round((ended - started) / 60000);
  }
  return 0;
}

async function fetchHistory(
  client: SupabaseClient,
  userId: string,
  profileMode: string
): Promise<RemoteList<HistoryEntry>> {
  const strengthResponse = await client
    .from("user_trackerlog_exercises")
    .select(
      "trackerlog_id,trackerlog_created_at,user_id,workout_id,workout_name,reps,weight,duration_seconds,exercise_id,navn,name_da,name_en"
    )
    .eq("user_id", userId)
    .order("trackerlog_created_at", { ascending: false })
    .limit(150);

  const activityResponse = await client
    .from("activity_sessions")
    .select(
      "id,user_id,profile_mode,activity_family,status,started_at,ended_at,total_duration_seconds,distance_meters"
    )
    .eq("user_id", userId)
    .eq("profile_mode", profileMode)
    .order("started_at", { ascending: false })
    .limit(50);

  if (strengthResponse.error && activityResponse.error) {
    logReadError("historik", { strength: strengthResponse.error, activity: activityResponse.error });
    return { loaded: false, items: [] };
  }

  if (strengthResponse.error) logReadError("styrkehistorik", strengthResponse.error);
  if (activityResponse.error) logReadError("cardiohistorik", activityResponse.error);

  const strengthHistory = strengthResponse.error
    ? []
    : historyFromStrengthRows(rows(strengthResponse.data));
  const cardioHistory = activityResponse.error
    ? []
    : rows(activityResponse.data).map((row): HistoryEntry => {
        const date = dateValue(row.started_at) ?? new Date().toISOString();
        const distanceKm = numberValue(row.distance_meters) / 1000;
        const title = activityTitle(row.activity_family);
        return {
          id: `remote-cardio-${text(row.id, createId("cardio"))}`,
          title,
          kind: "Cardio",
          date,
          durationMinutes: durationMinutesFromActivity(row),
          distanceKm: distanceKm > 0 ? Number(distanceKm.toFixed(2)) : undefined,
          volumeKg: 0,
          sets: 0,
          exercises: distanceKm > 0 ? [title, `${distanceKm.toFixed(2)} km`] : [title],
          note: text(row.status)
        };
      });

  return {
    loaded: !strengthResponse.error || !activityResponse.error,
    items: [...strengthHistory, ...cardioHistory]
      .sort((left, right) => Date.parse(right.date) - Date.parse(left.date))
      .slice(0, 50)
  };
}

async function fetchMatchState(
  client: SupabaseClient,
  userId: string,
  profileMode: string
): Promise<RemoteMatchState> {
  const [exerciseResponse, swipeResponse] = await Promise.all([
    client.from("exercises").select(exerciseColumns).limit(80),
    client
      .from("match")
      .select("id,exercise_id,liked,unliked,Swiped,liked_at,created_at")
      .eq("user_id", userId)
      .eq("profile_mode", profileMode)
      .limit(400)
  ]);

  if (exerciseResponse.error && swipeResponse.error) {
    logReadError("match", { exercises: exerciseResponse.error, swipes: swipeResponse.error });
    return { loaded: false, queue: [], liked: [], skipped: [] };
  }

  if (exerciseResponse.error) logReadError("matchøvelser", exerciseResponse.error);
  if (swipeResponse.error) logReadError("matchswipes", swipeResponse.error);

  const swipeRows = swipeResponse.error ? [] : rows(swipeResponse.data);
  const exerciseRows = exerciseResponse.error ? [] : rows(exerciseResponse.data);
  const extraExerciseRows = await fetchExerciseRowsByIds(
    client,
    swipeRows.map((row) => text(row.exercise_id)).filter(Boolean)
  );

  const exerciseById = new Map<string, Row>();
  for (const row of [...exerciseRows, ...extraExerciseRows]) {
    exerciseById.set(text(row.id), row);
  }

  const swipedIds = new Set(swipeRows.map((row) => text(row.exercise_id)).filter(Boolean));
  const queue = exerciseRows
    .filter((row) => !swipedIds.has(text(row.id)))
    .map(matchItemFromExercise);
  const liked = swipeRows
    .filter((row) => boolValue(row.liked))
    .map((row) => exerciseById.get(text(row.exercise_id)))
    .filter(isRow)
    .map(matchItemFromExercise);
  const skipped = swipeRows
    .filter((row) => boolValue(row.unliked) || boolValue(row.Swiped))
    .map((row) => exerciseById.get(text(row.exercise_id)))
    .filter(isRow)
    .map(matchItemFromExercise);

  return {
    loaded: !exerciseResponse.error || !swipeResponse.error,
    queue,
    liked,
    skipped
  };
}

function applySettingsToState(
  state: AppState,
  account: LocalAccount,
  settings: { loaded: boolean; row: Row | null },
  onboardingCompleted?: boolean
): AppState {
  const row = settings.row;
  const bodyweight = row ? numberValue(row.bodyweight_kg) : 0;
  const remoteOnboardingCompleted =
    row?.onboarding_completed_at === null || row?.onboarding_completed_at === undefined
      ? state.auth.onboardingCompleted
      : Boolean(row.onboarding_completed_at);
  return {
    ...state,
    auth: {
      loggedIn: true,
      onboardingCompleted:
        onboardingCompleted ?? remoteOnboardingCompleted
    },
    profile: {
      ...state.profile,
      email: account.email,
      name: text(row?.username) || account.name || state.profile.name,
      phone: text(row?.phone_number, state.profile.phone),
      mode: state.profile.mode,
      bodyweight: bodyweight > 0 ? String(bodyweight) : state.profile.bodyweight,
      trainingFlow: row ? boolValue(row.FLOW, state.profile.trainingFlow) : state.profile.trainingFlow,
      trackerLogging: row
        ? boolValue(row.TRACKER, state.profile.trackerLogging)
        : state.profile.trackerLogging,
      restTimer: row
        ? boolValue(row.set_rest_timer_enabled, state.profile.restTimer)
        : state.profile.restTimer,
      helperText: row ? boolValue(row.helptext, state.profile.helperText) : state.profile.helperText
    }
  };
}

async function buildSupabaseStateForUser(
  client: SupabaseClient,
  user: User,
  options: { onboardingCompleted?: boolean } = {}
): Promise<SupabaseAccountState> {
  const account = accountFromUser(user);
  const cached = loadStateForAccount(account, options);
  const settings = await fetchUserSettings(client, user.id);
  const profileMode = profileModeKey(cached.profile.mode);
  const [programs, history, matchState] = await Promise.all([
    fetchPrograms(client, user.id, profileMode),
    fetchHistory(client, user.id, profileMode),
    fetchMatchState(client, user.id, profileMode)
  ]);
  const stateWithSettings = applySettingsToState(cached, account, settings, options.onboardingCompleted);

  return {
    account,
    state: {
      ...stateWithSettings,
      programs: programs.loaded ? programs.items : cached.programs,
      history: history.loaded ? history.items : cached.history,
      matchQueue: matchState.loaded ? matchState.queue : cached.matchQueue,
      likedMatches: matchState.loaded ? matchState.liked : cached.likedMatches,
      skippedMatches: matchState.loaded ? matchState.skipped : cached.skippedMatches,
      activeSession: cached.activeSession
    }
  };
}

export async function authenticateSupabaseAccount(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });
  if (error) throw new Error("Email eller adgangskode er forkert i Supabase.");
  if (!data.user) throw new Error("Supabase returnerede ingen bruger.");
  return buildSupabaseStateForUser(client, data.user);
}

export async function registerSupabaseAccount(input: {
  email: string;
  password: string;
  name: string;
}) {
  const client = getSupabaseClient();
  if (!client) return null;
  const cleanEmail = input.email.trim().toLowerCase();
  const { data, error } = await client.auth.signUp({
    email: cleanEmail,
    password: input.password,
    options: {
      data: {
        name: input.name.trim() || cleanEmail
      }
    }
  });
  if (error) throw new Error(error.message || "Supabase kunne ikke oprette kontoen.");
  if (!data.session || !data.user) {
    throw new Error("Kontoen er oprettet i Supabase. Bekræft emailen og log ind.");
  }
  return buildSupabaseStateForUser(client, data.user, { onboardingCompleted: false });
}

export async function restoreSupabaseSessionState() {
  const session = await getSupabaseSession();
  if (!session?.user) return null;
  const client = getSupabaseClient();
  if (!client) return null;
  return buildSupabaseStateForUser(client, session.user);
}

export async function signOutSupabaseAccount() {
  await signOutSupabase();
}
