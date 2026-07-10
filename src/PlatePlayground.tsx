import React, { useEffect, useRef, useState } from "react";
import * as Matter from "matter-js";

const BEST_KEY = "tm-stack-best";

type Status = "ready" | "playing" | "over";
type Piece = Matter.Body & { plateW?: number; perfect?: boolean; isBase?: boolean };

type GameApi = {
  start: () => void;
  drop: () => void;
};

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/**
 * "Stabl stangen" — a one-tap timing + physics arcade game.
 * A plate swings across the top; tap to drop it straight down onto the bar.
 * Land it on the stack to score, nail the centre for perfect combos, and the
 * tower scrolls as it grows. Miss the stack and real physics tips it off — game over.
 * Built with Matter.js.
 */
export default function PlatePlayground() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<GameApi | null>(null);

  const [status, setStatus] = useState<Status>("ready");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const [perfect, setPerfect] = useState(false);

  const statusRef = useRef<Status>("ready");
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const bestRef = useRef(0);
  const perfectTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    try {
      const v = Number(window.localStorage?.getItem(BEST_KEY) || 0);
      if (v > 0) {
        setBest(v);
        bestRef.current = v;
      }
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let cleanup = () => {};
    try {
      let w = wrap.clientWidth || 800;
      let h = wrap.clientHeight || 460;

      const PLATE_H = 32;
      const plateWidth = () => Math.max(94, Math.min(150, w * 0.2));
      const BASE_TALL = 260;
      const DROP_Y = 74;
      const TIP_LINE = 210;

      const engine = Matter.Engine.create();
      engine.gravity.y = 1;
      const world = engine.world;

      const render = Matter.Render.create({
        element: wrap,
        engine,
        options: {
          width: w,
          height: h,
          background: "transparent",
          wireframes: false,
          pixelRatio: Math.min(2, window.devicePixelRatio || 1)
        }
      });
      render.canvas.style.cursor = "pointer";

      const pieces: Piece[] = [];
      let active: Piece | null = null;
      let pending: Piece | null = null;
      let towerX = w / 2;
      let towerTopY = h - 90;
      let landOnX = w / 2;
      let dropTime = 0;
      let flashUntil = 0;
      let swingPhase = 0;

      const makeBase = (): Piece => {
        const bw = plateWidth() * 2.3;
        const body = Matter.Bodies.rectangle(w / 2, TIP_LINE + BASE_TALL / 2, bw, BASE_TALL, {
          isStatic: true,
          friction: 1,
          render: { visible: false }
        }) as Piece;
        body.plateW = bw;
        body.isBase = true;
        return body;
      };

      const spawnActive = () => {
        const pw = plateWidth();
        const body = Matter.Bodies.rectangle(w / 2, DROP_Y, pw, PLATE_H, {
          chamfer: { radius: 6 },
          friction: 0.95,
          frictionStatic: 1.2,
          restitution: 0,
          density: 0.02,
          render: { visible: false }
        }) as Piece;
        body.plateW = pw;
        Matter.Composite.add(world, body);
        active = body;
        swingPhase = performance.now();
      };

      const triggerPerfect = () => {
        flashUntil = performance.now() + 620;
        setPerfect(true);
        window.clearTimeout(perfectTimer.current);
        perfectTimer.current = window.setTimeout(() => setPerfect(false), 680);
      };

      const gameOver = () => {
        if (statusRef.current !== "playing") return;
        statusRef.current = "over";
        setStatus("over");
        active = null;
        pending = null;
      };

      const evaluate = () => {
        const p = pending;
        pending = null;
        if (!p) return;
        const angle = Math.abs(((p.angle + Math.PI) % (Math.PI * 2)) - Math.PI);
        const restedOnTower = p.position.y < towerTopY + PLATE_H * 0.7;
        if (!restedOnTower || angle > 0.55 || p.position.y > h - 28) {
          gameOver();
          return;
        }
        Matter.Body.setStatic(p, true);
        pieces.push(p);
        towerTopY = p.position.y - PLATE_H / 2;
        towerX = p.position.x;

        const off = Math.abs(p.position.x - landOnX);
        const pw = p.plateW ?? plateWidth();
        if (off < 13) {
          comboRef.current += 1;
          scoreRef.current += 10 + comboRef.current * 2;
          p.perfect = true;
          triggerPerfect();
        } else if (off < pw * 0.62) {
          comboRef.current = 0;
          scoreRef.current += 4;
        } else {
          comboRef.current = 0;
          scoreRef.current += 2;
        }
        setScore(scoreRef.current);
        setCombo(comboRef.current);
        if (scoreRef.current > bestRef.current) {
          bestRef.current = scoreRef.current;
          setBest(bestRef.current);
          try {
            window.localStorage?.setItem(BEST_KEY, String(bestRef.current));
          } catch {
            /* noop */
          }
        }

        // camera follow — keep the tip near a fixed line
        if (towerTopY < TIP_LINE) {
          const shift = TIP_LINE - towerTopY;
          pieces.forEach((b) => Matter.Body.translate(b, { x: 0, y: shift }));
          towerTopY += shift;
          for (let i = pieces.length - 1; i >= 0; i--) {
            if (pieces[i].position.y - (pieces[i].isBase ? BASE_TALL / 2 : PLATE_H / 2) > h + 20) {
              Matter.Composite.remove(world, pieces[i]);
              pieces.splice(i, 1);
            }
          }
        }
        spawnActive();
      };

      const drop = () => {
        if (statusRef.current !== "playing" || !active || pending) return;
        const dropped = active;
        active = null;
        landOnX = towerX;
        Matter.Body.setVelocity(dropped, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(dropped, 0);
        pending = dropped;
        dropTime = performance.now();
      };

      const start = () => {
        Matter.Composite.clear(world, false);
        pieces.length = 0;
        active = null;
        pending = null;
        const base = makeBase();
        Matter.Composite.add(world, base);
        pieces.push(base);
        towerX = base.position.x;
        towerTopY = base.position.y - BASE_TALL / 2;
        landOnX = towerX;
        scoreRef.current = 0;
        comboRef.current = 0;
        setScore(0);
        setCombo(0);
        setPerfect(false);
        statusRef.current = "playing";
        setStatus("playing");
        spawnActive();
      };

      apiRef.current = { start, drop };

      Matter.Events.on(engine, "beforeUpdate", () => {
        if (statusRef.current !== "playing" || !active) return;
        const t = performance.now();
        const speed = 0.0013 + Math.min(0.0036, scoreRef.current * 0.00007);
        const pw = active.plateW ?? 120;
        const amp = Math.min(w / 2 - pw / 2 - 12, pw * 1.7);
        const x = w / 2 + Math.sin((t - swingPhase) * speed) * amp;
        // hold the live plate kinematically (it is a dynamic body we pin each frame)
        Matter.Body.setPosition(active, { x, y: DROP_Y });
        Matter.Body.setAngle(active, 0);
        Matter.Body.setVelocity(active, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(active, 0);
      });

      Matter.Events.on(engine, "afterUpdate", () => {
        if (!pending) return;
        if (pending.position.y > h + 60) {
          gameOver();
          return;
        }
        const v = Math.hypot(pending.velocity.x, pending.velocity.y);
        const settled = v < 0.4 && Math.abs(pending.angularVelocity) < 0.04;
        const elapsed = performance.now() - dropTime;
        if (elapsed > 280 && (settled || elapsed > 1800)) evaluate();
      });

      Matter.Events.on(render, "afterRender", () => {
        const ctx = render.context;
        const now = performance.now();
        const flashing = now < flashUntil;

        const drawPiece = (b: Piece) => {
          const pw = b.plateW ?? 120;
          if (b.isBase) {
            // draw a slim platform at the top surface of the tall (collision-safe) base body
            const topY = b.position.y - BASE_TALL / 2;
            ctx.save();
            ctx.translate(b.position.x, topY);
            roundRectPath(ctx, -pw / 2, 0, pw, 64, 12);
            ctx.fillStyle = "#16161a";
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = "rgba(255,255,255,0.14)";
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-pw / 2 + 16, 1.5);
            ctx.lineTo(pw / 2 - 16, 1.5);
            ctx.strokeStyle = "rgba(10,75,224,0.7)";
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
            return;
          }
          const ph = PLATE_H;
          ctx.save();
          ctx.translate(b.position.x, b.position.y);
          ctx.rotate(b.angle);
          roundRectPath(ctx, -pw / 2, -ph / 2, pw, ph, ph / 2);
          if (b.perfect && flashing) {
            ctx.fillStyle = "#0a4be0";
            ctx.shadowColor = "rgba(10,75,224,0.7)";
            ctx.shadowBlur = 26;
          } else {
            ctx.fillStyle = "#101012";
          }
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "rgba(255,255,255,0.16)";
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, ph * 0.27, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,255,255,0.34)";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        };

        pieces.forEach(drawPiece);

        if (active && statusRef.current === "playing") {
          const ax = active.position.x;
          ctx.save();
          ctx.strokeStyle = "rgba(10,75,224,0.45)";
          ctx.setLineDash([5, 8]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ax, DROP_Y + PLATE_H / 2);
          ctx.lineTo(ax, Math.max(towerTopY, DROP_Y + PLATE_H));
          ctx.stroke();
          ctx.restore();
          drawPiece(active);
          // accent outline on the live plate
          const pw = active.plateW ?? 120;
          ctx.save();
          ctx.translate(active.position.x, active.position.y);
          roundRectPath(ctx, -pw / 2, -PLATE_H / 2, pw, PLATE_H, PLATE_H / 2);
          ctx.strokeStyle = "rgba(10,75,224,0.9)";
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.restore();
        }
        if (pending) drawPiece(pending);
      });

      const runner = Matter.Runner.create();
      Matter.Render.run(render);
      Matter.Runner.run(runner, engine);

      const onPointer = () => {
        if (statusRef.current === "playing") drop();
      };
      render.canvas.addEventListener("pointerdown", onPointer);

      const onKey = (e: KeyboardEvent) => {
        if (e.code !== "Space") return;
        e.preventDefault();
        if (statusRef.current === "playing") drop();
        else start();
      };
      window.addEventListener("keydown", onKey);

      const ro = new ResizeObserver(() => {
        w = wrap.clientWidth || w;
        h = wrap.clientHeight || h;
        const pr = render.options.pixelRatio as number;
        render.canvas.width = w * pr;
        render.canvas.height = h * pr;
        render.canvas.style.width = `${w}px`;
        render.canvas.style.height = `${h}px`;
        render.options.width = w;
        render.options.height = h;
        Matter.Render.setPixelRatio(render, pr);
      });
      ro.observe(wrap);

      cleanup = () => {
        window.clearTimeout(perfectTimer.current);
        render.canvas.removeEventListener("pointerdown", onPointer);
        window.removeEventListener("keydown", onKey);
        ro.disconnect();
        Matter.Render.stop(render);
        Matter.Runner.stop(runner);
        Matter.Composite.clear(world, false);
        Matter.Engine.clear(engine);
        render.canvas.remove();
        render.textures = {};
        apiRef.current = null;
      };
    } catch {
      cleanup = () => {};
    }
    return () => cleanup();
  }, []);

  const isRecord = status === "over" && score > 0 && score >= best;

  return (
    <div className="plate-stage" ref={wrapRef} data-testid="plate-stage">
      <div className="game-hud" aria-live="polite">
        <div className="gh-item">
          <span className="gh-k">Score</span>
          <span className="gh-v" data-testid="game-score">
            {score}
          </span>
        </div>
        <div className="gh-item">
          <span className="gh-k">Combo</span>
          <span className={`gh-v ${combo > 0 ? "win" : ""}`} data-testid="game-combo">
            ×{combo}
          </span>
        </div>
        <div className="gh-item">
          <span className="gh-k">Rekord</span>
          <span className="gh-v" data-testid="game-best">
            {best}
          </span>
        </div>
      </div>

      {perfect ? (
        <div className="game-banner win" data-testid="game-perfect">
          PERFEKT
        </div>
      ) : null}

      {status === "playing" ? (
        <div className="plate-tip" data-testid="game-tip">
          Tryk for at slippe — ram centrum
        </div>
      ) : null}

      {status !== "playing" ? (
        <div className="game-overlay" data-testid="game-overlay">
          <span className="go-kicker">
            {status === "over" ? "Game over" : "Mini-spil"}
          </span>
          <h3 className="go-title" data-testid="game-overlay-title">
            {status === "over" ? `${score} point` : "Stabl stangen"}
          </h3>
          <p className="go-sub">
            {status === "over"
              ? isRecord
                ? "Ny rekord. Slå den igen."
                : "Slip skiven i centrum og byg tårnet højere."
              : "Slip skiverne præcist oven på hinanden. Ram centrum for combos — og byg det højeste tårn."}
          </p>
          <button
            type="button"
            className="go-btn"
            onClick={() => apiRef.current?.start()}
            data-testid="game-start"
          >
            {status === "over" ? "Spil igen" : "Start spil"}
          </button>
          <span className="go-hint">Tryk på feltet eller mellemrumstasten</span>
        </div>
      ) : null}

      <div className="plate-controls">
        <button
          type="button"
          className="drop-btn"
          onClick={() => apiRef.current?.drop()}
          disabled={status !== "playing"}
          data-testid="game-drop"
        >
          Slip skive
        </button>
      </div>
    </div>
  );
}
