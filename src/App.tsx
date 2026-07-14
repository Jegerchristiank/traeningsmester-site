import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode
} from "react";
import {
  buildSession,
  clearStoredAppState,
  createId,
  createProgramExercise,
  createTrainingProgram,
  createWorkoutDay,
  defaultState,
  authenticateLocalAccount,
  exerciseCatalog,
  loadState,
  loadStateForAccount,
  registerLocalAccount,
  matchSeed,
  saveState,
  sessionToHistory
} from "./appData";
import {
  authenticateSupabaseAccount,
  HEALTH_DATA_CONSENT_VERSION,
  recordSupabaseHealthDataConsent,
  registerSupabaseAccount,
  restoreSupabaseSessionState,
  signOutSupabaseAccount
} from "./supabaseAppData";
import { isSupabaseConfigured } from "./supabaseClient";
import type {
  AppState,
  ExerciseTemplate,
  HistoryEntry,
  MatchItem,
  ProgramExercise,
  TabId,
  TrainingProgram,
  UserProfile,
  WorkoutDay
} from "./appTypes";
import "./styles.css";

type TrainingSegment = "today" | "history" | "cardio";
type SettingsPanel = "overview" | "profile" | "training" | "display" | "premium";

type CardioHistoryInput = {
  title: string;
  durationMinutes: number;
  distanceKm?: number;
  note: string;
};

type ModalState =
  | { type: "program"; program?: TrainingProgram }
  | { type: "day"; programId: string; day?: WorkoutDay }
  | {
      type: "exercise";
      programId: string;
      dayId: string;
      exercise?: ProgramExercise;
    }
  | { type: "exerciseInfo"; exercise: ProgramExercise }
  | { type: "history"; entry?: HistoryEntry }
  | null;

type ExerciseMenuState = {
  programId: string;
  dayId: string;
  exerciseId: string;
} | null;

type MatchHistoryEntry = {
  id: string;
  liked: boolean;
};

type ConfirmState = {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
} | null;

type ConfirmRequest = NonNullable<ConfirmState>;

type ProgramWizardStep = "basics" | "details" | "review";
type OnboardingStepId =
  | "start"
  | "profile"
  | "importProgram"
  | "startPath"
  | "starterProgram"
  | "aiDraft"
  | "programReview"
  | "restTimer"
  | "tracking"
  | "trainingForms"
  | "flow"
  | "health"
  | "match"
  | "summary";

type OnboardingStepConfig = {
  id: OnboardingStepId;
  title: string;
  subtitle: string;
  badge: string;
  icon: string;
  tone?: "default" | "success";
};

const programWizardSteps: Array<{ id: ProgramWizardStep; title: string }> = [
  { id: "basics", title: "Grundinfo" },
  { id: "details", title: "Detaljer" },
  { id: "review", title: "Gennemse" }
];

const onboardingSteps: OnboardingStepConfig[] = [
  {
    id: "start",
    title: "Klar til første træning",
    subtitle: "Vælg hurtig start, importér dit program eller tilpas opsætningen.",
    badge: "Start",
    icon: "✦"
  },
  {
    id: "profile",
    title: "Hvad skal vi kalde dig?",
    subtitle: "Du kan ændre det senere.",
    badge: "Navn",
    icon: "Aa"
  },
  {
    id: "importProgram",
    title: "Overfør dit gamle program",
    subtitle: "Indsæt tekst eller billeder. Du får en redigérbar kladde.",
    badge: "Import",
    icon: "⇩"
  },
  {
    id: "startPath",
    title: "Hvordan vil du starte?",
    subtitle: "Vælg kun det, du vil bruge nu.",
    badge: "Startvej",
    icon: "↗"
  },
  {
    id: "starterProgram",
    title: "Vælg et gratis startprogram",
    subtitle: "Vælg den kladde, du vil tage med videre til programredigering.",
    badge: "Gratis",
    icon: "⌂"
  },
  {
    id: "aiDraft",
    title: "Lav programudkast med AI",
    subtitle: "Du kan rette udkastet før du fortsætter.",
    badge: "AI",
    icon: "✎"
  },
  {
    id: "programReview",
    title: "Redigér / tilpas program",
    subtitle: "Gennemgå programmet, før du fortsætter.",
    badge: "Program",
    icon: "☑"
  },
  {
    id: "restTimer",
    title: "Vil du have automatisk pausetid mellem sæt?",
    subtitle: "Start pausetimer efter et udført sæt.",
    badge: "Pause",
    icon: "↻"
  },
  {
    id: "tracking",
    title: "Vil du logge detaljer i træningen?",
    subtitle: "Vælg mellem enkel registrering eller fuldt overblik.",
    badge: "Tracking",
    icon: "▥"
  },
  {
    id: "trainingForms",
    title: "Hvilke former for træning dyrker du?",
    subtitle: "Vælg alle der passer. Start cardio-session vises kun, hvis du vælger en konditionsform.",
    badge: "Træning",
    icon: "⌁"
  },
  {
    id: "flow",
    title: "Vil du bruge Træningsflow?",
    subtitle: "Træningsflow åbner næste træningsdag efter afslutning.",
    badge: "Flow",
    icon: "▣"
  },
  {
    id: "health",
    title: "Vil du koble Apple Sundhed på?",
    subtitle: "Tilslut Apple Sundhed, eller indtast kropsvægt manuelt.",
    badge: "Sundhed",
    icon: "⌁"
  },
  {
    id: "match",
    title: "Prøv Match",
    subtitle: "Åbn demoen, eller fortsæt uden.",
    badge: "Demo",
    icon: "◔"
  },
  {
    id: "summary",
    title: "Oversigt",
    subtitle: "Tjek dine valg før du lander i appen.",
    badge: "Klar",
    icon: "✓",
    tone: "success"
  }
];

const onboardingStartPrograms = [
  {
    id: "strong-start",
    title: "Stærk Start",
    meta: "3 dage · begynder",
    description: "Fokus på basisløft og rolig progression.",
    chip: "Anbefalet"
  },
  {
    id: "ppl",
    title: "Push / Pull / Legs",
    meta: "Klassisk split",
    description: "6 dage · lidt øvet",
    chip: "Mest populær"
  },
  {
    id: "bodybuilder",
    title: "Bodybuilder",
    meta: "4 dage · høj hypertrofi",
    description: "Mere volumen og isolationsarbejde."
  }
];

const onboardingTrainingChoices = [
  {
    title: "Styrketræning",
    body: "Sæt, gentagelser, vægt, pauser og styrkehistorik."
  },
  {
    title: "Løb",
    body: "Tid, tempo, distance og rute."
  },
  {
    title: "Gang",
    body: "Gåture med tid, distance og rute."
  },
  {
    title: "Cykling",
    body: "Cykelture med fart, distance og rute."
  },
  {
    title: "Svømning",
    body: "Svømning og vandtræning."
  },
  {
    title: "Roning",
    body: "Rower, ergometer eller udendørs roning."
  },
  {
    title: "Crosstrainer",
    body: "Puls, tid og stabil kondition."
  },
  {
    title: "Ski / ski-erg",
    body: "Ski-erg, langrend og intervaller."
  }
];

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "programs", label: "Programmer" },
  { id: "social", label: "Social" },
  { id: "training", label: "Træning" },
  { id: "match", label: "Match" },
  { id: "settings", label: "Indstillinger" }
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const enduranceTrainingForms = new Set([
  "Løb",
  "Gang",
  "Cykling",
  "Svømning",
  "Roning",
  "Crosstrainer",
  "Ski / ski-erg"
]);

function formatDate(value: string) {
  return new Intl.DateTimeFormat("da-DK", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatRelativeTraining(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / 86400000));
  if (diffDays === 0) return "I dag trænede du";
  if (diffDays === 1) return "I går trænede du";
  return `For ${diffDays} dage siden trænede du`;
}

function toLocalDateTimeInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function fromLocalDateTimeInput(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function formatRestTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function formatExerciseWeight(exercise: ProgramExercise) {
  if (exercise.unit === "time") return exercise.weight;
  if (exercise.unit === "bw") return exercise.weight;
  return `${exercise.weight} ${exercise.unit}`;
}

function getActiveProgram(state: AppState) {
  return state.programs.find((program) => program.active) ?? state.programs[0] ?? null;
}

function getDay(program: TrainingProgram | null, dayId?: string | null) {
  if (!program) return null;
  return program.days.find((day) => day.id === dayId) ?? program.days[0] ?? null;
}

function classNames(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

const modalFocusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])'
].join(",");

function useModalFocus(open: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const restoreFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const siblings = dialog.parentElement
      ? Array.from(dialog.parentElement.children).filter(
          (element): element is HTMLElement =>
            element instanceof HTMLElement && element !== dialog
        )
      : [];
    const previousInert = siblings.map((element) => [element, element.hasAttribute("inert")] as const);
    const previousOverflow = document.body.style.overflow;
    siblings.forEach((element) => element.setAttribute("inert", ""));
    document.body.style.overflow = "hidden";

    const focusable = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(modalFocusableSelector)).filter(
        (element) =>
          !element.matches(".modal-backdrop, .side-backdrop") &&
          !element.hidden &&
          element.getAttribute("aria-hidden") !== "true"
      );

    const initialFocus =
      dialog.querySelector<HTMLElement>("[data-modal-initial-focus]") ?? focusable()[0] ?? dialog;
    window.requestAnimationFrame(() => initialFocus.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      if (!elements.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousInert.forEach(([element, wasInert]) => {
        if (!wasInert) element.removeAttribute("inert");
      });
      document.body.style.overflow = previousOverflow;
      window.requestAnimationFrame(() => restoreFocus?.focus());
    };
  }, [open]);

  return dialogRef;
}

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase("da-DK")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa");
}

