import React, { useEffect, useRef, useState } from "react";
import * as Matter from "matter-js";

const WEIGHTS = [5, 10, 15, 20, 25];
const COLORS = ["#0b0b0d", "#16181d", "#0b0b0d", "#16181d", "#0b0b0d"];
const radiusFor = (kg: number) => 24 + kg * 1.5;

/**
 * A physics sandbox: real gym plates you can grab, fling and stack.
 * Built with Matter.js — drag to throw, watch them collide and settle.
 */
export default function PlatePlayground() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [total, setTotal] = useState(0);
  const apiRef = useRef<{ add: (kg?: number) => void; reset: () => void } | null>(
    null
  );

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
      let floor = Matter.Bodies.rectangle(w / 2, h + T / 2 - 1, w * 3, T, wallOpts);
      let left = Matter.Bodies.rectangle(-T / 2 + 1, h / 2, T, h * 3, wallOpts);
      let right = Matter.Bodies.rectangle(w + T / 2 - 1, h / 2, T, h * 3, wallOpts);
      let ceil = Matter.Bodies.rectangle(w / 2, -T / 2 - 200, w * 3, T, wallOpts);
      Matter.Composite.add(world, [floor, left, right, ceil]);

      const plates: Matter.Body[] = [];
      let idx = 0;

      const recalc = () => {
        const sum = plates.reduce(
          (acc, b) => acc + ((b as Matter.Body & { kg?: number }).kg ?? 0),
          0
        );
        setTotal(sum);
      };

      const addPlate = (kg?: number) => {
        if (plates.length >= 16) {
          const old = plates.shift();
          if (old) Matter.Composite.remove(world, old);
        }
        const weight = kg ?? WEIGHTS[idx++ % WEIGHTS.length];
        const r = radiusFor(weight);
        const x = r + Math.random() * (Math.max(1, w - r * 2));
        const body = Matter.Bodies.circle(x, -r - 10, r, {
          restitution: 0.45,
          friction: 0.4,
          frictionAir: 0.008,
          density: 0.004,
          render: {
            fillStyle: COLORS[WEIGHTS.indexOf(weight)] ?? "#0b0b0d",
            strokeStyle: "rgba(255,255,255,0.16)",
            lineWidth: 2
          }
        });
        (body as Matter.Body & { kg?: number }).kg = weight;
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.2);
        Matter.Composite.add(world, body);
        plates.push(body);
        recalc();
      };

      const reset = () => {
        plates.forEach((b) => Matter.Composite.remove(world, b));
        plates.length = 0;
        idx = 0;
        const seed = [20, 10, 25, 15, 5, 20];
        seed.forEach((kg, i) =>
          window.setTimeout(() => addPlate(kg), i * 140)
        );
      };
      apiRef.current = { add: addPlate, reset };

      // labels + hub ring
      Matter.Events.on(render, "afterRender", () => {
        const ctx = render.context;
        plates.forEach((b) => {
          const kg = (b as Matter.Body & { kg?: number }).kg ?? 0;
          const r = (b.circleRadius ?? 30) as number;
          const { x, y } = b.position;
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,255,255,0.2)";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = "#ffffff";
          ctx.font = `800 ${Math.round(r * 0.46)}px "Cabinet Grotesk", system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.translate(x, y);
          ctx.rotate(b.angle);
          ctx.fillText(String(kg), 0, 0);
          ctx.restore();
        });
      });

      // mouse drag / throw (desktop only — keep touch scrolling smooth)
      if (window.matchMedia("(pointer: fine)").matches) {
        const mouse = Matter.Mouse.create(render.canvas);
        const mc = Matter.MouseConstraint.create(engine, {
          mouse,
          constraint: { stiffness: 0.2, render: { visible: false } }
        });
        Matter.Composite.add(world, mc);
        render.mouse = mouse;
        // let the page keep scrolling over the canvas
        const anyMouse = mouse as unknown as {
          mousewheel: EventListener;
          element: HTMLElement;
        };
        anyMouse.element.removeEventListener("wheel", anyMouse.mousewheel);
      }

      const runner = Matter.Runner.create();
      Matter.Render.run(render);
      Matter.Runner.run(runner, engine);
      reset();

      const ro = new ResizeObserver(() => {
        w = W();
        h = H();
        render.canvas.width = w * (render.options.pixelRatio as number);
        render.canvas.height = h * (render.options.pixelRatio as number);
        render.canvas.style.width = `${w}px`;
        render.canvas.style.height = `${h}px`;
        render.options.width = w;
        render.options.height = h;
        Matter.Render.setPixelRatio(render, render.options.pixelRatio as number);
        Matter.Body.setPosition(floor, { x: w / 2, y: h + T / 2 - 1 });
        Matter.Body.setPosition(right, { x: w + T / 2 - 1, y: h / 2 });
        Matter.Body.setPosition(left, { x: -T / 2 + 1, y: h / 2 });
        Matter.Body.setPosition(ceil, { x: w / 2, y: -T / 2 - 200 });
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

  return (
    <div className="plate-stage" ref={wrapRef} data-testid="plate-stage">
      <div className="plate-hud" aria-live="polite">
        <div className="ph-k">Vægt i spil</div>
        <div className="ph-v" data-testid="plate-total">
          {total}
          <span>kg</span>
        </div>
      </div>
      <div className="plate-tip">Træk · slip · kast</div>
      <div className="plate-actions">
        <button
          type="button"
          onClick={() => apiRef.current?.add()}
          data-testid="plate-add"
        >
          + Tilføj skive
        </button>
        <button
          type="button"
          className="primary"
          onClick={() => apiRef.current?.reset()}
          data-testid="plate-reset"
        >
          Ryd op
        </button>
      </div>
    </div>
  );
}
