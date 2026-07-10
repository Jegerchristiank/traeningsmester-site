export type TabId = "programs" | "social" | "training" | "match" | "settings";

export type ThemeMode = "system" | "light" | "dark";

export type ProfileMode = "Personlig" | "Træner";

export type ExerciseUnit = "kg" | "lbs" | "bw" | "time";

export type OnboardingStartMode = "starter" | "build";

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  mode: ProfileMode;
  theme: ThemeMode;
  bodyweight: string;
  trainingFlow: boolean;
  trackerLogging: boolean;
  restTimer: boolean;
  countdown: boolean;
  deloadSuggestions: boolean;
  liveActivity: boolean;
  keepScreenAwake: boolean;
  helperText: boolean;
  cardioShortcut: boolean;
  trainingForms: string[];
  onboardingStartMode: OnboardingStartMode;
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  description: string;
  image?: string;
}

export interface ProgramExercise {
  id: string;
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  weight: string;
  restSeconds: number;
  note: string;
  unit: ExerciseUnit;
  amrap: boolean;
  dropset: boolean;
  supersetGroupId?: string;
  supersetPosition?: number;
}

export interface WorkoutDay {
  id: string;
  name: string;
  description: string;
  weekday: string;
  image?: string;
  exercises: ProgramExercise[];
}

export interface TrainingProgram {
  id: string;
  name: string;
  description: string;
  center: string;
  image?: string;
  active: boolean;
  visibility: "Privat" | "Delt";
  days: WorkoutDay[];
}

export interface SessionSetLog {
  id: string;
  exerciseId: string;
  setIndex: number;
  reps: string;
  weight: string;
  done: boolean;
}

export interface ActiveSession {
  id: string;
  programId: string;
  dayId: string;
  startedAt: string;
  logs: SessionSetLog[];
}

export interface HistoryEntry {
  id: string;
  title: string;
  kind: "Styrketræning" | "Cardio";
  date: string;
  durationMinutes: number;
  distanceKm?: number;
  volumeKg: number;
  sets: number;
  exercises: string[];
  note: string;
}

export interface MatchItem extends ExerciseTemplate {
  level: "Let" | "Mellem" | "Hård";
}

export interface SocialState {
  friendCode: string;
  hiddenHistoryIds: string[];
}

export interface AuthState {
  loggedIn: boolean;
  onboardingCompleted: boolean;
}

export interface LocalAccount {
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  lastLoginAt?: string;
  provider?: "local" | "supabase";
  remoteUserId?: string;
}

export interface AppState {
  auth: AuthState;
  profile: UserProfile;
  programs: TrainingProgram[];
  activeSession: ActiveSession | null;
  history: HistoryEntry[];
  matchQueue: MatchItem[];
  likedMatches: MatchItem[];
  skippedMatches: MatchItem[];
  social: SocialState;
}
