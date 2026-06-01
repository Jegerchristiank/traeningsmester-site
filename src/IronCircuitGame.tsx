import Phaser from "phaser";
import React, { useEffect, useMemo, useRef, useState } from "react";

type SessionMode = "daily" | "free";

type SessionHud = {
  score: number;
  setsDone: number;
  totalSets: number;
  focus: number;
  timeLeft: number;
  status: string;
  currentExercise: string;
  currentPrescription: string;
  running: boolean;
  finished: boolean;
};

type WorkoutSet = {
  exercise: string;
  reps: string;
  weight: string;
};

type PrecisionResult = "perfect" | "good" | "miss";

const worldWidth = 960;
const worldHeight = 540;
const gameDurationSeconds = 55;
const totalSets = 6;
const markerMinX = 312;
const markerMaxX = 812;
const markerY = 298;
const perfectCenterX = 562;
const perfectWidth = 154;
const goodWidth = 310;

const defaultHud: SessionHud = {
  score: 0,
  setsDone: 0,
  totalSets,
  focus: 100,
  timeLeft: gameDurationSeconds,
  status: "Klar",
  currentExercise: "Benpres",
  currentPrescription: "8 reps · 80 kg",
  running: false,
  finished: false
};

type SceneOptions = {
  seed: string;
  sceneKey: string;
  workout: WorkoutSet[];
  onHud: (hud: SessionHud) => void;
};