function App() {
  const [supabaseEnabled] = useState(() => isSupabaseConfigured());
  const [state, setState] = useState<AppState>(() => {
    if (!supabaseEnabled && import.meta.env.DEV) return loadState();
    return defaultState;
  });
  const [authRestoring, setAuthRestoring] = useState(supabaseEnabled);
  const [healthConsentRequired, setHealthConsentRequired] = useState(false);
  const [tab, setTab] = useState<TabId>("settings");
  const [trainingSegment, setTrainingSegment] = useState<TrainingSegment>("today");
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [expandedExercises, setExpandedExercises] = useState<Record<string, boolean>>({});
  const [matchHistory, setMatchHistory] = useState<MatchHistoryEntry[]>([]);

  useEffect(() => {
    if (!state.auth.loggedIn) return;
    const persist = () => saveState(state, { remoteVerified: supabaseEnabled });
    const timeout = window.setTimeout(persist, 250);
    window.addEventListener("pagehide", persist, { once: true });
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("pagehide", persist);
    };
  }, [state, supabaseEnabled]);

  useEffect(() => {
    if (!supabaseEnabled) {
      setAuthRestoring(false);
      return;
    }
    let cancelled = false;
    restoreSupabaseSessionState()
      .then((result) => {
        if (!result || cancelled) return;
        setState(result.state);
        setHealthConsentRequired(!result.healthDataConsentRecorded);
        setSelectedProgramId(null);
        setTrainingSegment("today");
        setTab(result.state.auth.onboardingCompleted ? "settings" : "training");
      })
      .catch((error) => {
        console.warn("Supabase session restore fejlede", error);
      })
      .finally(() => {
        if (!cancelled) setAuthRestoring(false);
      });
    return () => {
      cancelled = true;
    };
  }, [supabaseEnabled]);

  const activeProgram = getActiveProgram(state);
  const selectedProgram =
    state.programs.find((program) => program.id === selectedProgramId) ??
    activeProgram;
  const activeDay = getDay(activeProgram, state.activeSession?.dayId);
  const currentMatch = state.matchQueue[0] ?? null;
  const nextMatch = state.matchQueue[1] ?? null;
  const matchTotal =
    state.matchQueue.length + state.likedMatches.length + state.skippedMatches.length;
  const matchPosition = currentMatch
    ? Math.min(matchTotal, state.likedMatches.length + state.skippedMatches.length + 1)
    : matchTotal;

  const navigate = (nextTab: TabId) => {
    setTab(nextTab);
    setMenuOpen(false);
    if (nextTab === "training") setTrainingSegment("today");
  };

  const openHistory = () => {
    setTab("training");
    setTrainingSegment("history");
    setMenuOpen(false);
  };

  const updateProfile = (patch: Partial<UserProfile>) => {
    setState((current) => ({
      ...current,
      profile: { ...current.profile, ...patch }
    }));
  };

  const updateProgram = (
    programId: string,
    updater: (program: TrainingProgram) => TrainingProgram
  ) => {
    setState((current) => ({
      ...current,
      programs: current.programs.map((program) =>
        program.id === programId ? updater(program) : program
      )
    }));
  };

  const requestConfirm = (nextConfirm: ConfirmRequest) => {
    setConfirm(nextConfirm);
  };

  const saveProgram = (program: TrainingProgram) => {
    setState((current) => {
      const exists = current.programs.some((item) => item.id === program.id);
      const nextPrograms = exists
        ? current.programs.map((item) => (item.id === program.id ? program : item))
        : [
            ...current.programs.map((item) =>
              program.active ? { ...item, active: false } : item
            ),
            program
          ];
      return { ...current, programs: nextPrograms };
    });
    setSelectedProgramId(program.id);
    setTab("programs");
    setModal(null);
  };

  const deleteProgram = (programId: string) => {
    const program = state.programs.find((item) => item.id === programId);
    if (!program) return;
    requestConfirm({
      title: `Slet ${program.name}?`,
      body:
        "Programmet, træningsdagene og øvelserne fjernes. En aktiv træning fra programmet bliver også fortrudt.",
      confirmLabel: "Slet program",
      cancelLabel: "Behold program",
      tone: "danger",
      onConfirm: () => {
        setState((current) => {
          const remaining = current.programs.filter((item) => item.id !== programId);
          const hasActive = remaining.some((item) => item.active);
          return {
            ...current,
            programs: hasActive
              ? remaining
              : remaining.map((item, index) => ({ ...item, active: index === 0 })),
            activeSession:
              current.activeSession?.programId === programId
                ? null
                : current.activeSession
          };
        });
        setSelectedProgramId(null);
      }
    });
  };

  const setActiveProgram = (programId: string) => {
    setState((current) => ({
      ...current,
      programs: current.programs.map((program) => ({
        ...program,
        active: program.id === programId
      }))
    }));
    setSelectedProgramId(programId);
  };

  const saveDay = (programId: string, day: WorkoutDay) => {
    updateProgram(programId, (program) => {
      const exists = program.days.some((item) => item.id === day.id);
      return {
        ...program,
        days: exists
          ? program.days.map((item) => (item.id === day.id ? day : item))
          : [...program.days, day]
      };
    });
    setExpandedDays((current) => ({ ...current, [day.id]: true }));
    setModal(null);
  };

  const deleteDay = (programId: string, dayId: string) => {
    const day = state.programs
      .find((program) => program.id === programId)
      ?.days.find((item) => item.id === dayId);
    if (!day) return;
    requestConfirm({
      title: `Slet ${day.name}?`,
      body:
        "Træningsdagen og alle øvelser på dagen fjernes fra programmet. Historik bliver ikke ændret.",
      confirmLabel: "Slet dag",
      cancelLabel: "Behold dag",
      tone: "danger",
      onConfirm: () => {
        updateProgram(programId, (program) => ({
          ...program,
          days: program.days.filter((item) => item.id !== dayId)
        }));
        setExpandedDays((current) => {
          const { [dayId]: _removed, ...rest } = current;
          return rest;
        });
        setExpandedExercises((current) => {
          const exerciseIds = new Set(day.exercises.map((item) => item.id));
          return Object.fromEntries(
            Object.entries(current).filter(([exerciseId]) => !exerciseIds.has(exerciseId))
          );
        });
      }
    });
  };

  const moveDay = (programId: string, dayId: string, direction: -1 | 1) => {
    updateProgram(programId, (program) => {
      const index = program.days.findIndex((day) => day.id === dayId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= program.days.length) return program;
      const days = [...program.days];
      [days[index], days[target]] = [days[target], days[index]];
      return { ...program, days };
    });
  };

  const saveExercise = (
    programId: string,
    dayId: string,
    exercise: ProgramExercise
  ) => {
    updateProgram(programId, (program) => ({
      ...program,
      days: program.days.map((day) => {
        if (day.id !== dayId) return day;
        const exists = day.exercises.some((item) => item.id === exercise.id);
        return {
          ...day,
          exercises: exists
            ? day.exercises.map((item) =>
                item.id === exercise.id ? exercise : item
              )
            : [...day.exercises, exercise]
        };
      })
    }));
    setExpandedDays((current) => ({ ...current, [dayId]: true }));
    setModal(null);
  };

  const deleteExercise = (programId: string, dayId: string, exerciseId: string) => {
    const day = state.programs
      .find((program) => program.id === programId)
      ?.days.find((item) => item.id === dayId);
    const exercise = day?.exercises.find((item) => item.id === exerciseId);
    if (!exercise) return;
    requestConfirm({
      title: `Fjern ${exercise.name}?`,
      body:
        "Øvelsen fjernes fra denne træningsdag. Andre træningsdage og tidligere historik bliver ikke ændret.",
      confirmLabel: "Fjern øvelse",
      cancelLabel: "Behold øvelse",
      tone: "danger",
      onConfirm: () => {
        updateProgram(programId, (program) => ({
          ...program,
          days: program.days.map((item) =>
            item.id === dayId
              ? {
                  ...item,
                  exercises: item.exercises.filter((row) => row.id !== exerciseId)
                }
              : item
          )
        }));
        setExpandedExercises((current) => {
          const { [exerciseId]: _removed, ...rest } = current;
          return rest;
        });
      }
    });
  };

  const moveExercise = (
    programId: string,
    dayId: string,
    exerciseId: string,
    direction: -1 | 1
  ) => {
    updateProgram(programId, (program) => ({
      ...program,
      days: program.days.map((day) => {
        if (day.id !== dayId) return day;
        const index = day.exercises.findIndex((item) => item.id === exerciseId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= day.exercises.length) return day;
        const exercises = [...day.exercises];
        [exercises[index], exercises[target]] = [exercises[target], exercises[index]];
        return { ...day, exercises };
      })
    }));
  };

  const toggleExerciseWeightUnit = (
    programId: string,
    dayId: string,
    exerciseId: string
  ) => {
    updateProgram(programId, (program) => ({
      ...program,
      days: program.days.map((day) => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          exercises: day.exercises.map((exercise) => {
            if (exercise.id !== exerciseId || exercise.unit === "time") return exercise;
            return {
              ...exercise,
              unit: exercise.unit === "lbs" ? "kg" : "lbs"
            };
          })
        };
      })
    }));
  };

  const createExerciseSupersetWithNext = (
    programId: string,
    dayId: string,
    exerciseId: string
  ) => {
    updateProgram(programId, (program) => ({
      ...program,
      days: program.days.map((day) => {
        if (day.id !== dayId) return day;
        const index = day.exercises.findIndex((exercise) => exercise.id === exerciseId);
        const nextExercise = day.exercises[index + 1];
        if (index < 0 || !nextExercise) return day;
        const groupId = createId("superset");
        return {
          ...day,
          exercises: day.exercises.map((exercise, rowIndex) => {
            if (rowIndex === index) {
              return { ...exercise, supersetGroupId: groupId, supersetPosition: 1 };
            }
            if (rowIndex === index + 1) {
              return { ...exercise, supersetGroupId: groupId, supersetPosition: 2 };
            }
            return exercise;
          })
        };
      })
    }));
  };

  const removeExerciseFromSuperset = (
    programId: string,
    dayId: string,
    exerciseId: string
  ) => {
    updateProgram(programId, (program) => ({
      ...program,
      days: program.days.map((day) => {
        if (day.id !== dayId) return day;
        const groupId = day.exercises.find((exercise) => exercise.id === exerciseId)?.supersetGroupId;
        if (!groupId) return day;
        return {
          ...day,
          exercises: day.exercises.map((exercise) =>
            exercise.supersetGroupId === groupId
              ? {
                  ...exercise,
                  supersetGroupId: undefined,
                  supersetPosition: undefined
                }
              : exercise
          )
        };
      })
    }));
  };

  const startWorkout = (dayId?: string, forceReplace = false) => {
    if (state.activeSession && !forceReplace) {
      setConfirm({
        title: "Erstat aktiv træning?",
        body:
          "Den aktive træning bliver ryddet uden historik, og den valgte træningsdag starter forfra.",
        confirmLabel: "Start ny træning",
        cancelLabel: "Bliv her",
        tone: "danger",
        onConfirm: () => startWorkout(dayId, true)
      });
      return;
    }
    const program = activeProgram;
    const day = getDay(program, dayId);
    if (!program || !day) {
      setTab("programs");
      setModal({ type: "program" });
      return;
    }
    setState((current) => ({
      ...current,
      activeSession: buildSession(program, day)
    }));
    setTab("training");
    setTrainingSegment("today");
  };

  const updateSessionLog = (
    logId: string,
    patch: Partial<{ reps: string; weight: string; done: boolean }>
  ) => {
    setState((current) => ({
      ...current,
      activeSession: current.activeSession
        ? {
            ...current.activeSession,
            logs: current.activeSession.logs.map((log) =>
              log.id === logId ? { ...log, ...patch } : log
            )
          }
        : null
    }));
  };

  const addSessionSet = (exerciseId: string) => {
    setState((current) => {
      if (!current.activeSession) return current;
      const exerciseLogs = current.activeSession.logs.filter(
        (log) => log.exerciseId === exerciseId
      );
      const source = exerciseLogs[exerciseLogs.length - 1];
      return {
        ...current,
        activeSession: {
          ...current.activeSession,
          logs: [
            ...current.activeSession.logs,
            {
              id: createId("set"),
              exerciseId,
              setIndex: exerciseLogs.length + 1,
              reps: source?.reps ?? "8",
              weight: source?.weight ?? "0",
              done: false
            }
          ]
        }
      };
    });
  };

  const finishSession = () => {
    if (!state.activeSession || !activeProgram || !activeDay) return;
    const historyEntry = sessionToHistory(state.activeSession, activeProgram, activeDay);
    setState((current) => ({
      ...current,
      activeSession: null,
      history: [historyEntry, ...current.history]
    }));
    setTrainingSegment("history");
    setTab("training");
  };

  const completeSession = () => {
    if (!state.activeSession || !activeProgram || !activeDay) return;
    const completedSetCount = state.activeSession.logs.filter((log) => log.done).length;
    if (completedSetCount === 0) {
      setConfirm({
        title: "Afslut uden udførte sæt?",
        body:
          "Træningen bliver gemt i historik med 0 udførte sæt. Brug det kun, hvis du faktisk vil gemme dagen som afsluttet.",
        confirmLabel: "Gem alligevel",
        cancelLabel: "Fortsæt træning",
        onConfirm: finishSession
      });
      return;
    }
    finishSession();
  };

  const cancelSession = () => {
    setConfirm({
      title: "Fortryd aktiv træning?",
      body:
        "Alle ikke-gemte sæt fra den aktive session fjernes, og der bliver ikke oprettet en historikpost.",
      confirmLabel: "Fortryd træning",
      cancelLabel: "Bliv i træningen",
      tone: "danger",
      onConfirm: () => setState((current) => ({ ...current, activeSession: null }))
    });
  };

  const addCardioHistory = (input: CardioHistoryInput) => {
    const entry: HistoryEntry = {
      id: createId("hist"),
      title: input.title,
      kind: "Cardio",
      date: new Date().toISOString(),
      durationMinutes: input.durationMinutes,
      distanceKm: input.distanceKm,
      volumeKg: 0,
      sets: 0,
      exercises: input.distanceKm
        ? [input.title, `${input.distanceKm.toLocaleString("da-DK")} km`]
        : [input.title],
      note: input.note
    };
    setState((current) => ({ ...current, history: [entry, ...current.history] }));
    setTrainingSegment("history");
  };

  const saveHistory = (entry: HistoryEntry) => {
    setState((current) => {
      const exists = current.history.some((item) => item.id === entry.id);
      return {
        ...current,
        history: exists
          ? current.history.map((item) => (item.id === entry.id ? entry : item))
          : [entry, ...current.history]
      };
    });
    setModal(null);
    setTab("training");
    setTrainingSegment("history");
  };

  const deleteHistory = (historyId: string) => {
    const entry = state.history.find((item) => item.id === historyId);
    if (!entry) return;
    requestConfirm({
      title: "Slet historikpost?",
      body: `${entry.title} fjernes fra logbogen og private social-previews.`,
      confirmLabel: "Slet post",
      cancelLabel: "Behold post",
      tone: "danger",
      onConfirm: () => {
        setState((current) => ({
          ...current,
          history: current.history.filter((item) => item.id !== historyId),
          social: {
            ...current.social,
            hiddenHistoryIds: current.social.hiddenHistoryIds.filter(
              (idValue) => idValue !== historyId
            )
          }
        }));
      }
    });
  };

  const swipeMatch = (liked: boolean) => {
    const item = state.matchQueue[0];
    if (!item) return;
    setMatchHistory((current) => [{ id: item.id, liked }, ...current]);
    setState((current) => ({
      ...current,
      matchQueue: current.matchQueue.slice(1),
      likedMatches: liked ? [item, ...current.likedMatches] : current.likedMatches,
      skippedMatches: liked ? current.skippedMatches : [item, ...current.skippedMatches]
    }));
  };

  const undoMatch = () => {
    setState((current) => {
      const latest = matchHistory[0];
      const last = latest
        ? latest.liked
          ? current.likedMatches.find((item) => item.id === latest.id)
          : current.skippedMatches.find((item) => item.id === latest.id)
        : current.likedMatches[0] ?? current.skippedMatches[0];
      if (!last) return current;
      setMatchHistory((history) => history.filter((entry) => entry.id !== last.id));
      return {
        ...current,
        matchQueue: [last, ...current.matchQueue],
        likedMatches: current.likedMatches.filter((item) => item.id !== last.id),
        skippedMatches: current.skippedMatches.filter((item) => item.id !== last.id)
      };
    });
  };

  const resetMatches = () => {
    setMatchHistory([]);
    setState((current) => ({
      ...current,
      matchQueue: matchSeed,
      likedMatches: [],
      skippedMatches: []
    }));
  };

  const resetDemo = () => {
    requestConfirm({
      title: "Nulstil lokal testdata?",
      body:
        "Programmer, historik, matchkø og aktiv træning nulstilles. Konto og profiloplysninger bevares.",
      confirmLabel: "Nulstil data",
      cancelLabel: "Behold data",
      tone: "danger",
      onConfirm: () => {
        setState((current) => ({
          ...defaultState,
          auth: {
            loggedIn: true,
            onboardingCompleted: current.auth.onboardingCompleted
          },
          profile: {
            ...defaultState.profile,
            name: current.profile.name,
            email: current.profile.email,
            phone: current.profile.phone
          }
        }));
        setSelectedProgramId(null);
        setTrainingSegment("today");
        setTab("settings");
      }
    });
  };

  const submitAuth = async (payload: {
    mode: "login" | "signup";
    email: string;
    password: string;
    name: string;
    healthDataConsent: boolean;
  }) => {
    if (supabaseEnabled) {
      try {
        const result =
          payload.mode === "signup"
            ? await registerSupabaseAccount(payload)
            : await authenticateSupabaseAccount(payload.email, payload.password);
        if (!result) return "Supabase er ikke konfigureret i denne build.";
        setState(result.state);
        setHealthConsentRequired(!result.healthDataConsentRecorded);
        setSelectedProgramId(null);
        setTrainingSegment("today");
        setTab(payload.mode === "signup" ? "training" : "settings");
        return "";
      } catch (error) {
        return error instanceof Error
          ? error.message
          : "Supabase-login kunne ikke gennemføres.";
      }
    }

    if (!import.meta.env.DEV) {
      return "Login er ikke tilgængeligt, fordi denne produktionsbuild mangler Supabase-konfiguration.";
    }

    if (payload.mode === "signup") {
      const account = await registerLocalAccount(payload);
      if (!account) return "Der findes allerede en lokal konto med den email.";
      setState(loadStateForAccount(account, { onboardingCompleted: false }));
      setSelectedProgramId(null);
      setTrainingSegment("today");
      setTab("training");
      return "";
    }

    const account = await authenticateLocalAccount(payload.email, payload.password);
    if (!account) return "Email eller adgangskode er forkert.";
    setState(loadStateForAccount(account));
    setSelectedProgramId(null);
    setTrainingSegment("today");
    setTab("settings");
    return "";
  };

  const logout = () => {
    const email = state.profile.email;
    setMenuOpen(false);
    clearStoredAppState(email);
    if (supabaseEnabled) void signOutSupabaseAccount();
    setHealthConsentRequired(false);
    setState((current) => ({
      ...current,
      auth: { ...current.auth, loggedIn: false }
    }));
  };

  if (authRestoring) {
    return (
      <div className="auth-screen" role="status" aria-live="polite">
        <div className="auth-card auth-loading">
          <img src="/brand/tm-logo-256.webp" alt="" />
          <p>Henter din sikre session...</p>
        </div>
      </div>
    );
  }

  if (!state.auth.loggedIn) {
    return <LoginScreen supabaseEnabled={supabaseEnabled} onSubmit={submitAuth} />;
  }

  if (healthConsentRequired) {
    return (
      <HealthDataConsentGate
        onAccept={async () => {
          const result = await recordSupabaseHealthDataConsent();
          setState(result.state);
          setHealthConsentRequired(!result.healthDataConsentRecorded);
        }}
        onLogout={logout}
      />
    );
  }

  if (showOnboarding || !state.auth.onboardingCompleted) {
    return (
      <OnboardingFlow
        profile={state.profile}
        onUpdateProfile={updateProfile}
        onFinish={() => {
          setState((current) => ({
            ...current,
            auth: { ...current.auth, onboardingCompleted: true }
          }));
          setShowOnboarding(false);
          setTrainingSegment("today");
          setTab("training");
        }}
      />
    );
  }

  return (
    <div className={classNames("tm-app", `theme-${state.profile.theme}`, tab === "match" && "match-mode")}>
      <PhoneStatusBar />
      {tab !== "settings" && tab !== "programs" && tab !== "match" ? (
        <AppHeader
          tab={tab}
          profile={state.profile}
          onMenu={() => setMenuOpen(true)}
        />
      ) : null}
      <main className="app-main">
        {tab === "settings" ? (
          <SettingsScreen
            state={state}
            onUpdateProfile={updateProfile}
            onHistory={openHistory}
            onOnboarding={() => setShowOnboarding(true)}
            onLogout={logout}
            onResetDemo={import.meta.env.DEV ? resetDemo : undefined}
          />
        ) : null}

        {tab === "training" ? (
          <TrainingScreen
            state={state}
            activeProgram={activeProgram}
            activeDay={activeDay}
            segment={trainingSegment}
            onSegment={setTrainingSegment}
            onStart={startWorkout}
            onLogChange={updateSessionLog}
            onAddSet={addSessionSet}
            onComplete={completeSession}
            onCancel={cancelSession}
            onCardio={addCardioHistory}
            onNewHistory={() => setModal({ type: "history" })}
            onEditHistory={(entry) => setModal({ type: "history", entry })}
            onDeleteHistory={deleteHistory}
            onPrograms={() => setTab("programs")}
          />
        ) : null}

        {tab === "programs" ? (
          <ProgramsScreen
            programs={state.programs}
            selectedProgram={selectedProgram}
            expandedDays={expandedDays}
            expandedExercises={expandedExercises}
            onToggleDay={(dayId) =>
              setExpandedDays((current) => ({
                ...current,
                [dayId]: !current[dayId]
              }))
            }
            onToggleExercise={(exerciseId) =>
              setExpandedExercises((current) => ({
                ...current,
                [exerciseId]: !current[exerciseId]
              }))
            }
            onSelectProgram={(programId) => setSelectedProgramId(programId)}
            onNewProgram={() => setModal({ type: "program" })}
            onEditProgram={(program) => setModal({ type: "program", program })}
            onDeleteProgram={deleteProgram}
            onSetActive={setActiveProgram}
            onNewDay={(programId) => setModal({ type: "day", programId })}
            onEditDay={(programId, day) => setModal({ type: "day", programId, day })}
            onDeleteDay={deleteDay}
            onMoveDay={moveDay}
            onNewExercise={(programId, dayId) =>
              setModal({ type: "exercise", programId, dayId })
            }
            onEditExercise={(programId, dayId, exercise) =>
              setModal({ type: "exercise", programId, dayId, exercise })
            }
            onOpenExerciseInfo={(exercise) => setModal({ type: "exerciseInfo", exercise })}
            onDeleteExercise={deleteExercise}
            onMoveExercise={moveExercise}
            onToggleExerciseWeightUnit={toggleExerciseWeightUnit}
            onCreateExerciseSuperset={createExerciseSupersetWithNext}
            onRemoveExerciseSuperset={removeExerciseFromSuperset}
            onStartDay={startWorkout}
          />
        ) : null}

        {tab === "match" ? (
          <MatchScreen
            item={currentMatch}
            nextItem={nextMatch}
            liked={state.likedMatches}
            skippedCount={state.skippedMatches.length}
            position={matchPosition}
            total={matchTotal}
            onBack={() => navigate("training")}
            onLike={() => swipeMatch(true)}
            onSkip={() => swipeMatch(false)}
            onUndo={undoMatch}
            onReset={import.meta.env.DEV ? resetMatches : undefined}
          />
        ) : null}

        {tab === "social" ? (
          <SocialScreen
            history={state.history}
            social={state.social}
            onHide={(historyId) =>
              setState((current) => ({
                ...current,
                social: {
                  ...current.social,
                  hiddenHistoryIds: [
                    ...current.social.hiddenHistoryIds,
                    historyId
                  ]
                }
              }))
            }
            onHistory={openHistory}
          />
        ) : null}
      </main>

      <BottomNav active={tab} onSelect={navigate} />

      <SideMenu
        open={menuOpen}
        profile={state.profile}
        onClose={() => setMenuOpen(false)}
        onNavigate={navigate}
        onHistory={openHistory}
        onOnboarding={() => {
          setMenuOpen(false);
          setShowOnboarding(true);
        }}
        onLogout={logout}
      />

      <ConfirmDialog
        confirm={confirm}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const action = confirm?.onConfirm;
          setConfirm(null);
          action?.();
        }}
      />

      <CrudModal
        modal={modal}
        onClose={() => setModal(null)}
        onSaveProgram={saveProgram}
        onSaveDay={saveDay}
        onSaveExercise={saveExercise}
        onSaveHistory={saveHistory}
      />
    </div>
  );
}

