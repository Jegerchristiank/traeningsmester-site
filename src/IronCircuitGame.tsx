import Phaser from "phaser";
import React, { useEffect, useMemo, useRef, useState } from "react";

type CircuitMode = "daily" | "practice";
type CircuitObjectType = "plate" | "protein" | "hazard" | "gate";

type CircuitHud = {
  score: number;
  best: number;
  combo: number;
  form: number;
  power: number;
  timeLeft: number;
  lane: number;
  status: string;
  running: boolean;
  finished: boolean;
};

type CircuitResult = {
  score: number;
  combo: number;
  power: number;
  form: number;
  seed: string;
  mode: CircuitMode;
  date: string;
};

type CircuitRun = CircuitResult & {
  id: string;
};

type CircuitObject = {
  body: Phaser.GameObjects.Container;
  type: CircuitObjectType;
  lane: number;
  x: number;
  width: number;
  hit: boolean;
  missed: boolean;
};

const gameDurationSeconds = 45;
const worldWidth = 960;
const worldHeight = 540;
const playerX = 168;
const laneYs = [156, 270, 384];
const runHistoryKey = "tm-iron-circuit-runs-v2";

const defaultHud: CircuitHud = {
  score: 0,
  best: 0,
  combo: 0,
  form: 100,
  power: 0,
  timeLeft: gameDurationSeconds,
  lane: 1,
  status: "Klar",
  running: false,
  finished: false
};

type SceneOptions = {
  mode: CircuitMode;
  seed: string;
  sceneKey: string;
  best: number;
  onHud: (hud: CircuitHud) => void;
  onFinish: (result: CircuitResult) => void;
};