export function IronCircuitGame() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [mode, setMode] = useState<SessionMode>("daily");
  const [runKey, setRunKey] = useState(0);
  const [hud, setHud] = useState<SessionHud>(defaultHud);
  const todaySeed = useMemo(() => getDailySeed(), []);
  const seed = useMemo(
    () => (mode === "daily" ? todaySeed : `fri-${runKey}-${Date.now()}`),
    [mode, runKey, todaySeed]
  );
  const workout = useMemo(() => createWorkout(seed), [seed]);
  const sceneKey = `dagens-pas-${seed}`;

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const scene = new DagensPasScene({
      seed,
      sceneKey,
      workout,
      onHud: setHud
    });

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: worldWidth,
      height: worldHeight,
      backgroundColor: "#091016",
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      render: {
        antialias: true,
        pixelArt: false
      },
      scene
    });

    gameRef.current = game;
    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, [mode, runKey, sceneKey, seed, workout]);

  const restart = (nextMode = mode) => {
    setMode(nextMode);
    setHud(defaultHud);
    setRunKey((current) => current + 1);
  };

  const useScene = (action: (scene: DagensPasScene) => void) => {
    const scene = gameRef.current?.scene.getScene(sceneKey);
    if (scene instanceof DagensPasScene) {
      action(scene);
    }
  };

  const startGame = () => useScene((scene) => scene.startFromUi());
  const logSet = () => useScene((scene) => scene.logFromUi());

  return (
    <section className="iron-section section-band dark" id="spil" aria-labelledby="game-title">
      <div className="iron-copy">
        <p className="eyebrow">Dagens pas</p>
        <h2 id="game-title">Log seks sæt uden at miste rytmen.</h2>
        <p>
          Det er træningsflowet som spil: se næste sæt, ram det grønne felt,
          log hurtigt og gå videre.
        </p>
      </div>

      <div className="iron-shell">
        <div className="iron-toolbar" aria-label="Spilvalg">
          <div>
            <button
              className={mode === "daily" ? "is-active" : ""}
              onClick={() => restart("daily")}
              type="button"
            >
              Dagens pas
            </button>
            <button
              className={mode === "free" ? "is-active" : ""}
              onClick={() => restart("free")}
              type="button"
            >
              Fri runde
            </button>
          </div>
          <button type="button" onClick={() => restart(mode)}>
            Ny runde
          </button>
        </div>

        <div className="iron-game-wrap">
          <div className="iron-canvas" ref={containerRef} />
          <div className="iron-hud" aria-label="Spilstatus">
            <p>
              <span>Score</span>
              <strong>{hud.score}</strong>
            </p>
            <p>
              <span>Tid</span>
              <strong>{hud.timeLeft}s</strong>
            </p>
            <p>
              <span>Sæt</span>
              <strong>
                {hud.setsDone}/{hud.totalSets}
              </strong>
            </p>
            <p>
              <span>Fokus</span>
              <strong>{Math.round(hud.focus)}%</strong>
            </p>
          </div>
        </div>

        <div className="iron-bottom">
          <div className="iron-status">
            <strong>{hud.status}</strong>
            <span>
              Næste: {hud.currentExercise} · {hud.currentPrescription}
            </span>
            <span>Tryk LOG SÆT når markøren rammer det grønne felt.</span>
          </div>

          <div className="iron-actions two-actions" aria-label="Spilstyring">
            <button type="button" onClick={startGame}>
              Start
            </button>
            <button className="is-primary" type="button" onClick={logSet}>
              Log sæt
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

class DagensPasScene extends Phaser.Scene {
  private readonly options: SceneOptions;
  private marker!: Phaser.GameObjects.Rectangle;
  private workoutRows: Phaser.GameObjects.Container[] = [];
  private setDots: Phaser.GameObjects.Arc[] = [];
  private statusText!: Phaser.GameObjects.Text;
  private exerciseText!: Phaser.GameObjects.Text;
  private prescriptionText!: Phaser.GameObjects.Text;
  private score = 0;
  private focus = 100;
  private setsDone = 0;
  private elapsed = 0;
  private markerProgress = 0;
  private markerDirection = 1;
  private speed = 0.43;
  private running = false;
  private finished = false;
  private lastHudAt = 0;
  private spaceKey?: Phaser.Input.Keyboard.Key;

  constructor(options: SceneOptions) {
    super(options.sceneKey);
    this.options = options;
  }

  create() {
    this.drawWorld();
    this.spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.on("pointerdown", () => {
      if (!this.running) {
        this.startRun();
        return;
      }
      this.tryLogSet();
    });
    this.emitHud();
  }

  update(_: number, delta: number) {
    const deltaSeconds = Math.min(delta / 1000, 0.05);

    if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      if (!this.running) {
        this.startRun();
      } else {
        this.tryLogSet();
      }
    }

    if (!this.running || this.finished) {
      this.emitHud();
      return;
    }

    this.elapsed += deltaSeconds;
    this.markerProgress += deltaSeconds * this.speed * this.markerDirection;
    if (this.markerProgress >= 1) {
      this.markerProgress = 1;
      this.markerDirection = -1;
      this.missSet("For sent");
    } else if (this.markerProgress <= 0) {
      this.markerProgress = 0;
      this.markerDirection = 1;
    }

    const markerX = Phaser.Math.Linear(markerMinX, markerMaxX, this.markerProgress);
    this.marker.setX(markerX);

    if (this.elapsed >= gameDurationSeconds || this.focus <= 0) {
      this.finishRun();
    }

    if (this.time.now - this.lastHudAt > 90) {
      this.emitHud();
    }
  }

  public startFromUi() {
    this.startRun();
  }

  public logFromUi() {
    if (!this.running) {
      this.startRun();
      return;
    }
    this.tryLogSet();
  }

  private drawWorld() {
    this.add.rectangle(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 0x091016);
    this.add.rectangle(206, worldHeight / 2, 286, worldHeight - 74, 0x0d131b, 0.94);
    this.add.rectangle(606, worldHeight / 2, 644, worldHeight - 74, 0x111923, 0.88);

    for (let i = 0; i < 9; i += 1) {
      this.add.line(0, 0, 286 + i * 84, 72, 244 + i * 84, 468, 0xf3f6fc, 0.045).setOrigin(0);
    }

    this.add.text(72, 56, "DAGENS PAS", textStyle(18, "#e31836", 900));
    this.add.text(72, 88, "Seks sæt. Samme pas for alle.", textStyle(14, "#ccd6e7", 650));

    this.options.workout.forEach((set, index) => {
      const row = this.add.container(70, 140 + index * 56);
      const box = this.add.rectangle(106, 0, 212, 42, index === 0 ? 0x202938 : 0x131c27, 0.9);
      box.setStrokeStyle(1, index === 0 ? 0xe31836 : 0xf3f6fc, index === 0 ? 0.7 : 0.12);
      const dot = this.add.circle(10, 0, 11, 0x0b0f14).setStrokeStyle(2, 0xf3f6fc, 0.3);
      const exercise = this.add.text(30, -14, set.exercise, textStyle(15, "#f3f6fc", 850));
      const meta = this.add.text(30, 4, `${set.reps} · ${set.weight}`, textStyle(12, "#ccd6e7", 650));
      row.add([box, dot, exercise, meta]);
      this.workoutRows.push(row);
      this.setDots.push(dot);
    });

    this.add.rectangle(612, 112, 538, 72, 0x0b0f14, 0.72).setStrokeStyle(1, 0xf3f6fc, 0.12);
    this.add.text(360, 82, "Næste sæt", textStyle(13, "#ccd6e7", 800));
    this.exerciseText = this.add.text(360, 106, "", textStyle(30, "#f3f6fc", 900));
    this.prescriptionText = this.add.text(360, 144, "", textStyle(16, "#ccd6e7", 720));

    this.add.text(360, 214, "Tryk når markøren rammer KLAR", textStyle(17, "#f3f6fc", 850));
    this.add.rectangle(562, markerY, goodWidth, 78, 0x243244, 0.84);
    this.add.rectangle(562, markerY, perfectWidth, 78, 0x4f6257, 0.96);
    this.add.rectangle(392, markerY, 160, 78, 0x2a1720, 0.8);
    this.add.rectangle(732, markerY, 160, 78, 0x2a2117, 0.8);
    this.add.text(338, markerY - 11, "FOR TIDLIGT", textStyle(12, "#ccd6e7", 850));
    this.add.text(532, markerY - 13, "KLAR", textStyle(18, "#f3f6fc", 950));
    this.add.text(694, markerY - 11, "FOR SENT", textStyle(12, "#ccd6e7", 850));

    this.add.rectangle(562, markerY, markerMaxX - markerMinX, 3, 0xf3f6fc, 0.34);
    this.marker = this.add.rectangle(markerMinX, markerY, 12, 116, 0xe31836, 0.96);
    this.marker.setStrokeStyle(2, 0xf3f6fc, 0.44);

    this.statusText = this.add.text(360, 382, "Start når du er klar.", textStyle(24, "#f3f6fc", 900));
    this.add.text(360, 424, "Space eller klik i spillet virker også.", textStyle(15, "#ccd6e7", 680));

    this.updateActiveSet();
  }

  private startRun() {
    if (this.running || this.finished) return;
    this.running = true;
    this.statusText.setText("Find rytmen.");
    this.options.onHud({
      ...defaultHud,
      currentExercise: this.options.workout[0].exercise,
      currentPrescription: `${this.options.workout[0].reps} · ${this.options.workout[0].weight}`,
      running: true,
      status: "Find rytmen"
    });
  }

  private tryLogSet() {
    if (this.finished || this.setsDone >= totalSets) return;

    const x = Phaser.Math.Linear(markerMinX, markerMaxX, this.markerProgress);
    const distance = Math.abs(x - perfectCenterX);
    const precision: PrecisionResult =
      distance <= perfectWidth / 2 ? "perfect" : distance <= goodWidth / 2 ? "good" : "miss";

    if (precision === "miss") {
      this.missSet(x < perfectCenterX ? "For tidligt" : "For sent");
      return;
    }

    const base = precision === "perfect" ? 860 : 520;
    const streakBonus = this.setsDone * (precision === "perfect" ? 70 : 38);
    const focusBonus = Math.round(this.focus * 1.8);
    this.score += base + streakBonus + focusBonus;
    this.focus = clamp(this.focus + (precision === "perfect" ? 3 : 1), 0, 100);
    this.statusText.setText(precision === "perfect" ? "Rent logget." : "Godkendt.");
    this.flashMarker(precision === "perfect" ? 0x4f6257 : 0x0047ab);
    this.completeSet();
  }

  private missSet(reason: string) {
    if (this.finished || this.setsDone >= totalSets) return;
    this.focus = clamp(this.focus - 14, 0, 100);
    this.score = Math.max(0, this.score - 110);
    this.statusText.setText(reason);
    this.flashMarker(0xe31836);
    this.resetMarker();
    if (this.focus <= 0) {
      this.finishRun();
    }
    this.emitHud();
  }

  private completeSet() {
    this.setDots[this.setsDone]?.setFillStyle(0xe31836, 1);
    this.setDots[this.setsDone]?.setStrokeStyle(2, 0xf3f6fc, 0.44);
    this.workoutRows[this.setsDone]?.setAlpha(0.72);
    this.setsDone += 1;
    this.speed = Math.min(0.86, this.speed + 0.055);
    this.resetMarker();

    if (this.setsDone >= totalSets) {
      this.score += Math.max(0, Math.round((gameDurationSeconds - this.elapsed) * 42));
      this.finishRun();
      return;
    }

    this.updateActiveSet();
    this.emitHud();
  }

  private updateActiveSet() {
    const activeSet = this.options.workout[this.setsDone] ?? this.options.workout[totalSets - 1];
    this.exerciseText.setText(activeSet.exercise);
    this.prescriptionText.setText(`${activeSet.reps} · ${activeSet.weight}`);

    this.workoutRows.forEach((row, index) => {
      const box = row.list[0] as Phaser.GameObjects.Rectangle;
      const isActive = index === this.setsDone;
      box.setFillStyle(isActive ? 0x202938 : 0x131c27, isActive ? 0.95 : 0.78);
      box.setStrokeStyle(1, isActive ? 0xe31836 : 0xf3f6fc, isActive ? 0.75 : 0.1);
      row.setAlpha(index < this.setsDone ? 0.7 : 1);
    });
  }

  private resetMarker() {
    this.markerProgress = 0;
    this.markerDirection = 1;
    this.marker.setX(markerMinX);
  }

  private flashMarker(color: number) {
    this.marker.setFillStyle(color, 1);
    this.tweens.add({
      targets: this.marker,
      scaleY: 1.14,
      duration: 90,
      yoyo: true,
      onComplete: () => this.marker.setFillStyle(0xe31836, 0.96)
    });
  }

  private finishRun() {
    if (this.finished) return;
    this.finished = true;
    this.running = false;
    const status = this.setsDone >= totalSets ? "Pas gennemført" : "Rytmen røg";
    this.statusText.setText(status);
    this.emitHud(status);
  }

  private emitHud(status = this.statusText?.text ?? "Klar") {
    this.lastHudAt = this.time.now;
    const activeSet = this.options.workout[this.setsDone] ?? this.options.workout[totalSets - 1];
    this.options.onHud({
      score: this.score,
      setsDone: this.setsDone,
      totalSets,
      focus: this.focus,
      timeLeft: Math.max(0, Math.ceil(gameDurationSeconds - this.elapsed)),
      status,
      currentExercise: activeSet.exercise,
      currentPrescription: `${activeSet.reps} · ${activeSet.weight}`,
      running: this.running,
      finished: this.finished
    });
  }
}

function createWorkout(seed: string): WorkoutSet[] {
  const rng = mulberry32(hashSeed(seed));
  const exercises = [
    ["Benpres", "8 reps", "80 kg"],
    ["Roning", "10 reps", "45 kg"],
    ["Brystpres", "8 reps", "50 kg"],
    ["Skulderpres", "10 reps", "24 kg"],
    ["Split squat", "8 reps", "18 kg"],
    ["Pulldown", "10 reps", "55 kg"],
    ["Hip thrust", "8 reps", "90 kg"],
    ["Cable row", "10 reps", "42 kg"]
  ];

  const shuffled = [...exercises].sort(() => rng() - 0.5).slice(0, 3);
  return shuffled.flatMap(([exercise, reps, weight]) => [
    { exercise, reps, weight },
    { exercise, reps, weight }
  ]);
}

function getTodayStamp() {
  return new Date().toISOString().slice(0, 10).replaceAll("-", "");
}

function getDailySeed() {
  return `daily-${getTodayStamp()}`;
}

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function textStyle(size: number, color: string, weight: number) {
  return {
    color,
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: `${size}px`,
    fontStyle: weight >= 850 ? "900" : "normal"
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