function AppHeader({
  tab,
  profile,
  onMenu
}: {
  tab: TabId;
  profile: UserProfile;
  onMenu: () => void;
}) {
  const title =
    tab === "training"
      ? "Dagens træning"
      : tabs.find((item) => item.id === tab)?.label ?? "Træningsmester";
  return (
    <header className="app-header">
      <button className="icon-button" aria-label="Åbn menu" onClick={onMenu}>
        <span />
        <span />
      </button>
      <div className="brand-center" aria-label="Træningsmester">
        <img src="/brand/tm-logo-256.webp" alt="" />
        <strong>{title}</strong>
      </div>
      <div className="profile-chip" title="Personlig">
        P
      </div>
    </header>
  );
}

function PhoneStatusBar() {
  const time = new Intl.DateTimeFormat("da-DK", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());

  return (
    <div className="phone-status" aria-hidden="true">
      <span>{time}</span>
      <div className="phone-indicators">
        <span className="signal-bars">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="wifi-mark" />
        <span className="battery-mark">72</span>
      </div>
    </div>
  );
}

function BottomNav({
  active,
  onSelect
}: {
  active: TabId;
  onSelect: (tab: TabId) => void;
}) {
  return (
    <nav className="bottom-nav" aria-label="Primær navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={classNames(active === tab.id && "active")}
          onClick={() => onSelect(tab.id)}
          data-testid={`nav-${tab.id}`}
        >
          <TabIcon id={tab.id} />
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

function TabIcon({ id }: { id: TabId }) {
  if (id === "programs") {
    return (
      <svg viewBox="0 0 28 28" aria-hidden="true">
        <rect x="7" y="6" width="14" height="18" rx="2.2" />
        <path d="M11 5h6l1 3h-8z" />
        <path d="M10.5 12.5h7M10.5 16.5h7M10.5 20.5h5" />
      </svg>
    );
  }
  if (id === "social") {
    return (
      <svg viewBox="0 0 28 28" aria-hidden="true">
        <path d="M5 9.5a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2.2a5 5 0 0 1-5 5h-3.2L7.5 21v-4.4A5 5 0 0 1 5 12.2z" />
        <path d="M13 18.5h4.5l3.3 2.8v-3.4a4 4 0 0 0 2.2-3.6v-1.7" />
      </svg>
    );
  }
  if (id === "training") {
    return (
      <svg viewBox="0 0 28 28" aria-hidden="true">
        <circle cx="16.6" cy="5.2" r="2.2" />
        <path d="M15 8.2 11.7 13l4.5 2.3 2.8-3.8" />
        <path d="m12 13-3.7 1.7M16.1 15.3l-1.4 7M17.2 15.9l4.7 4.5M13.5 10.2l5.8.5" />
      </svg>
    );
  }
  if (id === "match") {
    return (
      <svg viewBox="0 0 28 28" aria-hidden="true">
        <rect x="6" y="5" width="16" height="18" rx="2.5" />
        <path d="M14 13.4c-3.2-2.7-6.1 1.1 0 5.2 6.1-4.1 3.2-7.9 0-5.2z" />
        <path d="M10 8.5h8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path d="M14 9.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2z" />
      <path d="M14 3.5v3M14 21.5v3M3.5 14h3M21.5 14h3M6.6 6.6l2.1 2.1M19.3 19.3l2.1 2.1M21.4 6.6l-2.1 2.1M8.7 19.3l-2.1 2.1" />
    </svg>
  );
}

function SideMenu({
  open,
  profile,
  onClose,
  onNavigate,
  onHistory,
  onOnboarding,
  onLogout
}: {
  open: boolean;
  profile: UserProfile;
  onClose: () => void;
  onNavigate: (tab: TabId) => void;
  onHistory: () => void;
  onOnboarding: () => void;
  onLogout: () => void;
}) {
  const dialogRef = useModalFocus(open, onClose);
  if (!open) return null;
  return (
    <div
      ref={dialogRef}
      className="side-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      tabIndex={-1}
    >
      <button className="side-backdrop" aria-label="Luk menu" onClick={onClose} />
      <aside className="side-panel">
        <div className="side-head">
          <div>
            <p>Menu</p>
            <strong>{profile.name}</strong>
          </div>
          <button
            className="plain-icon"
            onClick={onClose}
            aria-label="Luk"
            data-modal-initial-focus
          >
            ×
          </button>
        </div>
        <div className="side-actions">
          <MenuButton label="Hjem / Træning" onClick={() => onNavigate("training")} />
          <MenuButton label="Programmer" onClick={() => onNavigate("programs")} />
          <MenuButton label="Social" onClick={() => onNavigate("social")} />
          <MenuButton label="Match" onClick={() => onNavigate("match")} />
          <MenuButton label="Historik" onClick={onHistory} />
          <MenuButton label="Indstillinger" onClick={() => onNavigate("settings")} />
          <MenuButton label="Onboarding" onClick={onOnboarding} />
        </div>
        <button type="button" className="button muted full" onClick={onLogout}>
          Log ud
        </button>
      </aside>
    </div>
  );
}

function MenuButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="menu-row" onClick={onClick}>
      <span>{label}</span>
      <span aria-hidden="true">›</span>
    </button>
  );
}

function SettingsGroup({
  icon,
  title,
  children
}: {
  icon: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="settings-group-card">
      <div className="settings-group-title">
        <span className="settings-icon" aria-hidden="true">
          {icon}
        </span>
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function SettingsScreen({
  state,
  onUpdateProfile,
  onHistory,
  onOnboarding,
  onLogout,
  onResetDemo
}: {
  state: AppState;
  onUpdateProfile: (patch: Partial<UserProfile>) => void;
  onHistory: () => void;
  onOnboarding: () => void;
  onLogout: () => void;
  onResetDemo?: () => void;
}) {
  const profile = state.profile;
  const [panel, setPanel] = useState<SettingsPanel>("training");
  const panelTitle =
    panel === "profile"
      ? "Profil"
      : panel === "training"
        ? "Træning"
        : panel === "display"
          ? "Visning"
          : panel === "premium"
            ? "Premium"
            : "Indstillinger";

  return (
    <ScreenShell
      className="settings-screen"
      eyebrow="PROFIL"
      title="Indstillinger"
      action={
        panel !== "overview" ? (
          <div className="native-subnav">
            <button type="button" onClick={() => setPanel("overview")}>
              ‹ Tilbage
            </button>
            <strong>{panelTitle}</strong>
            <span />
          </div>
        ) : undefined
      }
    >
      {panel === "overview" ? (
        <>
          <section className="profile-panel">
            <div className="avatar" aria-hidden="true">
              {profile.name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h2>{profile.name}</h2>
              <p>{profile.email}</p>
              <span>Personlig</span>
            </div>
          </section>

          <section className="menu-list">
            <MenuButton label="Profil" onClick={() => setPanel("profile")} />
            <MenuButton label="Træning" onClick={() => setPanel("training")} />
            <MenuButton label="Visning og tema" onClick={() => setPanel("display")} />
            <MenuButton label="Premium & abonnement" onClick={() => setPanel("premium")} />
            <MenuButton label="Historik" onClick={onHistory} />
            <MenuButton label="Onboarding" onClick={onOnboarding} />
          </section>

          <div className="stacked-actions">
            <button className="button muted full" onClick={onLogout}>
              Log ud
            </button>
            {import.meta.env.DEV && onResetDemo ? (
              <button className="button danger full" onClick={onResetDemo}>
                Nulstil lokal testdata
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      {panel === "profile" ? (
        <section className="form-section">
          <h3>Konto</h3>
          <Field
            label="Navn"
            value={profile.name}
            onChange={(value) => onUpdateProfile({ name: value })}
          />
          <Field
            label="Email"
            value={profile.email}
            onChange={(value) => onUpdateProfile({ email: value })}
          />
          <Field
            label="Telefon"
            value={profile.phone}
            onChange={(value) => onUpdateProfile({ phone: value })}
          />
          <p className="section-copy">Træningsmester er din personlige træningsapp.</p>
        </section>
      ) : null}

      {panel === "training" ? (
        <>
          <SettingsGroup icon="⌁" title="Start og logging">
            <ToggleRow
              icon="↻"
              label="Træningsflow"
              desc="Programrækkefølge"
              checked={profile.trainingFlow}
              onChange={(trainingFlow) => onUpdateProfile({ trainingFlow })}
              chip="Programrækkefølge"
            />
            <ToggleRow
              icon="☷"
              label="Tracker"
              desc="Logger sæt"
              checked={profile.trackerLogging}
              onChange={(trackerLogging) => onUpdateProfile({ trackerLogging })}
              chip="Logger sæt"
            />
            <ToggleRow
              icon="⇩"
              label="Deload-forslag"
              desc="Til"
              checked={profile.deloadSuggestions}
              onChange={(deloadSuggestions) => onUpdateProfile({ deloadSuggestions })}
              chip="Til"
            />
            <ToggleRow
              icon="⌬"
              label="Cardio-session"
              desc="Startknap"
              checked={profile.cardioShortcut}
              onChange={(cardioShortcut) => onUpdateProfile({ cardioShortcut })}
              chip="Startknap"
            />
            <ToggleRow
              icon="▣"
              label="Live Activity"
              desc="Låseskærm"
              checked={profile.liveActivity}
              onChange={(liveActivity) => onUpdateProfile({ liveActivity })}
              chip="Låseskærm"
            />
            <ToggleRow
              icon="▯"
              label="Hold skærmen vågen"
              desc="Kun under træning"
              checked={profile.keepScreenAwake}
              onChange={(keepScreenAwake) => onUpdateProfile({ keepScreenAwake })}
              chip="Kun under træning"
            />
          </SettingsGroup>

          <SettingsGroup icon="◷" title="Timere">
            <ToggleRow
              icon="⏱"
              label="Pausetid mellem sæt"
              desc="Vis timeren i tracker"
              checked={profile.restTimer}
              onChange={(restTimer) => onUpdateProfile({ restTimer })}
              chip="Vises"
            />
            <ToggleRow
              icon="3"
              label="Countdown før start"
              desc="Kort nedtælling"
              checked={profile.countdown}
              onChange={(countdown) => onUpdateProfile({ countdown })}
              chip="Aktiv"
            />
          </SettingsGroup>

          <section className="form-section settings-flat-field">
            <Field
              label="Kropsvægt"
              value={profile.bodyweight}
              suffix="kg"
              onChange={(bodyweight) => onUpdateProfile({ bodyweight })}
            />
          </section>
        </>
      ) : null}

      {panel === "display" ? (
        <section className="form-section">
          <h3>Visning</h3>
          <div className="segmented">
            {(["system", "light", "dark"] as const).map((theme) => (
              <button
                type="button"
                key={theme}
                className={profile.theme === theme ? "active" : ""}
                onClick={() => onUpdateProfile({ theme })}
              >
                {theme === "system" ? "System" : theme === "light" ? "Lys" : "Mørk"}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {panel === "premium" ? (
        <section className="form-section premium-panel">
          <h3>Premium & abonnement</h3>
          <p className="section-copy">
            Webappen viser abonnementstilstanden uden at gennemføre køb. Køb og
            gendannelse skal fortsat valideres i iOS/Android.
          </p>
          <div className="summary-grid">
            <Metric label="Plan" value="Free" />
            <Metric label="Profil" value="Personlig" />
            <Metric label="Status" value="Ikke aktiv" />
          </div>
          <button className="button muted full" type="button" disabled>
            Køb kræver mobilappen
          </button>
        </section>
      ) : null}
    </ScreenShell>
  );
}

function TrainingScreen({
  state,
  activeProgram,
  activeDay,
  segment,
  onSegment,
  onStart,
  onLogChange,
  onAddSet,
  onComplete,
  onCancel,
  onCardio,
  onNewHistory,
  onEditHistory,
  onDeleteHistory,
  onPrograms
}: {
  state: AppState;
  activeProgram: TrainingProgram | null;
  activeDay: WorkoutDay | null;
  segment: TrainingSegment;
  onSegment: (segment: TrainingSegment) => void;
  onStart: (dayId?: string) => void;
  onLogChange: (
    logId: string,
    patch: Partial<{ reps: string; weight: string; done: boolean }>
  ) => void;
  onAddSet: (exerciseId: string) => void;
  onComplete: () => void;
  onCancel: () => void;
  onCardio: (input: CardioHistoryInput) => void;
  onNewHistory: () => void;
  onEditHistory: (entry: HistoryEntry) => void;
  onDeleteHistory: (historyId: string) => void;
  onPrograms: () => void;
}) {
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const selectedDay =
    state.activeSession || !activeProgram
      ? activeDay
      : getDay(activeProgram, selectedDayId) ?? activeDay;
  const moveSelectedDay = (direction: -1 | 1) => {
    if (!activeProgram || !selectedDay) return;
    const currentIndex = activeProgram.days.findIndex((item) => item.id === selectedDay.id);
    if (currentIndex < 0) return;
    const nextIndex =
      (currentIndex + direction + activeProgram.days.length) % activeProgram.days.length;
    setSelectedDayId(activeProgram.days[nextIndex]?.id ?? null);
  };

  return (
    <ScreenShell eyebrow="" title="Dagens træning">
      <div className={classNames("chip-row", segment === "today" && "today-segments")}>
        <Chip active={segment === "today"} onClick={() => onSegment("today")}>
          I dag
        </Chip>
        <Chip active={segment === "cardio"} onClick={() => onSegment("cardio")}>
          Cardio
        </Chip>
        <Chip active={segment === "history"} onClick={() => onSegment("history")}>
          Historik
        </Chip>
      </div>

      {segment === "today" ? (
        state.activeSession && activeProgram && selectedDay ? (
          <ActiveWorkout
            session={state.activeSession}
            program={activeProgram}
            day={selectedDay}
            onLogChange={onLogChange}
            onAddSet={onAddSet}
            onComplete={onComplete}
            onCancel={onCancel}
          />
        ) : (
          <HomeTraining
            program={activeProgram}
            day={selectedDay}
            history={state.history}
            onStart={onStart}
            onPrograms={onPrograms}
            cardioShortcut={state.profile.cardioShortcut}
            onCardioShortcut={() => onSegment("cardio")}
            onDayShift={moveSelectedDay}
          />
        )
      ) : null}

      {segment === "cardio" ? <CardioScreen onCardio={onCardio} /> : null}

      {segment === "history" ? (
        <HistoryScreen
          history={state.history}
          onNew={onNewHistory}
          onEdit={onEditHistory}
          onDelete={onDeleteHistory}
        />
      ) : null}
    </ScreenShell>
  );
}

function HomeTraining({
  program,
  day,
  history,
  onStart,
  onPrograms,
  cardioShortcut,
  onCardioShortcut,
  onDayShift
}: {
  program: TrainingProgram | null;
  day: WorkoutDay | null;
  history: HistoryEntry[];
  onStart: (dayId?: string) => void;
  onPrograms: () => void;
  cardioShortcut: boolean;
  onCardioShortcut: () => void;
  onDayShift: (direction: -1 | 1) => void;
}) {
  if (!program || !day) {
    return (
      <EmptyState
        title="Intet aktivt program"
        body="Opret et træningsprogram, før dagens træning kan starte."
        action="Opret program"
        onAction={onPrograms}
      />
    );
  }

  const dayIndex = program.days.findIndex((item) => item.id === day.id);
  const setCount = day.exercises.reduce((sum, item) => sum + item.sets, 0);
  const latestTraining = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];
  const latestLabel = formatRelativeTraining(latestTraining?.date);

  return (
    <section className="home-hero">
      <div className="home-training-top">
        {cardioShortcut ? (
          <button className="text-button cardio-link" type="button" onClick={onCardioShortcut}>
            Cardio
          </button>
        ) : (
          <span />
        )}
        <div className="day-switcher" aria-label="Skift træningsdag">
          <button type="button" aria-label="Forrige dag" onClick={() => onDayShift(-1)}>
            ‹
          </button>
          <span>
            Dag {dayIndex + 1} af {program.days.length}
          </span>
          <button type="button" aria-label="Næste dag" onClick={() => onDayShift(1)}>
            ›
          </button>
        </div>
      </div>
      <div className="hero-media">
        <SafeImage
          src={day.image ?? program.image ?? "/photos/hero-training.jpg"}
          fallbackSrc="/photos/hero-training.jpg"
          alt=""
        />
        <div className="hero-overlay">
          <span>Klar</span>
          <h2>{day.name}</h2>
          <p>{day.description}</p>
        </div>
      </div>
      <div className="hero-body">
        <div className="workout-summary-line">
          <span>{program.center}</span>
          <span>{day.exercises.length} øvelser</span>
          <span>{setCount} sæt</span>
        </div>
        <div className="home-actions">
          {latestLabel ? <em className="recent-chip">✓ {latestLabel}</em> : null}
          <button className="button primary full" onClick={() => onStart(day.id)}>
            Start træning
          </button>
        </div>
      </div>
    </section>
  );
}

function ActiveWorkout({
  session,
  program,
  day,
  onLogChange,
  onAddSet,
  onComplete,
  onCancel
}: {
  session: NonNullable<AppState["activeSession"]>;
  program: TrainingProgram;
  day: WorkoutDay;
  onLogChange: (
    logId: string,
    patch: Partial<{ reps: string; weight: string; done: boolean }>
  ) => void;
  onAddSet: (exerciseId: string) => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const done = session.logs.filter((log) => log.done).length;
  return (
    <section className="active-workout">
      <div className="workout-status">
        <div>
          <p>{program.name}</p>
          <h2>{day.name}</h2>
        </div>
        <span>{done}/{session.logs.length} sæt</span>
      </div>
      {day.exercises.map((exercise) => {
        const logs = session.logs.filter((log) => log.exerciseId === exercise.id);
        return (
          <article className="exercise-card" key={exercise.id}>
            <div className="exercise-head">
              <div>
                <h3>{exercise.name}</h3>
                <p>
                  {exercise.sets} sæt · {exercise.reps} · {exercise.weight}
                  {exercise.unit === "kg" ? " kg" : ""}
                </p>
              </div>
              <button className="small-button" onClick={() => onAddSet(exercise.id)}>
                Tilføj sæt
              </button>
            </div>
            <div className="set-table">
              {logs.map((log) => (
                <div className="set-row" key={log.id}>
                  <span>{log.setIndex}</span>
                  <input
                    aria-label="Gentagelser"
                    value={log.reps}
                    onChange={(event) =>
                      onLogChange(log.id, { reps: event.target.value })
                    }
                  />
                  <input
                    aria-label="Vægt"
                    value={log.weight}
                    onChange={(event) =>
                      onLogChange(log.id, { weight: event.target.value })
                    }
                  />
                  <button
                    className={classNames("done-button", log.done && "done")}
                    onClick={() => onLogChange(log.id, { done: !log.done })}
                  >
                    {log.done ? "✓" : "○"}
                  </button>
                </div>
              ))}
            </div>
          </article>
        );
      })}
      <div className="fixed-actions">
        <button className="button muted" onClick={onCancel}>
          Tilbage
        </button>
        <button className="button primary" onClick={onComplete}>
          Afslut træning
        </button>
      </div>
    </section>
  );
}

function CardioScreen({
  onCardio
}: {
  onCardio: (input: CardioHistoryInput) => void;
}) {
  const options = ["Cykeltur", "Kondition", "Gåtur", "Løb", "Løbebånd", "Roning"];
  const [title, setTitle] = useState(options[0]);
  const [duration, setDuration] = useState("30");
  const [distance, setDistance] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const durationMinutes = Number.parseInt(duration, 10);
    const cleanDistance = distance.trim().replace(",", ".");
    const distanceKm = cleanDistance ? Number.parseFloat(cleanDistance) : undefined;

    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      setError("Varighed skal være mindst 1 minut.");
      return;
    }
    if (distanceKm !== undefined && (!Number.isFinite(distanceKm) || distanceKm < 0)) {
      setError("Distance skal være tom eller et positivt tal.");
      return;
    }

    setError("");
    onCardio({
      title,
      durationMinutes,
      distanceKm,
      note: note.trim() || "Manuelt gemt cardio-session."
    });
    setDuration("30");
    setDistance("");
    setNote("");
  };

  return (
    <form className="form-section cardio-form" onSubmit={submit}>
      <h3>Vælg cardio</h3>
      <p className="section-copy">
        Gem en plan-uafhængig aktivitet med de vigtigste historikfelter.
      </p>
      <div className="option-list">
        {options.map((option) => (
          <button
            type="button"
            className={classNames("option-row", title === option && "selected")}
            key={option}
            onClick={() => setTitle(option)}
          >
            <span>{option}</span>
            <span>{title === option ? "Valgt" : "Vælg"}</span>
          </button>
        ))}
      </div>
      <div className="field-grid cardio-grid">
        <Field label="Varighed" value={duration} suffix="min" onChange={setDuration} />
        <Field label="Distance" value={distance} suffix="km" onChange={setDistance} />
      </div>
      <Textarea label="Note" value={note} onChange={setNote} />
      {error ? <p className="error-text">{error}</p> : null}
      <button className="button primary full" type="submit">
        Gem cardio i historik
      </button>
    </form>
  );
}

function HistoryScreen({
  history,
  onNew,
  onEdit,
  onDelete
}: {
  history: HistoryEntry[];
  onNew: () => void;
  onEdit: (entry: HistoryEntry) => void;
  onDelete: (historyId: string) => void;
}) {
  const [filter, setFilter] = useState<"Alle" | "Styrketræning" | "Cardio">("Alle");
  const filtered = history.filter((entry) => filter === "Alle" || entry.kind === filter);
  return (
    <section className="history-screen">
      <div className="section-heading-row">
        <h3>Logbog</h3>
        <button className="small-button" type="button" onClick={onNew}>
          Manuel log
        </button>
      </div>
      <div className="search-row">
        {(["Alle", "Styrketræning", "Cardio"] as const).map((item) => (
          <Chip key={item} active={filter === item} onClick={() => setFilter(item)}>
            {item}
          </Chip>
        ))}
      </div>
      {filtered.length ? (
        <div className="history-list">
          {filtered.map((entry) => (
            <article className="history-card" key={entry.id}>
              <div className="history-head">
                <div>
                  <span>{entry.kind}</span>
                  <h3>{entry.title}</h3>
                  <p>{formatDate(entry.date)}</p>
                </div>
                <div className="compact-actions">
                  <button className="small-button" type="button" onClick={() => onEdit(entry)}>
                    Redigér
                  </button>
                  <button className="small-button danger" type="button" onClick={() => onDelete(entry.id)}>
                    Slet
                  </button>
                </div>
              </div>
              <div className="summary-grid">
                <Metric label="Tid" value={`${entry.durationMinutes} min`} />
                {entry.kind === "Cardio" ? (
                  <Metric
                    label="Distance"
                    value={
                      entry.distanceKm !== undefined
                        ? `${entry.distanceKm.toLocaleString("da-DK")} km`
                        : "-"
                    }
                  />
                ) : (
                  <Metric
                    label="Volumen"
                    value={entry.volumeKg ? `${entry.volumeKg} kg` : "-"}
                  />
                )}
                <Metric label="Sæt" value={String(entry.sets)} />
              </div>
              <p className="exercise-summary">{entry.exercises.join(" · ")}</p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Ingen historik endnu"
          body="Når du afslutter en træning eller cardio-session, lander den her."
        />
      )}
    </section>
  );
}

function ProgramsScreen({
  programs,
  selectedProgram,
  expandedDays,
  expandedExercises,
  onToggleDay,
  onToggleExercise,
  onSelectProgram,
  onNewProgram,
  onEditProgram,
  onDeleteProgram,
  onSetActive,
  onNewDay,
  onEditDay,
  onDeleteDay,
  onMoveDay,
  onNewExercise,
  onEditExercise,
  onOpenExerciseInfo,
  onDeleteExercise,
  onMoveExercise,
  onToggleExerciseWeightUnit,
  onCreateExerciseSuperset,
  onRemoveExerciseSuperset,
  onStartDay
}: {
  programs: TrainingProgram[];
  selectedProgram: TrainingProgram | null;
  expandedDays: Record<string, boolean>;
  expandedExercises: Record<string, boolean>;
  onToggleDay: (dayId: string) => void;
  onToggleExercise: (exerciseId: string) => void;
  onSelectProgram: (programId: string) => void;
  onNewProgram: () => void;
  onEditProgram: (program: TrainingProgram) => void;
  onDeleteProgram: (programId: string) => void;
  onSetActive: (programId: string) => void;
  onNewDay: (programId: string) => void;
  onEditDay: (programId: string, day: WorkoutDay) => void;
  onDeleteDay: (programId: string, dayId: string) => void;
  onMoveDay: (programId: string, dayId: string, direction: -1 | 1) => void;
  onNewExercise: (programId: string, dayId: string) => void;
  onEditExercise: (
    programId: string,
    dayId: string,
    exercise: ProgramExercise
  ) => void;
  onOpenExerciseInfo: (exercise: ProgramExercise) => void;
  onDeleteExercise: (programId: string, dayId: string, exerciseId: string) => void;
  onMoveExercise: (
    programId: string,
    dayId: string,
    exerciseId: string,
    direction: -1 | 1
  ) => void;
  onToggleExerciseWeightUnit: (
    programId: string,
    dayId: string,
    exerciseId: string
  ) => void;
  onCreateExerciseSuperset: (
    programId: string,
    dayId: string,
    exerciseId: string
  ) => void;
  onRemoveExerciseSuperset: (
    programId: string,
    dayId: string,
    exerciseId: string
  ) => void;
  onStartDay: (dayId?: string) => void;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [otherProgramsOpen, setOtherProgramsOpen] = useState(false);
  const [programMenuOpen, setProgramMenuOpen] = useState(false);
  const [exerciseMenu, setExerciseMenu] = useState<ExerciseMenuState>(null);
  const activeProgram =
    programs.find((program) => program.active) ?? selectedProgram ?? programs[0] ?? null;
  const detailProgram = selectedProgram ?? activeProgram;
  const otherPrograms = programs.filter((program) => program.id !== activeProgram?.id);

  const openProgramDetail = (program: TrainingProgram) => {
    onSelectProgram(program.id);
    setDetailOpen(true);
    setOtherProgramsOpen(false);
    setProgramMenuOpen(false);
  };

  if (!activeProgram) {
    return (
      <section className="programs-native-screen">
        <ProgramsNativeTopBar
          menuOpen={programMenuOpen}
          onNewProgram={onNewProgram}
          onToggleMenu={() => setProgramMenuOpen((open) => !open)}
          onToggleOtherPrograms={() => setOtherProgramsOpen((open) => !open)}
        />
        <EmptyState
          title="Ingen programmer"
          body="Opret det første program og tilføj træningsdage."
          action="Nyt program"
          onAction={onNewProgram}
        />
      </section>
    );
  }

  if (!detailOpen || !detailProgram) {
    return (
      <section className="programs-native-screen">
        <ProgramsNativeTopBar
          menuOpen={programMenuOpen}
          onNewProgram={onNewProgram}
          onToggleMenu={() => setProgramMenuOpen((open) => !open)}
          onToggleOtherPrograms={() => setOtherProgramsOpen((open) => !open)}
        />

        <div
          className={classNames(
            "programs-focus-stack",
            otherProgramsOpen && "is-expanded"
          )}
        >
          <article
            className={classNames(
              "active-program-card",
              !activeProgram.image && "without-media"
            )}
          >
            <div className="active-program-status">
              <span className="active-program-seal" aria-hidden="true">✓</span>
              <div>
                <strong>AKTIVT PROGRAM</strong>
                <p>Klar til næste træningspas</p>
              </div>
              <span className="selected-pill">Valgt</span>
            </div>

            <div className="active-program-body">
              {activeProgram.image ? (
                <SafeImage
                  className="active-program-thumb"
                  src={activeProgram.image}
                  alt=""
                />
              ) : null}
              <div className="active-program-copy">
                <h2>{activeProgram.name}</h2>
                <p>{activeProgram.description}</p>
                <button
                  type="button"
                  className="open-program-button"
                  onClick={() => openProgramDetail(activeProgram)}
                >
                  <span aria-hidden="true">→</span>
                  Åbn program
                </button>
              </div>
            </div>
          </article>

          <button
            type="button"
            className="other-programs-toggle"
            onClick={() => setOtherProgramsOpen((open) => !open)}
            aria-expanded={otherProgramsOpen}
          >
            <span>Andre programmer</span>
            <strong aria-hidden="true">{otherProgramsOpen ? "⌃" : "›"}</strong>
          </button>

          {otherProgramsOpen ? (
            <div className="other-programs-panel">
              {otherPrograms.length ? (
                otherPrograms.map((program) => (
                  <article className="other-program-row" key={program.id}>
                    {program.image ? (
                      <SafeImage className="other-program-thumb" src={program.image} alt="" />
                    ) : null}
                    <div>
                      <span>{program.visibility}</span>
                      <h3>{program.name}</h3>
                      <p>{program.days.length} dage</p>
                    </div>
                    <div className="other-program-actions">
                      <button type="button" onClick={() => openProgramDetail(program)}>
                        Åbn program
                      </button>
                      {!program.active ? (
                        <button type="button" onClick={() => onSetActive(program.id)}>
                          Aktivér
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <div className="inline-empty">
                  <strong>Ingen andre programmer</strong>
                  <span>Opret et nyt program for at se flere her.</span>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="program-detail-fullscreen" aria-label="Programdetalje">
      <div className="program-detail-scroll">
        <header className="program-detail-hero">
          {detailProgram.image ? (
            <SafeImage
              className="program-detail-hero-image"
              src={detailProgram.image}
              alt=""
            />
          ) : null}
          <PhoneStatusBar />
          <button
            type="button"
            className="program-back-circle"
            aria-label="Tilbage til programmer"
            onClick={() => setDetailOpen(false)}
          >
            ‹
          </button>
          <span className="program-active-badge">
            {detailProgram.active ? "Aktivt program" : "Ikke aktiv"}
          </span>
          <div className="program-detail-hero-copy">
            <h1>{detailProgram.name}</h1>
            <p>{detailProgram.description}</p>
          </div>
        </header>

        <section className="program-days-section">
          <div className="program-days-head">
            <div>
              <h2>Programdage</h2>
              <p>{detailProgram.days.length} dage i alt</p>
            </div>
            <div className="program-days-actions">
              <button type="button" onClick={() => onEditProgram(detailProgram)}>
                <span aria-hidden="true">⌖</span>
                Tilføj center
              </button>
              <button type="button" onClick={() => onNewDay(detailProgram.id)}>
                <span aria-hidden="true">+</span>
                Tilføj ny dag
              </button>
            </div>
          </div>

          <p className="drag-hint">Hold og træk en programdag for at flytte den.</p>

          {!detailProgram.active ? (
            <button className="button primary full" onClick={() => onSetActive(detailProgram.id)}>
              Aktivér program
            </button>
          ) : null}

          {detailProgram.days.length ? (
            <div className="native-day-list">
              {detailProgram.days.map((day, index) => {
                const open = expandedDays[day.id] ?? false;
                return (
                  <article className="native-day-card" key={day.id}>
                    <div className="native-day-head">
                      {day.image ? (
                        <SafeImage className="native-day-image" src={day.image} alt="" />
                      ) : null}
                      <div>
                        <h3>{day.name}</h3>
                        <p>{day.description}</p>
                        <strong>{day.exercises.length} øvelser</strong>
                      </div>
                      <button
                        type="button"
                        className="native-row-icon"
                        aria-label={open ? "Luk programdag" : "Åbn programdag"}
                        onClick={() => onToggleDay(day.id)}
                      >
                        {open ? "⌃" : "⌄"}
                      </button>
                      <button
                        type="button"
                        className="native-row-icon dots"
                        aria-label={`Rediger ${day.name}`}
                        onClick={() => onEditDay(detailProgram.id, day)}
                      >
                        •••
                      </button>
                    </div>

                    {open ? (
                      <div className="native-day-body">
                        <div className="native-day-edit-actions">
                          <span>☰ Træk og slip for at flytte øvelser.</span>
                        </div>
                        <ExerciseInsertButton
                          label="Tilføj øvelse først"
                          onClick={() => onNewExercise(detailProgram.id, day.id)}
                        />
                        <div className="native-exercise-list">
                          {day.exercises.map((exercise, exerciseIndex) => {
                            const exerciseOpen = expandedExercises[exercise.id] ?? false;
                            const menuOpen =
                              exerciseMenu?.programId === detailProgram.id &&
                              exerciseMenu.dayId === day.id &&
                              exerciseMenu.exerciseId === exercise.id;
                            const nextExercise = day.exercises[exerciseIndex + 1];
                            const canCreateSuperset =
                              Boolean(nextExercise) &&
                              !exercise.supersetGroupId &&
                              !nextExercise?.supersetGroupId;
                            const canRemoveSuperset = Boolean(exercise.supersetGroupId);
                            const supersetLabel = exercise.supersetGroupId
                              ? `Supersæt · ${exercise.supersetPosition ?? exerciseIndex + 1}`
                              : null;
                            return (
                            <div
                              className={classNames(
                                "native-exercise-group",
                                exerciseOpen && "is-open",
                                exercise.supersetGroupId && "is-superset"
                              )}
                              key={exercise.id}
                            >
                              <div className={classNames("native-exercise-row", exerciseOpen && "is-open")}>
                                <span className="native-exercise-index">{exerciseIndex + 1}</span>
                                <div>
                                  <h4>{exercise.name}</h4>
                                  {supersetLabel ? <span className="superset-badge">{supersetLabel}</span> : null}
                                  <p>
                                    {exercise.sets} sæt · {exercise.reps} gent. ·{" "}
                                    {formatExerciseWeight(exercise)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  className="native-row-icon"
                                  aria-label={
                                    exerciseOpen
                                      ? `Luk ${exercise.name}`
                                      : `Åbn ${exercise.name}`
                                  }
                                  onClick={() => onToggleExercise(exercise.id)}
                                >
                                  {exerciseOpen ? "⌃" : "⌄"}
                                </button>
                                <button
                                  type="button"
                                  className="native-row-icon dots"
                                  aria-label={`Handlinger for ${exercise.name}`}
                                  aria-expanded={menuOpen}
                                  onClick={() =>
                                    setExerciseMenu((current) =>
                                      current?.exerciseId === exercise.id &&
                                      current.dayId === day.id &&
                                      current.programId === detailProgram.id
                                        ? null
                                        : {
                                            programId: detailProgram.id,
                                            dayId: day.id,
                                            exerciseId: exercise.id
                                          }
                                    )
                                  }
                              >
                                •••
                              </button>
                              </div>
                              {menuOpen ? (
                                <>
                                  <button
                                    type="button"
                                    className="exercise-action-scrim"
                                    aria-label="Luk øvelsesmenu"
                                    onClick={() => setExerciseMenu(null)}
                                  />
                                  <ExerciseActionMenu
                                    exercise={exercise}
                                    canCreateSuperset={canCreateSuperset}
                                    canRemoveSuperset={canRemoveSuperset}
                                    onEditDefaults={() => {
                                      setExerciseMenu(null);
                                      onEditExercise(detailProgram.id, day.id, exercise);
                                    }}
                                    onOpenInfo={() => {
                                      setExerciseMenu(null);
                                      onOpenExerciseInfo(exercise);
                                    }}
                                    onReplace={() => {
                                      setExerciseMenu(null);
                                      onEditExercise(detailProgram.id, day.id, exercise);
                                    }}
                                    onToggleWeightUnit={() => {
                                      setExerciseMenu(null);
                                      onToggleExerciseWeightUnit(detailProgram.id, day.id, exercise.id);
                                    }}
                                    onCreateSuperset={() => {
                                      setExerciseMenu(null);
                                      onCreateExerciseSuperset(detailProgram.id, day.id, exercise.id);
                                    }}
                                    onRemoveSuperset={() => {
                                      setExerciseMenu(null);
                                      onRemoveExerciseSuperset(detailProgram.id, day.id, exercise.id);
                                    }}
                                    onDelete={() => {
                                      setExerciseMenu(null);
                                      onDeleteExercise(detailProgram.id, day.id, exercise.id);
                                    }}
                                  />
                                </>
                              ) : null}
                              {exerciseOpen ? (
                                <div className="native-exercise-expanded">
                                  <div className="native-exercise-metric-grid">
                                    <MetricPreview label="Sæt" value={String(exercise.sets)} />
                                    <MetricPreview
                                      label="Gentagelser"
                                      value={exercise.reps.replace("-", " - ")}
                                    />
                                    <MetricPreview
                                      label="Pause"
                                      value={formatRestTime(exercise.restSeconds)}
                                    />
                                    <MetricPreview
                                      label={`Vægt (${exercise.unit === "lbs" ? "lbs" : "kg"})`}
                                      value={exercise.weight}
                                    />
                                  </div>
                                  <div className="native-exercise-rpe">
                                    <MetricPreview label="RPE" value="6" />
                                  </div>
                                  <div className="native-note-preview">
                                    {exercise.note || "Ingen note"}
                                  </div>
                                  <div className="native-toggle-preview">
                                    <span>◕ AMRAP {exercise.amrap ? "Til" : "Fra"}</span>
                                    <span>◕ Dropset {exercise.dropset ? "Til" : "Fra"}</span>
                                  </div>
                                </div>
                              ) : null}
                              <ExerciseInsertButton
                                label={`Indsæt efter ${exercise.name}`}
                                onClick={() => onNewExercise(detailProgram.id, day.id)}
                              />
                            </div>
                          );
                          })}
                        </div>
                        <div className="native-danger-row">
                          <button type="button" onClick={() => onMoveDay(detailProgram.id, day.id, -1)}>
                            Flyt op
                          </button>
                          <button type="button" onClick={() => onMoveDay(detailProgram.id, day.id, 1)}>
                            Flyt ned
                          </button>
                          <button
                            type="button"
                            className="danger-text"
                            onClick={() => onDeleteDay(detailProgram.id, day.id)}
                          >
                            Slet dag
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Ingen træningsdage"
              body="Tilføj en dag og indsæt de øvelser, der skal køres."
              action="Tilføj ny dag"
              onAction={() => onNewDay(detailProgram.id)}
            />
          )}
        </section>
      </div>
      <div className="program-close-bar">
        <button type="button" onClick={() => setDetailOpen(false)}>
          Luk
        </button>
      </div>
    </section>
  );
}

function ExerciseInsertButton({
  label,
  onClick
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="exercise-insert" aria-label={label} onClick={onClick}>
      <span aria-hidden="true">+</span>
    </button>
  );
}

function ExerciseActionMenu({
  exercise,
  canCreateSuperset,
  canRemoveSuperset,
  onEditDefaults,
  onOpenInfo,
  onReplace,
  onToggleWeightUnit,
  onCreateSuperset,
  onRemoveSuperset,
  onDelete
}: {
  exercise: ProgramExercise;
  canCreateSuperset: boolean;
  canRemoveSuperset: boolean;
  onEditDefaults: () => void;
  onOpenInfo: () => void;
  onReplace: () => void;
  onToggleWeightUnit: () => void;
  onCreateSuperset: () => void;
  onRemoveSuperset: () => void;
  onDelete: () => void;
}) {
  const weightUnitLabel = exercise.unit === "lbs" ? "Skift til kg" : "Skift til lbs";

  return (
    <div className="exercise-action-menu" role="menu" aria-label={`Handlinger for ${exercise.name}`}>
      <button type="button" role="menuitem" onClick={onEditDefaults}>
        <span aria-hidden="true">✎</span>
        Rediger standarder
      </button>
      <button type="button" role="menuitem" onClick={onOpenInfo}>
        <span aria-hidden="true">i</span>
        Se øvelsesinfo
      </button>
      <button type="button" role="menuitem" onClick={onReplace}>
        <span aria-hidden="true">↻</span>
        Udskift øvelse
      </button>
      {exercise.unit !== "time" ? (
        <button type="button" role="menuitem" onClick={onToggleWeightUnit}>
          <span aria-hidden="true">▣</span>
          {weightUnitLabel}
        </button>
      ) : null}
      {canCreateSuperset ? (
        <button type="button" role="menuitem" onClick={onCreateSuperset}>
          <span aria-hidden="true">∞+</span>
          Lav supersæt med næste øvelse
        </button>
      ) : null}
      {canRemoveSuperset ? (
        <button type="button" role="menuitem" onClick={onRemoveSuperset}>
          <span aria-hidden="true">−</span>
          Fjern fra supersæt
        </button>
      ) : null}
      <button type="button" role="menuitem" className="danger" onClick={onDelete}>
        <span aria-hidden="true">▱</span>
        Fjern øvelse
      </button>
    </div>
  );
}

function MetricPreview({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-preview">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProgramsNativeTopBar({
  menuOpen,
  onNewProgram,
  onToggleMenu,
  onToggleOtherPrograms
}: {
  menuOpen: boolean;
  onNewProgram: () => void;
  onToggleMenu: () => void;
  onToggleOtherPrograms: () => void;
}) {
  return (
    <header className="programs-native-topbar">
      <button type="button" className="programs-new-button" onClick={onNewProgram}>
        <span aria-hidden="true">+</span>
        Nyt program
      </button>
      <img src="/brand/tm-logo-256.webp" alt="Træningsmester" />
      <div className="programs-more-wrap">
        <button
          type="button"
          className="programs-more-button"
          aria-label="Flere programhandlinger"
          aria-expanded={menuOpen}
          onClick={onToggleMenu}
        >
          •••
        </button>
        {menuOpen ? (
          <div className="programs-menu-popover">
            <button type="button" onClick={onNewProgram}>Tilføj træningsprogram</button>
            <button type="button" onClick={onToggleOtherPrograms}>Vis andre programmer</button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function MatchScreen({
  item,
  nextItem,
  liked,
  skippedCount,
  position,
  total,
  onBack,
  onLike,
  onSkip,
  onUndo,
  onReset
}: {
  item: MatchItem | null;
  nextItem: MatchItem | null;
  liked: MatchItem[];
  skippedCount: number;
  position: number;
  total: number;
  onBack: () => void;
  onLike: () => void;
  onSkip: () => void;
  onUndo: () => void;
  onReset?: () => void;
}) {
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const hasChoiceToUndo = liked.length > 0 || skippedCount > 0;
  const isDragging = dragStartX !== null;
  const dragDirection = dragX > 0 ? "LIKE" : "SKIP";
  const dragProgress = Math.min(1, Math.abs(dragX) / 120);
  const frontCardStyle = {
    "--drag-x": `${dragX}px`,
    "--drag-y": `${Math.abs(dragX) * 0.04}px`,
    "--drag-rotate": `${dragX / 22}deg`,
    "--swipe-opacity": dragProgress,
    transition: isDragging ? "none" : undefined
  } as CSSProperties;

  const startDrag = (event: PointerEvent<HTMLElement>) => {
    if (!item) return;
    setDragStartX(event.clientX);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: PointerEvent<HTMLElement>) => {
    if (dragStartX === null) return;
    setDragX(event.clientX - dragStartX);
  };

  const finishDrag = () => {
    const committedDragX = dragX;
    setDragStartX(null);
    setDragX(0);
    if (committedDragX > 120) {
      onLike();
    } else if (committedDragX < -120) {
      onSkip();
    }
  };

  return (
    <section className="match-native-screen">
      <header className="match-topbar">
        <button type="button" className="match-back-button" aria-label="Tilbage" onClick={onBack}>
          ‹
        </button>
        {total > 0 ? <span className="match-progress-pill">{position} / {total}</span> : null}
      </header>

      <section className="match-stage" aria-live="polite">
        {item ? (
          <div className="match-card-stack">
            {nextItem ? (
              <MatchCard item={nextItem} className="match-card-back" ariaHidden />
            ) : null}
            <MatchCard
              item={item}
              className="match-card-front"
              style={frontCardStyle}
              swipeLabel={Math.abs(dragX) > 10 ? dragDirection : null}
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={finishDrag}
              onPointerCancel={finishDrag}
            />
          </div>
        ) : (
          <div className="match-empty-card">
            <EmptyState
              title="Kortkøen er tom"
              body={
                import.meta.env.DEV && onReset
                  ? "Du har gennemgået øvelserne i den lokale testkø."
                  : "Der er ingen nye øvelser at gennemgå lige nu."
              }
              action={import.meta.env.DEV && onReset ? "Start forfra" : undefined}
              onAction={onReset}
            />
          </div>
        )}
      </section>

      <div className="match-actions">
        <button
          className="round-action muted"
          onClick={onUndo}
          aria-label="Fortryd"
          disabled={!hasChoiceToUndo}
        >
          ↶
        </button>
        <div className="match-primary-actions" aria-label="Match handlinger">
          <button className="round-action skip" onClick={onSkip} aria-label="Skip" disabled={!item}>
            ×
          </button>
          <button className="round-action like" onClick={onLike} aria-label="Like" disabled={!item}>
            ♥
          </button>
        </div>
      </div>
      <p className="match-hint">Swipe venstre = skip, højre = like</p>
    </section>
  );
}

function MatchCard({
  item,
  className,
  style,
  swipeLabel,
  ariaHidden = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel
}: {
  item: MatchItem;
  className?: string;
  style?: CSSProperties;
  swipeLabel?: "LIKE" | "SKIP" | null;
  ariaHidden?: boolean;
  onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove?: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp?: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel?: (event: PointerEvent<HTMLElement>) => void;
}) {
  return (
    <article
      className={classNames("match-card", className)}
      style={style}
      aria-hidden={ariaHidden}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {swipeLabel ? <div className={classNames("match-swipe-label", swipeLabel === "LIKE" ? "like" : "skip")}>{swipeLabel}</div> : null}
      <MatchMedia item={item} />
      <div className="match-copy">
        <h2>{item.name}</h2>
        <div className="tag-row">
          <span>{item.muscle}</span>
          <span>{item.level}</span>
        </div>
        <p>{item.description}</p>
      </div>
    </article>
  );
}

function MatchMedia({ item }: { item: MatchItem }) {
  if (item.image) {
    return (
      <div className="match-media">
        <img src={item.image} alt="" draggable={false} />
      </div>
    );
  }

  return (
    <div className="match-media match-fallback">
      <div>
        <span aria-hidden="true">⌁</span>
        <strong>Øvelsesinfo klar</strong>
        <p>Kortet viser muskelgruppe, niveau og beskrivelse i stedet.</p>
      </div>
    </div>
  );
}

function SocialScreen({
  history,
  social,
  onHide,
  onHistory
}: {
  history: HistoryEntry[];
  social: AppState["social"];
  onHide: (historyId: string) => void;
  onHistory: () => void;
}) {
  const visible = history.filter((entry) => !social.hiddenHistoryIds.includes(entry.id));
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const copyFriendCode = async () => {
    try {
      await navigator.clipboard.writeText(social.friendCode);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <ScreenShell eyebrow="Social" title="Social">
      <section className="form-section">
        <h3>Din vennekode</h3>
        {social.friendCode ? (
          <>
            <div className="friend-code">
              <strong>{social.friendCode}</strong>
              <button className="small-button" onClick={copyFriendCode}>
                {copyState === "copied" ? "Kopieret" : "Kopiér"}
              </button>
            </div>
            {copyState === "failed" ? (
              <p className="error-text">Kopiering blev blokeret af browseren.</p>
            ) : null}
          </>
        ) : (
          <p className="section-copy">
            Vennekode er ikke tilgængelig i webappen endnu.
          </p>
        )}
      </section>
      {visible.length ? (
        <section className="history-list">
          {visible.slice(0, 4).map((entry) => (
            <article className="history-card" key={entry.id}>
              <div className="history-head">
                <div>
                  <span>{entry.kind}</span>
                  <h3>{entry.title}</h3>
                  <p>{formatDate(entry.date)}</p>
                </div>
                <button className="plain-icon" onClick={() => onHide(entry.id)}>
                  Skjul
                </button>
              </div>
              <div className="summary-grid">
                <Metric label="Tid" value={`${entry.durationMinutes} min`} />
                {entry.kind === "Cardio" ? (
                  <Metric
                    label="Distance"
                    value={
                      entry.distanceKm !== undefined
                        ? `${entry.distanceKm.toLocaleString("da-DK")} km`
                        : "-"
                    }
                  />
                ) : (
                  <Metric
                    label="Volumen"
                    value={entry.volumeKg ? `${entry.volumeKg} kg` : "-"}
                  />
                )}
                <Metric label="Øvelser" value={String(entry.exercises.length)} />
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          title="Intet socialt feed endnu"
          body="Afsluttede træninger kan vises som private previews her, indtil der findes rigtige venneaktiviteter."
          action="Åbn historik"
          onAction={onHistory}
        />
      )}
    </ScreenShell>
  );
}

function ConfirmDialog({
  confirm,
  onCancel,
  onConfirm
}: {
  confirm: ConfirmState;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useModalFocus(Boolean(confirm), onCancel);
  if (!confirm) return null;
  return (
    <div
      ref={dialogRef}
      className="modal-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      tabIndex={-1}
    >
      <button className="modal-backdrop" aria-label="Annuller" onClick={onCancel} />
      <section className="sheet confirm-sheet">
        <span>Bekræft handling</span>
        <h2 id="confirm-title">{confirm.title}</h2>
        <p>{confirm.body}</p>
        <div className="form-actions">
          <button
            className="button muted"
            type="button"
            onClick={onCancel}
            data-modal-initial-focus
          >
            {confirm.cancelLabel ?? "Annuller"}
          </button>
          <button
            className={classNames(
              "button",
              confirm.tone === "danger" ? "danger" : "primary"
            )}
            type="button"
            onClick={onConfirm}
          >
            {confirm.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function CrudModal({
  modal,
  onClose,
  onSaveProgram,
  onSaveDay,
  onSaveExercise,
  onSaveHistory
}: {
  modal: ModalState;
  onClose: () => void;
  onSaveProgram: (program: TrainingProgram) => void;
  onSaveDay: (programId: string, day: WorkoutDay) => void;
  onSaveExercise: (
    programId: string,
    dayId: string,
    exercise: ProgramExercise
  ) => void;
  onSaveHistory: (entry: HistoryEntry) => void;
}) {
  const dialogRef = useModalFocus(Boolean(modal), onClose);
  if (!modal) return null;
  return (
    <div
      ref={dialogRef}
      className="modal-layer"
      role="dialog"
      aria-modal="true"
      aria-label="Rediger"
      tabIndex={-1}
    >
      <button className="modal-backdrop" aria-label="Luk" onClick={onClose} />
      <section className="sheet">
        <button
          className="plain-icon sheet-close"
          onClick={onClose}
          aria-label="Luk"
          data-modal-initial-focus
        >
          ×
        </button>
        {modal.type === "program" ? (
          <ProgramForm
            program={modal.program}
            onSave={onSaveProgram}
            onCancel={onClose}
          />
        ) : null}
        {modal.type === "day" ? (
          <DayForm
            day={modal.day}
            programId={modal.programId}
            onSave={onSaveDay}
            onCancel={onClose}
          />
        ) : null}
        {modal.type === "exercise" ? (
          <ExerciseForm
            exercise={modal.exercise}
            programId={modal.programId}
            dayId={modal.dayId}
            onSave={onSaveExercise}
            onCancel={onClose}
          />
        ) : null}
        {modal.type === "exerciseInfo" ? (
          <ExerciseInfoSheet exercise={modal.exercise} onClose={onClose} />
        ) : null}
        {modal.type === "history" ? (
          <HistoryForm
            entry={modal.entry}
            onSave={onSaveHistory}
            onCancel={onClose}
          />
        ) : null}
      </section>
    </div>
  );
}

function SafeImage({
  src,
  fallbackSrc,
  className,
  alt
}: {
  src?: string;
  fallbackSrc?: string;
  className?: string;
  alt: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setFailed(false);
  }, [src]);

  if (!currentSrc || failed) return null;

  return (
    <img
      className={className}
      src={currentSrc}
      alt={alt}
      onError={() => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
          return;
        }
        setFailed(true);
      }}
    />
  );
}

function HistoryForm({
  entry,
  onSave,
  onCancel
}: {
  entry?: HistoryEntry;
  onSave: (entry: HistoryEntry) => void;
  onCancel: () => void;
}) {
  const [kind, setKind] = useState<HistoryEntry["kind"]>(entry?.kind ?? "Styrketræning");
  const [title, setTitle] = useState(entry?.title ?? "Manuel styrketræning");
  const [date, setDate] = useState(toLocalDateTimeInput(entry?.date ?? new Date().toISOString()));
  const [duration, setDuration] = useState(String(entry?.durationMinutes ?? 45));
  const [distance, setDistance] = useState(
    entry?.distanceKm !== undefined ? String(entry.distanceKm).replace(".", ",") : ""
  );
  const [volume, setVolume] = useState(String(entry?.volumeKg ?? 0));
  const [sets, setSets] = useState(String(entry?.sets ?? 0));
  const [exercises, setExercises] = useState(entry?.exercises.join(", ") ?? "");
  const [note, setNote] = useState(entry?.note ?? "");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    const durationMinutes = Number.parseInt(duration, 10);
    const parsedDistance = distance.trim()
      ? Number.parseFloat(distance.trim().replace(",", "."))
      : undefined;
    const volumeKg = Number.parseInt(volume, 10);
    const setCount = Number.parseInt(sets, 10);

    if (!cleanTitle) {
      setError("Skriv en titel til historikposten.");
      return;
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      setError("Varighed skal være mindst 1 minut.");
      return;
    }
    if (
      kind === "Cardio" &&
      parsedDistance !== undefined &&
      (!Number.isFinite(parsedDistance) || parsedDistance < 0)
    ) {
      setError("Distance skal være tom eller et positivt tal.");
      return;
    }
    if (kind === "Styrketræning" && (!Number.isFinite(volumeKg) || volumeKg < 0)) {
      setError("Volumen skal være 0 eller højere.");
      return;
    }
    if (kind === "Styrketræning" && (!Number.isFinite(setCount) || setCount < 0)) {
      setError("Sæt skal være 0 eller højere.");
      return;
    }

    const exerciseList = exercises
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    onSave({
      id: entry?.id ?? createId("hist"),
      title: cleanTitle,
      kind,
      date: fromLocalDateTimeInput(date),
      durationMinutes,
      distanceKm: kind === "Cardio" ? parsedDistance : undefined,
      volumeKg: kind === "Styrketræning" ? volumeKg : 0,
      sets: kind === "Styrketræning" ? setCount : 0,
      exercises: exerciseList.length ? exerciseList : [cleanTitle],
      note: note.trim()
    });
  };

  return (
    <form className="sheet-form" onSubmit={submit}>
      <span>Historik</span>
      <h2>{entry ? "Rediger historik" : "Manuel historik"}</h2>
      <div className="segmented">
        {(["Styrketræning", "Cardio"] as const).map((item) => (
          <button
            type="button"
            key={item}
            className={kind === item ? "active" : ""}
            onClick={() => setKind(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <Field label="Titel" value={title} onChange={setTitle} />
      <label className="field">
        <span>Dato og tid</span>
        <div className="input-shell">
          <input type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
      </label>
      <div className="field-grid">
        <Field label="Varighed" value={duration} suffix="min" onChange={setDuration} />
        {kind === "Cardio" ? (
          <Field label="Distance" value={distance} suffix="km" onChange={setDistance} />
        ) : (
          <>
            <Field label="Volumen" value={volume} suffix="kg" onChange={setVolume} />
            <Field label="Sæt" value={sets} onChange={setSets} />
          </>
        )}
      </div>
      <Textarea
        label={kind === "Cardio" ? "Aktivitet / rute" : "Øvelser"}
        value={exercises}
        onChange={setExercises}
      />
      <Textarea label="Note" value={note} onChange={setNote} />
      {error ? <p className="error-text">{error}</p> : null}
      <FormActions onCancel={onCancel} submitLabel={entry ? "Gem historik" : "Opret historik"} />
    </form>
  );
}

function ProgramForm({
  program,
  onSave,
  onCancel
}: {
  program?: TrainingProgram;
  onSave: (program: TrainingProgram) => void;
  onCancel: () => void;
}) {
  const isEditing = Boolean(program);
  const [draft, setDraft] = useState<TrainingProgram>(
    () =>
      program ?? {
        ...createTrainingProgram(""),
        name: "",
        description: "",
        image: undefined,
        active: true
      }
  );
  const [currentStep, setCurrentStep] = useState<ProgramWizardStep>("basics");
  const [error, setError] = useState("");

  const trimmedName = draft.name.trim();
  const trimmedDescription = draft.description.trim();
  const trimmedImage = draft.image?.trim() ?? "";
  const currentStepIndex = programWizardSteps.findIndex((step) => step.id === currentStep);
  const primaryLabel =
    currentStep === "basics"
      ? "Fortsæt"
      : currentStep === "details"
        ? "Gennemse"
        : isEditing
          ? "Gem program"
          : "Opret program";

  const updateDraft = (patch: Partial<TrainingProgram>) => {
    setDraft((current) => ({ ...current, ...patch }));
    if ("name" in patch) setError("");
  };

  const saveDraft = () => {
    onSave({
      ...draft,
      name: trimmedName,
      description: trimmedDescription,
      center: draft.center.trim() || "Træningscenter",
      image: trimmedImage || undefined
    });
  };

  const goBack = () => {
    const previous = programWizardSteps[currentStepIndex - 1];
    if (previous) setCurrentStep(previous.id);
  };

  const goForward = () => {
    if (!trimmedName) {
      setError("Navn er påkrævet");
      setCurrentStep("basics");
      return;
    }

    if (currentStep === "basics") {
      setCurrentStep("details");
      return;
    }

    if (currentStep === "details") {
      setCurrentStep("review");
      return;
    }

    saveDraft();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (isEditing) {
      if (!trimmedName) {
        setError("Navn er påkrævet");
        return;
      }
      saveDraft();
      return;
    }

    goForward();
  };

  if (isEditing) {
    return (
      <form className="sheet-form program-edit-form" onSubmit={submit}>
        <span>Træningsprogram</span>
        <h2>Rediger program</h2>
        <Field label="Navn" value={draft.name} onChange={(name) => updateDraft({ name })} />
        <Textarea
          label="Beskrivelse"
          value={draft.description}
          onChange={(description) => updateDraft({ description })}
        />
        <Field
          label="Billede"
          value={draft.image ?? ""}
          onChange={(image) => updateDraft({ image })}
        />
        <Field label="Center" value={draft.center} onChange={(center) => updateDraft({ center })} />
        <div className="segmented">
          {(["Privat", "Delt"] as const).map((visibility) => (
            <button
              type="button"
              key={visibility}
              className={draft.visibility === visibility ? "active" : ""}
              onClick={() => updateDraft({ visibility })}
            >
              {visibility}
            </button>
          ))}
        </div>
        <label className="check-row">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(event) => updateDraft({ active: event.target.checked })}
          />
          Sæt som aktivt træningsprogram
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <FormActions onCancel={onCancel} submitLabel="Gem program" />
      </form>
    );
  }

  return (
    <form className="program-wizard" onSubmit={submit}>
      <div className="program-wizard-header">
        <img src="/brand/tm-logo-256.webp" alt="" />
        <span>Træningsprogram</span>
        <h2>Opret program</h2>
        <p>Start med navnet. Beskrivelse og billede kan tilføjes bagefter.</p>
        <div
          className="program-step-progress"
          aria-label={`Trin ${currentStepIndex + 1} af ${programWizardSteps.length}: ${
            programWizardSteps[currentStepIndex]?.title
          }`}
        >
          {programWizardSteps.map((step, index) => (
            <div
              key={step.id}
              className={classNames(
                "program-step-item",
                index <= currentStepIndex && "complete",
                step.id === currentStep && "current"
              )}
            >
              <span aria-hidden="true" />
              <strong>{step.title}</strong>
            </div>
          ))}
        </div>
      </div>

      {currentStep === "basics" ? (
        <section className="program-step-panel" aria-labelledby="program-basics-title">
          <div className="program-section-header">
            <h3 id="program-basics-title">Grundinfo</h3>
            <p>Giv programmet et navn, så du kan finde det igen i programlisten.</p>
          </div>
          <Field label="Navn" value={draft.name} onChange={(name) => updateDraft({ name })} />
          <div className="program-badge-row">
            <span className={classNames("program-state-badge", trimmedName ? "ready" : "required")}>
              {trimmedName ? "Navn klar" : "Navn er påkrævet"}
            </span>
            <span className="program-state-badge muted">Kan ændres senere</span>
          </div>
        </section>
      ) : null}

      {currentStep === "details" ? (
        <section className="program-step-panel" aria-labelledby="program-details-title">
          <div className="program-section-header">
            <h3 id="program-details-title">Detaljer</h3>
            <p>Valgfrit. Spring over hvis du vil bygge programmet først.</p>
          </div>
          <Textarea
            label="Beskrivelse"
            value={draft.description}
            onChange={(description) => updateDraft({ description })}
          />
          <div className="program-image-picker">
            <div className="program-image-thumb" aria-hidden="true">
              {trimmedImage ? (
                <SafeImage key={trimmedImage} src={trimmedImage} fallbackSrc="/brand/tm-logo-256.webp" alt="" />
              ) : (
                <span>Foto</span>
              )}
            </div>
            <label>
              <strong>{trimmedImage ? "Skift billede" : "Tilføj billede"}</strong>
              <small>
                {trimmedImage ? "Billedet beskæres kvadratisk." : "Valgfrit. Du kan springe det over."}
              </small>
              <input
                type="text"
                value={draft.image ?? ""}
                placeholder="/photos/recovery-program.png"
                onChange={(event) => updateDraft({ image: event.target.value })}
                aria-label="Billede"
              />
            </label>
            {trimmedImage ? (
              <button type="button" className="program-remove-image" onClick={() => updateDraft({ image: undefined })}>
                Fjern
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      {currentStep === "review" ? (
        <section className="program-step-panel" aria-labelledby="program-review-title">
          <div className="program-section-header">
            <h3 id="program-review-title">Gennemse</h3>
            <p>Tjek oplysningerne før programmet oprettes.</p>
          </div>
          <div className="program-review-list">
            <ProgramReviewRow label="Navn" value={trimmedName || "Navn mangler"} />
            <ProgramReviewRow
              label="Beskrivelse"
              value={trimmedDescription || "Ingen beskrivelse"}
            />
            <ProgramReviewRow label="Billede" value={trimmedImage ? "Valgt" : "Springes over"} />
          </div>
          <button type="button" className="button muted full" onClick={() => setCurrentStep("details")}>
            Rediger detaljer
          </button>
        </section>
      ) : null}

      {error ? <p className="error-text">{error}</p> : null}
      <div className={classNames("program-wizard-actions", currentStep === "basics" && "single")}>
        {currentStep !== "basics" ? (
          <button type="button" className="button muted" onClick={goBack}>
            Tilbage
          </button>
        ) : null}
        <button type="submit" className="button primary" disabled={!trimmedName}>
          {primaryLabel}
        </button>
      </div>
    </form>
  );
}

function ProgramReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="program-review-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ExerciseInfoSheet({
  exercise,
  onClose
}: {
  exercise: ProgramExercise;
  onClose: () => void;
}) {
  const template = exerciseCatalog.find((item) => item.id === exercise.exerciseId);
  const description =
    template?.description ??
    "Denne øvelse er gemt i programmet. Rediger standarder eller udskift den fra øvelsesmenuen.";

  return (
    <div className="sheet-form exercise-info-sheet">
      <span>Øvelsesinfo</span>
      <h2>{exercise.name}</h2>
      {template?.image ? (
        <SafeImage className="exercise-info-image" src={template.image} alt="" />
      ) : null}
      <p>{description}</p>
      <div className="exercise-info-facts">
        <MetricPreview label="Muskel" value={template?.muscle ?? "Ukendt"} />
        <MetricPreview label="Udstyr" value={template?.equipment ?? "Ukendt"} />
      </div>
      <div className="program-review-list">
        <ProgramReviewRow label="Sæt" value={String(exercise.sets)} />
        <ProgramReviewRow label="Gentagelser" value={exercise.reps} />
        <ProgramReviewRow label="Pause" value={formatRestTime(exercise.restSeconds)} />
        <ProgramReviewRow label="Vægt" value={formatExerciseWeight(exercise)} />
      </div>
      <button type="button" className="button primary full" onClick={onClose}>
        Luk
      </button>
    </div>
  );
}

function DayForm({
  day,
  programId,
  onSave,
  onCancel
}: {
  day?: WorkoutDay;
  programId: string;
  onSave: (programId: string, day: WorkoutDay) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<WorkoutDay>(() => day ?? createWorkoutDay());
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    onSave(programId, { ...draft, name: draft.name.trim() });
  };
  return (
    <form className="sheet-form" onSubmit={submit}>
      <span>Træningsdag</span>
      <h2>{day ? "Rediger træning" : "Ny træningsdag"}</h2>
      <Field label="Navn" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
      <Textarea
        label="Beskrivelse"
        value={draft.description}
        onChange={(description) => setDraft({ ...draft, description })}
      />
      <label className="field">
        <span>Ugedag</span>
        <select
          value={draft.weekday}
          onChange={(event) => setDraft({ ...draft, weekday: event.target.value })}
        >
          {["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"].map((dayName) => (
            <option key={dayName}>{dayName}</option>
          ))}
        </select>
      </label>
      <FormActions onCancel={onCancel} submitLabel="Gem dag" />
    </form>
  );
}

function ExerciseForm({
  exercise,
  programId,
  dayId,
  onSave,
  onCancel
}: {
  exercise?: ProgramExercise;
  programId: string;
  dayId: string;
  onSave: (programId: string, dayId: string, exercise: ProgramExercise) => void;
  onCancel: () => void;
}) {
  const initialTemplate =
    exerciseCatalog.find((item) => item.id === exercise?.exerciseId) ?? exerciseCatalog[0];
  const [templateId, setTemplateId] = useState(initialTemplate.id);
  const [draft, setDraft] = useState<ProgramExercise>(
    () => exercise ?? createProgramExercise(initialTemplate)
  );
  const [query, setQuery] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("Alle");
  const [error, setError] = useState("");

  const selectedTemplate =
    exerciseCatalog.find((item) => item.id === templateId) ?? initialTemplate;
  const muscleFilters = useMemo(
    () => ["Alle", ...Array.from(new Set(exerciseCatalog.map((item) => item.muscle)))],
    []
  );
  const filteredExercises = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);
    return exerciseCatalog.filter((item) => {
      const matchesMuscle = muscleFilter === "Alle" || item.muscle === muscleFilter;
      const searchText = normalizeSearchText(
        `${item.name} ${item.muscle} ${item.equipment} ${item.description}`
      );
      return matchesMuscle && (!normalizedQuery || searchText.includes(normalizedQuery));
    });
  }, [muscleFilter, query]);

  const selectTemplate = (template: ExerciseTemplate) => {
    setTemplateId(template.id);
    setError("");
    setDraft((current) => {
      const useDefaults = shouldUseTemplateDefaults(current, template);
      const nextDefaults = createProgramExercise(template);
      return {
        ...current,
        exerciseId: template.id,
        name: template.name,
        reps: useDefaults ? nextDefaults.reps : current.reps,
        weight: useDefaults ? nextDefaults.weight : current.weight,
        unit: useDefaults ? nextDefaults.unit : current.unit
      };
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const cleanName = draft.name.trim();
    if (!cleanName) {
      setError("Skriv et navn til øvelsen.");
      return;
    }
    if (!draft.reps.trim()) {
      setError("Skriv gentagelser eller tid.");
      return;
    }
    if (!Number.isFinite(draft.sets) || draft.sets < 1) {
      setError("Sæt skal være mindst 1.");
      return;
    }
    if (!Number.isFinite(draft.restSeconds) || draft.restSeconds < 0) {
      setError("Pause skal være 0 sekunder eller højere.");
      return;
    }
    onSave(programId, dayId, { ...draft, name: draft.name.trim() });
  };

  return (
    <form className="sheet-form" onSubmit={submit}>
      <span>Øvelse</span>
      <h2>{exercise ? "Rediger øvelse" : "Tilføj øvelse"}</h2>
      <div className="exercise-picker">
        <div className="selected-exercise">
          <div>
            <span>Valgt øvelse</span>
            <strong>{selectedTemplate.name}</strong>
            <p>
              {selectedTemplate.muscle} · {selectedTemplate.equipment}
            </p>
          </div>
          <span>{draft.unit === "time" ? "Tid" : draft.unit}</span>
        </div>
        <label className="field">
          <span>Søg i øvelseskatalog</span>
          <div className="input-shell">
            <input
              type="search"
              value={query}
              placeholder="Navn, muskel eller udstyr"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </label>
        <div className="chip-row exercise-filter-row" aria-label="Filtrer efter muskel">
          {muscleFilters.map((muscle) => (
            <Chip
              key={muscle}
              active={muscleFilter === muscle}
              onClick={() => setMuscleFilter(muscle)}
            >
              {muscle}
            </Chip>
          ))}
        </div>
        <div className="catalog-result-line">
          <span>
            {filteredExercises.length}{" "}
            {filteredExercises.length === 1 ? "resultat" : "resultater"}
          </span>
          {query || muscleFilter !== "Alle" ? (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setQuery("");
                setMuscleFilter("Alle");
              }}
            >
              Ryd
            </button>
          ) : null}
        </div>
        <div className="exercise-catalog-list" role="listbox" aria-label="Øvelseskatalog">
          {filteredExercises.map((template) => (
            <button
              type="button"
              key={template.id}
              role="option"
              aria-selected={template.id === templateId}
              className={classNames(
                "exercise-catalog-option",
                template.image && "with-media",
                template.id === templateId && "active"
              )}
              onClick={() => selectTemplate(template)}
            >
              {template.image ? <img src={template.image} alt="" /> : null}
              <span>
                <strong>{template.name}</strong>
                <small>
                  {template.muscle} · {template.equipment}
                </small>
                <p>{template.description}</p>
              </span>
              {template.id === templateId ? <em>Valgt</em> : null}
            </button>
          ))}
          {filteredExercises.length === 0 ? (
            <div className="inline-empty">
              <strong>Ingen øvelser matcher</strong>
              <p>Ryd søgningen eller vælg en bredere muskelgruppe.</p>
            </div>
          ) : null}
        </div>
      </div>
      <Field label="Navn" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
      <div className="field-grid">
        <NumberField
          label="Sæt"
          min={1}
          value={draft.sets}
          onChange={(sets) => setDraft({ ...draft, sets: Math.max(1, sets) })}
        />
        <Field label="Gentagelser" value={draft.reps} onChange={(reps) => setDraft({ ...draft, reps })} />
        <Field label="Vægt" value={draft.weight} onChange={(weight) => setDraft({ ...draft, weight })} />
        <NumberField
          label="Pause"
          min={0}
          value={draft.restSeconds}
          suffix="sek"
          onChange={(restSeconds) => setDraft({ ...draft, restSeconds: Math.max(0, restSeconds) })}
        />
      </div>
      <Textarea label="Note" value={draft.note} onChange={(note) => setDraft({ ...draft, note })} />
      <div className="inline-checks">
        <label className="check-row">
          <input
            type="checkbox"
            checked={draft.amrap}
            onChange={(event) => setDraft({ ...draft, amrap: event.target.checked })}
          />
          AMRAP
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={draft.dropset}
            onChange={(event) => setDraft({ ...draft, dropset: event.target.checked })}
          />
          Dropset
        </label>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      <FormActions onCancel={onCancel} submitLabel="Gem øvelse" />
    </form>
  );
}

function shouldUseTemplateDefaults(current: ProgramExercise, nextTemplate: ExerciseTemplate) {
  const previousTemplate =
    exerciseCatalog.find((item) => item.id === current.exerciseId) ?? nextTemplate;
  const previousDefaults = createProgramExercise(previousTemplate);
  return (
    current.reps === previousDefaults.reps &&
    current.weight === previousDefaults.weight &&
    current.unit === previousDefaults.unit
  );
}

function LoginScreen({
  supabaseEnabled,
  onSubmit
}: {
  supabaseEnabled: boolean;
  onSubmit: (payload: {
    mode: "login" | "signup";
    email: string;
    password: string;
    name: string;
    healthDataConsent: boolean;
  }) => Promise<string>;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [healthDataConsent, setHealthDataConsent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!emailPattern.test(cleanEmail)) {
      setError("Skriv en gyldig emailadresse.");
      return;
    }
    if (mode === "signup" && name.trim().length < 2) {
      setError("Skriv et navn til kontoen.");
      return;
    }
    if (password.length < 6) {
      setError("Adgangskoden skal være mindst 6 tegn.");
      return;
    }
    if (mode === "signup" && !healthDataConsent) {
      setError("Du skal tage stilling til behandlingen af dine trænings- og aktivitetsdata.");
      return;
    }
    setSubmitting(true);
    setError("");
    const result = await onSubmit({
      mode,
      email: cleanEmail,
      password,
      name: name.trim(),
      healthDataConsent: mode === "signup" && healthDataConsent
    });
    setSubmitting(false);
    if (result) setError(result);
  };
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <img src="/brand/tm-logo-256.webp" alt="" />
        <h1>Velkommen tilbage</h1>
        <p>
          {supabaseEnabled
            ? "Log ind med din Træningsmester-konto og hent dine programmer, historik og øvelser."
            : import.meta.env.DEV
              ? "Fortsæt med lokale programmer, logbog og historik i denne udviklingsbuild."
              : "Login er midlertidigt utilgængeligt, fordi den sikre kontoforbindelse mangler."}
        </p>
        <div className="segmented">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
              setHealthDataConsent(false);
            }}
          >
            Log ind
          </button>
          <button
            type="button"
            className={mode === "signup" ? "active" : ""}
            onClick={() => {
              setMode("signup");
              setError("");
            }}
          >
            Opret konto
          </button>
        </div>
        <form onSubmit={submit} className="sheet-form">
          {mode === "signup" ? (
            <Field label="Navn" value={name} onChange={setName} />
          ) : null}
          <Field label="Email" value={email} onChange={setEmail} />
          <Field label="Adgangskode" type="password" value={password} onChange={setPassword} />
          {mode === "signup" ? (
            <label className="check-row auth-consent">
              <input
                type="checkbox"
                checked={healthDataConsent}
                onChange={(event) => setHealthDataConsent(event.target.checked)}
                required
              />
              <span>
                Jeg giver udtrykkeligt samtykke til, at Træningsmester behandler de oplysninger
                om træning, kropsvægt og aktivitet, som jeg selv vælger at tilføje, for at levere
                logbog og progression. Samtykket kan trækkes tilbage. Se{" "}
                <a href="/privatliv" target="_blank" rel="noreferrer">
                  privatlivspolitikken
                </a>
                .{" "}
                <small title={HEALTH_DATA_CONSENT_VERSION}>
                  Samtykkeversion 1 · 13. juli 2026
                </small>
              </span>
            </label>
          ) : null}
          {error ? <p className="error-text">{error}</p> : null}
          <button
            className="button primary full"
            type="submit"
            disabled={submitting || (!supabaseEnabled && !import.meta.env.DEV)}
          >
            {submitting
              ? "Arbejder..."
              : mode === "login"
                ? "Log ind i appen"
                : supabaseEnabled
                  ? "Opret konto"
                  : import.meta.env.DEV
                    ? "Opret lokal konto"
                    : "Login er utilgængeligt"}
          </button>
        </form>
      </div>
    </div>
  );
}

function HealthDataConsentGate({
  onAccept,
  onLogout
}: {
  onAccept: () => Promise<void>;
  onLogout: () => void;
}) {
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!accepted) {
      setError("Du skal tage stilling, før du kan fortsætte.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onAccept();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Samtykket kunne ikke gemmes.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card consent-gate">
        <img src="/brand/tm-logo-256.webp" alt="" />
        <h1>Dit valg om træningsdata</h1>
        <p>
          Træningsmester skal bruge de oplysninger om træning, kropsvægt og aktivitet, som du
          selv vælger at tilføje, for at levere logbog og progression.
        </p>
        <form className="sheet-form" onSubmit={submit}>
          <label className="check-row auth-consent">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
            />
            <span>
              Jeg giver udtrykkeligt samtykke til denne behandling. Samtykket kan trækkes
              tilbage med virkning for fremtiden. Se{" "}
              <a href="/privatliv" target="_blank" rel="noreferrer">
                privatlivspolitikken
              </a>
              .{" "}
              <small title={HEALTH_DATA_CONSENT_VERSION}>
                Samtykkeversion 1 · 13. juli 2026
              </small>
            </span>
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button className="button primary full" type="submit" disabled={submitting}>
            {submitting ? "Gemmer sikkert..." : "Giv samtykke og fortsæt"}
          </button>
          <button className="button muted full" type="button" onClick={onLogout}>
            Log ud uden at fortsætte
          </button>
        </form>
      </div>
    </div>
  );
}

function OnboardingFlow({
  profile,
  onUpdateProfile,
  onFinish
}: {
  profile: UserProfile;
  onUpdateProfile: (patch: Partial<UserProfile>) => void;
  onFinish: () => void;
}) {
  type OnboardingPath = UserProfile["onboardingStartMode"] | "import" | "ai";
  const [introDone, setIntroDone] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState(profile.name);
  const [bodyweight, setBodyweight] = useState(profile.bodyweight);
  const [selectedPath, setSelectedPath] = useState<OnboardingPath>(
    profile.onboardingStartMode
  );
  const [selectedStarterProgram, setSelectedStarterProgram] = useState("strong-start");
  const [programText, setProgramText] = useState("");
  const [restTimer, setRestTimer] = useState(profile.restTimer);
  const [trackerLogging, setTrackerLogging] = useState(profile.trackerLogging);
  const [trainingFlow, setTrainingFlow] = useState(profile.trainingFlow);
  const [forms, setForms] = useState<string[]>(
    profile.trainingForms.length ? profile.trainingForms : ["Styrketræning"]
  );
  const [cardioShortcut, setCardioShortcut] = useState(profile.cardioShortcut);
  const [matchSwipes, setMatchSwipes] = useState(0);
  const [matchLikes, setMatchLikes] = useState(0);
  const [matchSkips, setMatchSkips] = useState(0);
  const currentStep = onboardingSteps[stepIndex];
  const totalSteps = onboardingSteps.length;
  const progress = ((stepIndex + 1) / totalSteps) * 100;
  const hasEnduranceTraining = forms.some((item) => enduranceTrainingForms.has(item));

  const goToStep = (id: OnboardingStepId) => {
    const nextIndex = onboardingSteps.findIndex((step) => step.id === id);
    if (nextIndex >= 0) setStepIndex(nextIndex);
  };

  const toggleTrainingForm = (item: string) => {
    setForms((current) => {
      if (current.includes(item)) {
        return current.length === 1 ? current : current.filter((value) => value !== item);
      }
      return [...current, item];
    });
    if (enduranceTrainingForms.has(item)) setCardioShortcut(true);
  };

  const finishOnboarding = () => {
    const savedStartMode: UserProfile["onboardingStartMode"] =
      selectedPath === "starter" ? "starter" : "build";
    onUpdateProfile({
      name: name.trim() || profile.name,
      bodyweight: bodyweight.trim() || profile.bodyweight,
      mode: "Personlig",
      trainingForms: forms,
      onboardingStartMode: savedStartMode,
      restTimer,
      trackerLogging,
      trainingFlow,
      cardioShortcut: hasEnduranceTraining ? true : cardioShortcut
    });
    onFinish();
  };

  const primaryLabel =
    currentStep.id === "start"
      ? "Hurtig start"
      : currentStep.id === "starterProgram"
        ? "Opret program"
        : currentStep.id === "programReview"
          ? "Fortsæt til pauser"
          : currentStep.id === "health"
            ? "Videre"
            : currentStep.id === "summary"
              ? "Gå til appen"
              : "Fortsæt";

  const goNext = () => {
    if (currentStep.id === "summary") {
      finishOnboarding();
      return;
    }
    setStepIndex((value) => Math.min(totalSteps - 1, value + 1));
  };

  const swipeMatchDemo = (liked: boolean) => {
    setMatchSwipes((value) => Math.min(5, value + 1));
    if (liked) setMatchLikes((value) => value + 1);
    else setMatchSkips((value) => value + 1);
  };

  const renderStepContent = () => {
    switch (currentStep.id) {
      case "start":
        return (
          <div className="onboarding-step-content">
            <div className="onboarding-status-card compact">
              <span aria-hidden="true">✓</span>
              <div>
                <strong>Start med et aktivt program</strong>
                <p>Du får et klart starterprogram og kan redigere det bagefter.</p>
              </div>
            </div>
            <button
              type="button"
              className="button muted full"
              onClick={() => {
                setSelectedPath("import");
                goToStep("importProgram");
              }}
            >
              Importér eksisterende program
            </button>
            <button
              type="button"
              className="button muted full subtle"
              onClick={() => goToStep("profile")}
            >
              Tilpas setup først
            </button>
          </div>
        );
      case "profile":
        return (
          <div className="onboarding-step-content">
            <Field label="Navn" value={name} onChange={setName} />
            <Field label="Kropsvægt" value={bodyweight} suffix="kg" onChange={setBodyweight} />
          </div>
        );
      case "importProgram":
        return (
          <div className="onboarding-step-content">
            <Textarea
              label="Programtekst"
              value={programText}
              onChange={setProgramText}
            />
            <div className="onboarding-status-card">
              <span aria-hidden="true">⇩</span>
              <div>
                <strong>Redigérbar kladde</strong>
                <p>Importen bruges som startpunkt. Du kan rette dage og øvelser bagefter.</p>
              </div>
            </div>
          </div>
        );
      case "startPath":
        return (
          <div className="onboarding-step-content">
            <OnboardingChoiceRow
              title="Vælg gratis startprogram"
              body="Tag et gennemarbejdet program med videre."
              selected={selectedPath === "starter"}
              onClick={() => setSelectedPath("starter")}
            />
            <OnboardingChoiceRow
              title="Lav programudkast med AI"
              body="Beskriv mål og niveau, og ret udkastet efterfølgende."
              selected={selectedPath === "ai"}
              onClick={() => setSelectedPath("ai")}
            />
            <OnboardingChoiceRow
              title="Udforsk selv"
              body="Start i appen og byg planen manuelt."
              selected={selectedPath === "build"}
              onClick={() => setSelectedPath("build")}
            />
          </div>
        );
      case "starterProgram":
        return (
          <div className="onboarding-step-content">
            {onboardingStartPrograms.map((program) => (
              <OnboardingChoiceRow
                key={program.id}
                title={program.title}
                body={`${program.meta} · ${program.description}`}
                chip={program.chip}
                selected={selectedStarterProgram === program.id}
                onClick={() => {
                  setSelectedPath("starter");
                  setSelectedStarterProgram(program.id);
                }}
              />
            ))}
          </div>
        );
      case "aiDraft":
        return (
          <div className="onboarding-step-content">
            <Textarea
              label="Mål og erfaring"
              value={programText}
              onChange={setProgramText}
            />
            <div className="onboarding-status-card">
              <span aria-hidden="true">✎</span>
              <div>
                <strong>Udkast før appen</strong>
                <p>Udkastet bliver først til et rigtigt program, når du gemmer det i programeditoren.</p>
              </div>
            </div>
          </div>
        );
      case "programReview":
        return (
          <div className="onboarding-step-content">
            <div className="onboarding-status-card">
              <span aria-hidden="true">☑</span>
              <div>
                <strong>
                  {selectedPath === "starter"
                    ? onboardingStartPrograms.find((program) => program.id === selectedStarterProgram)?.title
                    : selectedPath === "ai"
                      ? "AI-programkladde"
                      : selectedPath === "import"
                        ? "Importeret programkladde"
                        : "Manuelt program"}
                </strong>
                <p>Programmer-skærmen åbner med opret, rediger, øvelser og træningsdage.</p>
              </div>
            </div>
            <div className="onboarding-summary-list">
              <OnboardingSummaryRow label="Startvej" value={selectedPath === "starter" ? "Gratis startprogram" : selectedPath === "ai" ? "AI-udkast" : selectedPath === "import" ? "Import" : "Udforsk selv"} />
              <OnboardingSummaryRow label="Tracking" value={trackerLogging ? "Slået til" : "Simpel træning"} />
            </div>
          </div>
        );
      case "restTimer":
        return (
          <div className="onboarding-step-content">
            <OnboardingChoiceRow
              title="Ja, start pausetimer"
              body="Timeren starter automatisk, når et sæt markeres udført."
              selected={restTimer}
              onClick={() => setRestTimer(true)}
            />
            <OnboardingChoiceRow
              title="Nej, hold det manuelt"
              body="Du kan stadig bruge timeren fra træningsskærmen."
              selected={!restTimer}
              onClick={() => setRestTimer(false)}
            />
          </div>
        );
      case "tracking":
        return (
          <div className="onboarding-step-content">
            <OnboardingChoiceRow
              title="Ja, jeg vil tracke"
              body="Gem sæt, vægt, gentagelser, RIR/RPE og historik."
              selected={trackerLogging}
              onClick={() => setTrackerLogging(true)}
            />
            <OnboardingChoiceRow
              title="Hold det simpelt"
              body="Start træninger uden detaljeret sætlogning."
              selected={!trackerLogging}
              onClick={() => setTrackerLogging(false)}
            />
          </div>
        );
      case "trainingForms":
        return (
          <div className="onboarding-training-grid">
            {onboardingTrainingChoices.map((choice) => (
              <OnboardingTrainingTile
                key={choice.title}
                title={choice.title}
                body={choice.body}
                selected={forms.includes(choice.title)}
                onClick={() => toggleTrainingForm(choice.title)}
              />
            ))}
          </div>
        );
      case "flow":
        return (
          <div className="onboarding-step-content">
            <OnboardingChoiceRow
              title="Ja, brug Træningsflow"
              body="Appen foreslår næste træningsdag og holder flowet i gang."
              selected={trainingFlow}
              onClick={() => setTrainingFlow(true)}
            />
            <OnboardingChoiceRow
              title="Nej, jeg vælger selv"
              body="Hjem viser programmet uden automatisk næste-dag flow."
              selected={!trainingFlow}
              onClick={() => setTrainingFlow(false)}
            />
          </div>
        );
      case "health":
        return (
          <div className="onboarding-step-content">
            <Field label="Kropsvægt" value={bodyweight} suffix="kg" onChange={setBodyweight} />
            <div className="onboarding-status-card">
              <span aria-hidden="true">⌁</span>
              <div>
                <strong>Apple Sundhed</strong>
                <p>På iPhone kan Sundhed kobles på efter onboarding. Web gemmer din manuelle kropsvægt.</p>
              </div>
            </div>
          </div>
        );
      case "match":
        return (
          <div className="onboarding-step-content">
            <div className="onboarding-match-demo">
              <div className="onboarding-match-card">
                <span>Match</span>
                <strong>Incline Dumbbell Press</strong>
                <p>Bryst · Mellem · Dumbbells</p>
              </div>
              <div className="onboarding-match-actions">
                <button type="button" onClick={() => swipeMatchDemo(false)} aria-label="Spring over">
                  ×
                </button>
                <button type="button" onClick={() => swipeMatchDemo(true)} aria-label="Gem øvelse">
                  ✓
                </button>
              </div>
            </div>
            <button type="button" className="button primary full" onClick={() => swipeMatchDemo(true)}>
              Start Match
            </button>
            <p className="onboarding-hint">Valgfrit. Swipe 5 kort mere, eller fortsæt nu.</p>
            <div className="onboarding-summary-list compact">
              <OnboardingSummaryRow label="Swipes" value={`${matchSwipes} / 5`} />
              <OnboardingSummaryRow label="Gemte" value={String(matchLikes)} />
              <OnboardingSummaryRow label="Sprunget over" value={String(matchSkips)} />
            </div>
          </div>
        );
      case "summary":
        return (
          <div className="onboarding-step-content">
            <div className="onboarding-status-card success">
              <span aria-hidden="true">✓</span>
              <div>
                <strong>Næste stop: Træning</strong>
                <p>Du lander på hjemmetræningen og kan åbne Programmer, Match, Historik og Indstillinger.</p>
              </div>
            </div>
            <div className="onboarding-summary-list">
              <OnboardingSummaryRow label="Profil" value="Personlig" />
              <OnboardingSummaryRow label="Startvej" value={selectedPath === "starter" ? "Gratis startprogram" : selectedPath === "ai" ? "AI-udkast" : selectedPath === "import" ? "Import" : "Udforsk selv"} />
              <OnboardingSummaryRow label="Match" value={`${matchLikes} gemt · ${matchSkips} skip`} />
              <OnboardingSummaryRow label="Træningsformer" value={forms.join(", ")} />
              <OnboardingSummaryRow label="Abonnement" value="Free" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!introDone) {
    return <OnboardingIntro onStart={() => setIntroDone(true)} />;
  }

  return (
    <div className="onboarding-screen">
      <div className="onboarding-card">
        <OnboardingProgressHeader stepIndex={stepIndex} totalSteps={totalSteps} progress={progress} />
        <OnboardingStepHeader step={currentStep} />
        {renderStepContent()}
        <div className={classNames("onboarding-actions", stepIndex === 0 && "single")}>
          {stepIndex > 0 ? (
            <button
              type="button"
              className="button muted"
              onClick={() => setStepIndex((value) => Math.max(0, value - 1))}
            >
              Tilbage
            </button>
          ) : null}
          <button
            type="button"
            className="button primary"
            onClick={goNext}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function OnboardingIntro({ onStart }: { onStart: () => void }) {
  return (
    <div className="onboarding-screen intro">
      <div className="onboarding-intro">
        <PhoneStatusBar />
        <div className="onboarding-bear" aria-hidden="true">
          <img src="/brand/app-icon-192.png" alt="" />
        </div>
        <div className="onboarding-intro-copy">
          <h1>Velkommen</h1>
          <p>Gør træningen klar.</p>
        </div>
        <button type="button" className="onboarding-intro-hitarea" onClick={onStart} aria-label="Start onboarding" />
      </div>
    </div>
  );
}

function OnboardingProgressHeader({
  stepIndex,
  totalSteps,
  progress
}: {
  stepIndex: number;
  totalSteps: number;
  progress: number;
}) {
  return (
    <header className="onboarding-progress-head">
      <img src="/brand/tm-logo-256.webp" alt="" />
      <h1>Kom i gang</h1>
      <p>
        Trin {stepIndex + 1} af {totalSteps}
      </p>
      <div className="progress-line" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
    </header>
  );
}

function OnboardingStepHeader({ step }: { step: OnboardingStepConfig }) {
  return (
    <section className={classNames("onboarding-step-head", step.tone === "success" && "success")}>
      <div className="onboarding-step-icon" aria-hidden="true">
        {step.icon}
      </div>
      <div>
        <span className="onboarding-step-badge">{step.badge}</span>
        <h2>{step.title}</h2>
        <p>{step.subtitle}</p>
      </div>
    </section>
  );
}

function OnboardingChoiceRow({
  title,
  body,
  selected,
  chip,
  onClick
}: {
  title: string;
  body: string;
  selected: boolean;
  chip?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={classNames("onboarding-choice-row", selected && "selected")}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className="onboarding-choice-check" aria-hidden="true">
        {selected ? "✓" : ""}
      </span>
      <span>
        <strong>{title}</strong>
        <small>{body}</small>
        {chip ? <em>{chip}</em> : null}
      </span>
    </button>
  );
}

function OnboardingTrainingTile({
  title,
  body,
  selected,
  onClick
}: {
  title: string;
  body: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={classNames("onboarding-training-card", selected && "selected")}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className="onboarding-check" aria-hidden="true">
        {selected ? "✓" : ""}
      </span>
      <strong>{title}</strong>
      <small>{body}</small>
    </button>
  );
}

function OnboardingSummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="onboarding-summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ScreenShell({
  className,
  eyebrow,
  title,
  action,
  children
}: {
  className?: string;
  eyebrow: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={classNames("screen-shell", className)}>
      <div className="screen-title">
        <div>
          {eyebrow ? <span>{eyebrow}</span> : null}
          <h1>{title}</h1>
        </div>
      </div>
      {action ? <div className="screen-action">{action}</div> : null}
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  suffix,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  type?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-shell">
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
        {suffix ? <em>{suffix}</em> : null}
      </div>
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  min = 0
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-shell">
        <input
          type="number"
          min={min}
          value={value}
          onChange={(event) => onChange(Number(event.target.value || min))}
        />
        {suffix ? <em>{suffix}</em> : null}
      </div>
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ToggleRow({
  icon,
  label,
  desc,
  checked,
  onChange,
  chip
}: {
  icon?: string;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  chip?: string;
}) {
  return (
    <div className="toggle-row">
      {icon ? (
        <span className="settings-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <div className="toggle-copy">
        <div className="toggle-title">
          <strong>{label}</strong>
          <span aria-hidden="true">i</span>
        </div>
        {chip ? (
          <em className="settings-chip">✓ {chip}</em>
        ) : (
          <p>{desc}</p>
        )}
      </div>
      <button
        className={classNames("switch", checked && "on")}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
      >
        <span />
      </button>
    </div>
  );
}

function FormActions({
  onCancel,
  submitLabel
}: {
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="form-actions">
      <button type="button" className="button muted" onClick={onCancel}>
        Luk
      </button>
      <button type="submit" className="button primary">
        {submitLabel}
      </button>
    </div>
  );
}

function Chip({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" className={classNames("chip", active && "active")} onClick={onClick}>
      {children}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyState({
  title,
  body,
  action,
  onAction
}: {
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <section className="empty-state">
      <div aria-hidden="true">TM</div>
      <h2>{title}</h2>
      <p>{body}</p>
      {action && onAction ? (
        <button className="button primary" onClick={onAction}>
          {action}
        </button>
      ) : null}
    </section>
  );
}

function Choice({
  title,
  body,
  selected,
  onClick
}: {
  title: string;
  body: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <strong>{title}</strong>
      <p>{body}</p>
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        className={classNames("choice", selected && "selected")}
        aria-pressed={selected}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }
  return (
    <div className={classNames("choice", selected && "selected")}>
      {content}
    </div>
  );
}

export default App;