export function IronCircuitGame() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [mode, setMode] = useState<CircuitMode>("daily");
  const [runKey, setRunKey] = useState(0);
  const [hud, setHud] = useState<CircuitHud>(defaultHud);
  const [runs, setRuns] = useState<CircuitRun[]>(() => readRuns());
  const todaySeed = useMemo(() => getDailySeed(), []);
  const seed = useMemo(
    () => (mode === "daily" ? todaySeed : `practice-${runKey}-${Date.now()}`),
    [mode, runKey, todaySeed]
  );
  const sceneKey = `iron-circuit-${seed}`;
  const publicSeed = todaySeed.replace("daily-", "");
  const best = getBestForSeed(runs, todaySeed);
  const topRuns = runs.filter((run) => run.seed === todaySeed).slice(0, 5);
  const scoreCode = hud.finished
    ? `TM-${publicSeed}-${hud.score}-${hud.combo}`
    : `TM-${publicSeed}`;

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const scene = new CircuitScene({
      mode,
      seed,
      sceneKey,
      best,
      onHud: setHud,
      onFinish: (result) => {
        const nextRuns = saveRun(result);
        setRuns(nextRuns);
      }
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
  }, [mode, runKey, sceneKey, seed]);

  const restart = (nextMode = mode) => {
    setMode(nextMode);
    setHud({ ...defaultHud, best: getBestForSeed(runs, todaySeed) });
    setRunKey((current) => current + 1);
  };

  const useScene = (action: (scene: CircuitScene) => void) => {
    const scene = gameRef.current?.scene.getScene(sceneKey);
    if (scene instanceof CircuitScene) {
      action(scene);
    }
  };

  const startGame = () => useScene((scene) => scene.startFromUi());
  const moveLane = (direction: -1 | 1) => useScene((scene) => scene.moveFromUi(direction));
  const hitRep = () => useScene((scene) => scene.repFromUi());

  const copyScore = async () => {
    try {
      await navigator.clipboard.writeText(scoreCode);
    } catch {
      // Clipboard can be blocked in some browsers. The score code remains visible.
    }
  };

  return (
    <section className="iron-section section-band dark" id="spil" aria-labelledby="game-title">
      <div className="iron-copy">
        <p className="eyebrow">Iron Circuit</p>
        <h2 id="game-title">45 sekunder. Én bane. Ingen undskyldninger.</h2>
        <p>
          Skift bane, saml plader, ram rep-gates og undgå dårlig form. Dagens
          bane er ens for alle, så scoren kan sammenlignes.
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
              Dagens bane
            </button>
            <button
              className={mode === "practice" ? "is-active" : ""}
              onClick={() => restart("practice")}
              type="button"
            >
              Træningssal
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
              <span>Combo</span>
              <strong>x{Math.max(1, hud.combo)}</strong>
            </p>
            <p>
              <span>Form</span>
              <strong>{Math.round(hud.form)}%</strong>
            </p>
          </div>
        </div>

        <div className="iron-bottom">
          <div className="iron-status">
            <strong>{hud.status}</strong>
            <span>W/S eller piletaster skifter bane. Space rammer REP.</span>
          </div>

          <div className="iron-actions" aria-label="Spilstyring">
            <button type="button" onClick={startGame}>
              Start
            </button>
            <button type="button" onClick={() => moveLane(-1)}>
              Op
            </button>
            <button type="button" onClick={() => moveLane(1)}>
              Ned
            </button>
            <button className="is-primary" type="button" onClick={hitRep}>
              REP
            </button>
          </div>

          <div className="iron-board" aria-label="Dagens score">
            <div>
              <span>Dagens bane</span>
              <strong>{publicSeed}</strong>
            </div>
            <div>
              <span>Bedste her</span>
              <strong>{best}</strong>
            </div>
            <div>
              <span>Scorekode</span>
              <strong>{scoreCode}</strong>
            </div>
            <button type="button" onClick={copyScore}>
              Kopiér kode
            </button>
          </div>

          <div className="iron-runs" aria-label="Lokale daglige resultater">
            {topRuns.length ? (
              topRuns.map((run, index) => (
                <p key={run.id}>
                  <span>{index + 1}</span>
                  <strong>{run.score}</strong>
                  <em>x{Math.max(1, run.combo)}</em>
                </p>
              ))
            ) : (
              <p>
                <span>1</span>
                <strong>Ingen score endnu</strong>
                <em>{scoreCode}</em>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

class CircuitScene extends Phaser.Scene {
  private readonly options: SceneOptions;
  private rng: () => number;
  private player!: Phaser.GameObjects.Container;
  private playerAura!: Phaser.GameObjects.Arc;
  private objects: CircuitObject[] = [];
  private lane = 1;
  private score = 0;
  private combo = 0;
  private form = 100;
  private power = 0;
  private elapsed = 0;
  private spawnAt = 0;
  private running = false;
  private finished = false;
  private lastHudAt = 0;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: Record<string, Phaser.Input.Keyboard.Key>;
  private swipeStartY: number | null = null;
  private status = "Klar";

  constructor(options: SceneOptions) {
    super(options.sceneKey);
    this.options = options;
    this.rng = mulberry32(hashSeed(options.seed));
  }

  create() {
    this.drawWorld();
    this.player = this.createPlayer();
    this.playerAura = this.add.circle(playerX, laneYs[this.lane], 38, 0xe31836, 0.1);
    this.playerAura.setStrokeStyle(2, 0xe31836, 0.45);
    this.player.setDepth(3);
    this.playerAura.setDepth(2);

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.keys = this.input.keyboard?.addKeys("W,S,SPACE") as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.startRun();
      this.swipeStartY = pointer.y;
      if (pointer.x > worldWidth * 0.74) {
        this.tryRepGate();
        return;
      }

      this.moveToNearestLane(pointer.y);
    });
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (this.swipeStartY === null) return;

      const delta = pointer.y - this.swipeStartY;
      if (Math.abs(delta) > 42) {
        this.moveLane(delta > 0 ? 1 : -1);
      }
      this.swipeStartY = null;
    });

    this.emitHud();
  }

  public startFromUi() {
    this.startRun();
  }

  public moveFromUi(direction: -1 | 1) {
    this.startRun();
    this.moveLane(direction);
  }

  public repFromUi() {
    this.startRun();
    this.tryRepGate();
  }

  update(_: number, delta: number) {
    const deltaSeconds = Math.min(delta / 1000, 0.05);
    this.handleKeyboard();

    if (!this.running || this.finished) {
      this.emitHud();
      return;
    }

    this.elapsed += deltaSeconds;
    this.spawnAt -= deltaSeconds;
    if (this.spawnAt <= 0) {
      this.spawnObject();
      this.spawnAt = Math.max(0.42, 0.92 - this.elapsed / 92 + this.rng() * 0.28);
    }

    const speed = 258 + this.elapsed * 6 + this.combo * 2.2;
    this.objects.forEach((object) => {
      object.x -= speed * deltaSeconds;
      object.body.setX(object.x);
      this.resolveObject(object);
    });
    this.objects = this.objects.filter((object) => {
      if (object.x > -120 && !object.hit) return true;
      object.body.destroy();
      return false;
    });

    this.power = clamp(this.power - deltaSeconds * 1.6, 0, 100);
    if (this.elapsed >= gameDurationSeconds || this.form <= 0) {
      this.finishRun();
    }

    if (this.time.now - this.lastHudAt > 90) {
      this.emitHud();
    }
  }

  private drawWorld() {
    this.add.rectangle(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 0x091016);
    for (let i = 0; i < 13; i += 1) {
      this.add.line(0, 0, i * 80, 0, i * 80 - 190, worldHeight, 0x1a2431, 0.45).setOrigin(0);
    }

    laneYs.forEach((laneY) => {
      this.add.rectangle(worldWidth / 2, laneY, worldWidth, 78, 0x101821, 0.72);
      this.add.line(0, 0, 0, laneY + 40, worldWidth, laneY + 40, 0xf3f6fc, 0.08).setOrigin(0);
    });

    this.add.rectangle(72, worldHeight / 2, 6, worldHeight - 92, 0xe31836, 0.65);
    this.add.text(34, 34, "IRON CIRCUIT", {
      color: "#e31836",
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "18px",
      fontStyle: "900"
    });
  }

  private createPlayer() {
    const body = this.add.container(playerX, laneYs[this.lane]);
    const shadow = this.add.ellipse(0, 40, 92, 20, 0x000000, 0.36);
    const legs = this.add.rectangle(0, 22, 54, 56, 0x10203a).setStrokeStyle(2, 0x315c9f, 0.7);
    const torso = this.add.rectangle(0, -14, 72, 68, 0x141a24).setStrokeStyle(3, 0xe31836, 0.8);
    const neck = this.add.rectangle(0, -47, 18, 18, 0x9b6842);
    const head = this.add.circle(0, -72, 24, 0xb97852).setStrokeStyle(3, 0xe0a36c, 0.55);
    const hair = this.add.rectangle(0, -94, 38, 11, 0x111319);
    const brow = this.add.rectangle(0, -78, 32, 5, 0x111319, 0.72);
    const shoulders = this.add.rectangle(0, -36, 86, 16, 0x202938).setStrokeStyle(2, 0xf3f6fc, 0.16);
    const bar = this.add.rectangle(0, -16, 116, 8, 0xf3f6fc);
    const leftPlate = this.add.rectangle(-68, -16, 24, 42, 0x05070a).setStrokeStyle(2, 0xf3f6fc, 0.24);
    const rightPlate = this.add.rectangle(68, -16, 24, 42, 0x05070a).setStrokeStyle(2, 0xf3f6fc, 0.24);

    body.add([shadow, legs, torso, neck, shoulders, head, hair, brow, bar, leftPlate, rightPlate]);
    return body;
  }

  private handleKeyboard() {
    if (!this.cursors || !this.keys) return;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up!) || Phaser.Input.Keyboard.JustDown(this.keys.W)) {
      this.startRun();
      this.moveLane(-1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.down!) || Phaser.Input.Keyboard.JustDown(this.keys.S)) {
      this.startRun();
      this.moveLane(1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.space!) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.startRun();
      this.tryRepGate();
    }
  }

  private startRun() {
    if (this.running || this.finished) return;
    this.running = true;
    this.status = "I gang";
    this.emitHud();
  }

  private moveLane(direction: number) {
    this.lane = clamp(this.lane + direction, 0, laneYs.length - 1);
    this.tweens.killTweensOf(this.player);
    this.tweens.killTweensOf(this.playerAura);
    this.tweens.add({
      targets: [this.player, this.playerAura],
      y: laneYs[this.lane],
      duration: 115,
      ease: "Sine.easeOut"
    });
  }

  private moveToNearestLane(y: number) {
    const nearestLane = laneYs.reduce((best, laneY, index) => {
      return Math.abs(laneY - y) < Math.abs(laneYs[best] - y) ? index : best;
    }, this.lane);
    this.moveLane(nearestLane - this.lane);
  }

  private spawnObject() {
    const lane = Math.floor(this.rng() * laneYs.length);
    const roll = this.rng();
    const type: CircuitObjectType =
      roll > 0.78 ? "gate" : roll > 0.58 ? "hazard" : roll > 0.34 ? "protein" : "plate";
    const object = this.createObject(type, lane);
    this.objects.push(object);
  }

  private createObject(type: CircuitObjectType, lane: number): CircuitObject {
    const body = this.add.container(worldWidth + 90, laneYs[lane]);
    body.setDepth(type === "gate" ? 1 : 2);

    if (type === "plate") {
      body.add(this.add.circle(0, 0, 24, 0x0047ab).setStrokeStyle(5, 0xf3f6fc, 0.35));
      body.add(this.add.circle(0, 0, 8, 0x091016));
    } else if (type === "protein") {
      body.add(this.add.rectangle(0, 0, 42, 54, 0x4f6257).setStrokeStyle(3, 0xf3f6fc, 0.3));
      body.add(this.add.text(-12, -11, "+", { color: "#f3f6fc", fontSize: "24px", fontStyle: "900" }));
    } else if (type === "hazard") {
      body.add(this.add.triangle(0, 4, 0, -30, 34, 30, -34, 30, 0xe31836, 0.86));
      body.add(this.add.text(-6, -10, "!", { color: "#f3f6fc", fontSize: "24px", fontStyle: "900" }));
    } else {
      body.add(this.add.rectangle(0, 0, 34, 102, 0xf3f6fc, 0.16));
      body.add(this.add.rectangle(0, 0, 92, 32, 0xf3f6fc, 0.82));
      body.add(this.add.text(-22, -8, "REP", { color: "#101319", fontSize: "14px", fontStyle: "900" }));
    }

    return {
      body,
      type,
      lane,
      x: worldWidth + 90,
      width: type === "gate" ? 98 : 56,
      hit: false,
      missed: false
    };
  }

  private resolveObject(object: CircuitObject) {
    if (object.lane !== this.lane || object.hit) {
      if (object.type === "gate" && !object.missed && object.x < playerX - 70) {
        object.missed = true;
        this.combo = 0;
        this.form = clamp(this.form - 6, 0, 100);
        this.status = "REP missede";
      }
      return;
    }

    const distance = Math.abs(object.x - playerX);
    if (object.type === "gate") return;
    if (distance > object.width) return;

    object.hit = true;
    if (object.type === "plate") {
      this.combo += 1;
      this.power = clamp(this.power + 8, 0, 100);
      this.score += this.scoreValue(170);
      this.status = "Plade samlet";
      this.bumpPlayer(0x0047ab);
    } else if (object.type === "protein") {
      this.combo += 1;
      this.form = clamp(this.form + 10, 0, 100);
      this.score += this.scoreValue(110);
      this.status = "Form op";
      this.bumpPlayer(0x4f6257);
    } else {
      this.combo = 0;
      this.form = clamp(this.form - 18, 0, 100);
      this.score = Math.max(0, this.score - 120);
      this.status = "Dårlig form";
      this.cameras.main.shake(95, 0.007);
      this.bumpPlayer(0xe31836);
    }
  }

  private tryRepGate() {
    if (this.finished) return;

    const gate = this.objects
      .filter((object) => object.type === "gate" && object.lane === this.lane && !object.hit)
      .sort((a, b) => Math.abs(a.x - playerX) - Math.abs(b.x - playerX))[0];

    if (!gate || Math.abs(gate.x - playerX) > 92) {
      this.combo = Math.max(0, this.combo - 1);
      this.status = "For tidligt";
      return;
    }

    const distance = Math.abs(gate.x - playerX);
    gate.hit = true;
    this.combo += distance < 34 ? 3 : 1;
    this.power = clamp(this.power + (distance < 34 ? 18 : 10), 0, 100);
    this.form = clamp(this.form + 4, 0, 100);
    this.score += this.scoreValue(distance < 34 ? 620 : 360);
    this.status = distance < 34 ? "Perfekt REP" : "REP";
    this.bumpPlayer(0xf3f6fc);
  }

  private scoreValue(base: number) {
    return Math.round(base * Math.min(3.2, 1 + this.combo * 0.11));
  }

  private bumpPlayer(color: number) {
    this.playerAura.setFillStyle(color, 0.22);
    this.tweens.add({
      targets: this.playerAura,
      alpha: 0.05,
      scale: 1.28,
      duration: 120,
      yoyo: true,
      ease: "Sine.easeOut"
    });
  }

  private finishRun() {
    if (this.finished) return;

    this.finished = true;
    this.running = false;
    this.status = this.form <= 0 ? "Formen røg" : "Tid slut";
    this.options.onFinish({
      score: this.score,
      combo: this.combo,
      power: Math.round(this.power),
      form: Math.round(this.form),
      seed: this.options.seed,
      mode: this.options.mode,
      date: getTodayStamp()
    });
    this.emitHud();
  }

  private emitHud() {
    this.lastHudAt = this.time.now;
    this.options.onHud({
      score: this.score,
      best: this.options.best,
      combo: this.combo,
      form: this.form,
      power: this.power,
      timeLeft: Math.max(0, Math.ceil(gameDurationSeconds - this.elapsed)),
      lane: this.lane,
      status: this.status,
      running: this.running,
      finished: this.finished
    });
  }
}

function readRuns() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(runHistoryKey) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((run): run is CircuitRun => typeof run?.score === "number" && typeof run?.seed === "string")
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  } catch {
    return [];
  }
}

function saveRun(result: CircuitResult) {
  const runs = readRuns();
  const nextRuns = [
    {
      ...result,
      id: `${result.seed}-${result.score}-${Date.now()}`
    },
    ...runs
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  try {
    window.localStorage.setItem(runHistoryKey, JSON.stringify(nextRuns));
  } catch {
    // Local leaderboard is optional.
  }
  return nextRuns;
}

function getBestForSeed(runs: CircuitRun[], seed: string) {
  const bestRun = runs.find((run) => run.seed === seed);
  return bestRun?.score ?? 0;
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
