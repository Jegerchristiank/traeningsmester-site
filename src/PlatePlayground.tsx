import React, { useEffect, useRef, useState } from "react";
import * as Matter from "matter-js";

const WEIGHTS = [5, 10, 15, 20, 25];
const radiusFor = (kg: number) => 26 + kg * 1.5;
const rand5 = (lo: number, hi: number) => {
  const steps = Math.max(0, Math.floor((hi - lo) / 5));
  return lo + Math.floor(Math.random() * (steps + 1)) * 5;
};
const makeTarget = (streak: number) => rand5(20, Math.min(140, 40 + streak * 12));

const BEST_KEY = "tm-plate-best";

type PlateApi = {
  add: (kg: number) => void;
  undo: () => void;
  clear: () => void;
  celebrate: () => void;
};

/**
 * "Ram vægten" — a tiny physics game.
 * Drop plates to hit the exact target weight; chase your longest streak.
 * Built with Matter.js (real collisions, drag-to-rearrange on desktop).
 */
export default function PlatePlayground() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<PlateApi | null>(null);

  const [target, setTarget] = useState(() => makeTarget(0));
  const [stack, setStack] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [status, setStatus] = useState<"playing" | "won" | "over">("playing");
  const lockRef = useRef(false);

  const total = stack.reduce((a, b) => a + b, 0);

  useEffect(() => {
    try {
      const v = Number(window.localStorage?.getItem(BEST_KEY) || 0);
      if (v > 0) setBest(v);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let cleanup = () => {};
    try {
      const W = () => wrap.clientWidth || 800;
      const H = () => wrap.clientHeight || 460;
      let w = W();
      let h = H();

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

      const wallOpts = { isStatic: true, render: { visible: false } };
      const T = 240;
      const floor = Matter.Bodies.rectangle(w / 2, h + T / 2 - 1, w * 3, T, wallOpts);
      const left = Matter.Bodies.rectangle(-T / 2 + 1, h / 2, T, h * 3, wallOpts);
      const right = Matter.Bodies.rectangle(w + T / 2 - 1, h / 2, T, h * 3, wallOpts);
      Matter.Composite.add(world, [floor, left, right]);

      const plates: (Matter.Body & { kg?: number })[] = [];
      let flashUntil = 0;

      const addPlate = (kg: number) => {
        const r = radiusFor(kg);
        const x = w / 2 + (Math.random() - 0.5) * Math.min(w * 0.5, 260);
        const body = Matter.Bodies.circle(x, -r - 8, r, {
          restitution: 0.42,
          friction: 0.5,
          frictionAir: 0.01,
          density: 0.004,
          render: { fillStyle: "#101012", strokeStyle: "rgba(255,255,255,0.16)", lineWidth: 2 }
        }) as Matter.Body & { kg?: number };
        body.kg = kg;
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.18);
        Matter.Composite.add(world, body);
        plates.push(body);
      };
      const undo = () => {
        const b = plates.pop();
        if (b) Matter.Composite.remove(world, b);
      };
      const clear = () => {
        plates.forEach((b) => Matter.Composite.remove(world, b));
        plates.length = 0;
      };
      const celebrate = () => {
        flashUntil = performance.now() + 950;
        plates.forEach((b) =>
          Matter.Body.setVelocity(b, { x: (Math.random() - 0.5) * 5, y: -9 - Math.random() * 3 })
        );
      };
      apiRef.current = { add: addPlate, undo, clear, celebrate };

      Matter.Events.on(render, "afterRender", () => {
        const ctx = render.context;
        const flashing = performance.now() < flashUntil;
        plates.forEach((b) => {
          const kg = b.kg ?? 0;
          const r = (b.circleRadius ?? 30) as number;
          const { x, y } = b.position;
          if (flashing) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(10,75,224,0.9)";
            ctx.fill();
            ctx.restore();
          }
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,255,255,0.22)";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = "#fff";
          ctx.font = `800 ${Math.round(r * 0.5)}px "Cabinet Grotesk", system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.translate(x, y);
          ctx.rotate(b.angle);
          ctx.fillText(String(kg), 0, 0);
          ctx.restore();
        });
      });

      // desktop-only drag (keep touch scrolling smooth)
      if (window.matchMedia("(pointer: fine)").matches) {
        const mouse = Matter.Mouse.create(render.canvas);
        const mc = Matter.MouseConstraint.create(engine, {
          mouse,
          constraint: { stiffness: 0.2, render: { visible: false } }
        });
        Matter.Composite.add(world, mc);
        render.mouse = mouse;
        const anyMouse = mouse as unknown as { mousewheel: EventListener; element: HTMLElement };
        anyMouse.element.removeEventListener("wheel", anyMouse.mousewheel);
      }

      const runner = Matter.Runner.create();
      Matter.Render.run(render);
      Matter.Runner.run(runner, engine);

      const ro = new ResizeObserver(() => {
        w = W();
        h = H();
        const pr = render.options.pixelRatio as number;
        render.canvas.width = w * pr;
        render.canvas.height = h * pr;
        render.canvas.style.width = `${w}px`;
        render.canvas.style.height = `${h}px`;
        render.options.width = w;
        render.options.height = h;
        Matter.Render.setPixelRatio(render, pr);
        Matter.Body.setPosition(floor, { x: w / 2, y: h + T / 2 - 1 });
        Matter.Body.setPosition(right, { x: w + T / 2 - 1, y: h / 2 });
        Matter.Body.setPosition(left, { x: -T / 2 + 1, y: h / 2 });
      });
      ro.observe(wrap);

      cleanup = () => {
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

  const handleAdd = (kg: number) => {
    if (status !== "playing" || lockRef.current) return;
    apiRef.current?.add(kg);
    const next = total + kg;
    const nextStack = [...stack, kg];
    setStack(nextStack);
    if (next === target) {
      lockRef.current = true;
      setStatus("won");
      apiRef.current?.celebrate();
      const ns = streak + 1;
      setStreak(ns);
      if (ns > best) {
        setBest(ns);
        try {
          window.localStorage?.setItem(BEST_KEY, String(ns));
        } catch {
          /* noop */
        }
      }
      window.setTimeout(() => {
        apiRef.current?.clear();
        setStack([]);
        setTarget(makeTarget(ns));
        setStatus("playing");
        lockRef.current = false;
      }, 1250);
    } else if (next > target) {
      setStatus("over");
    }
  };

  const handleUndo = () => {
    if (lockRef.current || stack.length === 0) return;
    apiRef.current?.undo();
    const nextStack = stack.slice(0, -1);
    setStack(nextStack);
    const next = nextStack.reduce((a, b) => a + b, 0);
    if (next <= target) setStatus("playing");
  };

  const handleReset = () => {
    if (lockRef.current) return;
    apiRef.current?.clear();
    setStack([]);
    setStreak(0);
    setTarget(makeTarget(0));
    setStatus("playing");
  };

  const remaining = target - total;
  const totalClass = status === "won" ? "win" : status === "over" ? "over" : "";

  return (
    <div className="plate-stage" ref={wrapRef} data-testid="plate-stage">
      <div className="game-hud" aria-live="polite">
        <div className="gh-item">
          <span className="gh-k">Mål</span>
          <span className="gh-v" data-testid="plate-target">
            {target}
            <i>kg</i>
          </span>
        </div>
        <div className="gh-item">
          <span className="gh-k">På stangen</span>
          <span className={`gh-v ${totalClass}`} data-testid="plate-total">
            {total}
            <i>kg</i>
          </span>
        </div>
        <div className="gh-item">
          <span className="gh-k">Streak</span>
          <span className="gh-v" data-testid="plate-streak">
            {streak}
          </span>
        </div>
        <div className="gh-item">
          <span className="gh-k">Rekord</span>
          <span className="gh-v">{best}</span>
        </div>
      </div>

      {status === "won" ? (
        <div className="game-banner win" data-testid="plate-win">
          ✓ Ramt!
        </div>
      ) : status === "over" ? (
        <div className="game-banner over">
          {Math.abs(remaining)} kg for meget — fortryd en skive
        </div>
      ) : total === 0 ? (
        <div className="plate-tip">Drop skiver, ram målet præcist</div>
      ) : (
        <div className="plate-tip">{remaining} kg igen</div>
      )}

      <div className="plate-controls">
        <div className="plate-btns" role="group" aria-label="Tilføj skive">
          {WEIGHTS.map((kg) => (
            <button
              key={kg}
              type="button"
              onClick={() => handleAdd(kg)}
              disabled={status !== "playing"}
              data-testid={`plate-add-${kg}`}
            >
              {kg}
            </button>
          ))}
        </div>
        <div className="plate-actions">
          <button type="button" onClick={handleUndo} data-testid="plate-undo">
            Fortryd
          </button>
          <button
            type="button"
            className="primary"
            onClick={handleReset}
            data-testid="plate-reset"
          >
            Nulstil
          </button>
        </div>
      </div>
    </div>
  );
}
