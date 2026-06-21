import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const LOGO_SRC = "/brand/tm-logo-mark.png";

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInCubic = (x: number) => x * x * x;
const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

function radialTexture(stops: [number, string][]) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Cinematic 3D logo intro (~3.4s). Layered faux-extrusion of the brand "M",
 * elastic spring-in, depth shimmer, particle burst, shockwave and a flash
 * reveal. Honours reduced-motion and is click/key skippable.
 */
export default function IntroLoader({ onDone }: { onDone: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const [exiting, setExiting] = useState(false);
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setExiting(true);
    window.setTimeout(onDone, 480);
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const id = window.setTimeout(() => finishRef.current(), 650);
      return () => window.clearTimeout(id);
    }

    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      const id = window.setTimeout(() => finishRef.current(), 400);
      return () => window.clearTimeout(id);
    }

    let raf = 0;
    let disposed = false;
    const safety = window.setTimeout(() => finishRef.current(), 6000);

    const sizeOf = () => ({
      w: mount.clientWidth || window.innerWidth,
      h: mount.clientHeight || window.innerHeight
    });
    let { w, h } = sizeOf();

    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 9);

    // ---- glow behind logo ----
    const glowTex = radialTexture([
      [0, "rgba(10,75,224,0.9)"],
      [0.4, "rgba(10,75,224,0.4)"],
      [1, "rgba(10,75,224,0)"]
    ]);
    const glowMat = new THREE.SpriteMaterial({
      map: glowTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    const glow = new THREE.Sprite(glowMat);
    glow.scale.set(9, 9, 1);
    glow.position.z = -1;
    scene.add(glow);

    // ---- particles ----
    const COUNT = 150;
    const palette = [
      new THREE.Color("#0a4be0"),
      new THREE.Color("#ff2056"),
      new THREE.Color("#ffffff"),
      new THREE.Color("#7a2ec4")
    ];
    const pPos = new Float32Array(COUNT * 3);
    const pCol = new Float32Array(COUNT * 3);
    const pBase: number[] = [];
    for (let i = 0; i < COUNT; i++) {
      const r = 1.4 + Math.random() * 4.2;
      const a = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 6;
      const z = -1.2 - Math.random() * 3.5; // always behind the logo
      pPos[i * 3] = Math.cos(a) * r;
      pPos[i * 3 + 1] = y;
      pPos[i * 3 + 2] = z;
      pBase.push(Math.cos(a) * r, y, z);
      const col = palette[(Math.random() * palette.length) | 0];
      pCol[i * 3] = col.r;
      pCol[i * 3 + 1] = col.g;
      pCol[i * 3 + 2] = col.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.12,
      map: radialTexture([
        [0, "rgba(255,255,255,1)"],
        [0.5, "rgba(255,255,255,0.5)"],
        [1, "rgba(255,255,255,0)"]
      ]),
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0
    });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    // ---- shockwave ring ----
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x0a4be0,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      opacity: 0,
      depthWrite: false
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.42, 64), ringMat);
    ring.position.z = 0.2;
    scene.add(ring);

    // ---- layered faux-extruded logo ----
    const logoGroup = new THREE.Group();
    scene.add(logoGroup);
    const LAYERS = 14;
    const logoMats: THREE.MeshBasicMaterial[] = [];

    const buildLogo = (tex: THREE.Texture) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const aspect = 1; // 1024x1024
      const geo = new THREE.PlaneGeometry(3.4 * aspect, 3.4);
      for (let i = 0; i < LAYERS; i++) {
        const front = i === LAYERS - 1;
        const shade = 0.2 + 0.8 * (i / (LAYERS - 1));
        const mat = new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          alphaTest: 0.04,
          color: new THREE.Color(shade, shade, shade),
          depthWrite: front
        });
        logoMats.push(mat);
        const m = new THREE.Mesh(geo, mat);
        m.position.z = -0.7 + (i / (LAYERS - 1)) * 0.7;
        logoGroup.add(m);
      }
    };

    new THREE.TextureLoader().load(LOGO_SRC, buildLogo);

    const onResize = () => {
      const s = sizeOf();
      w = s.w;
      h = s.h;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    const TL = { in: 1.0, hold: 2.15, climax: 3.0, end: 3.45 };
    const start = performance.now();

    const tick = () => {
      if (disposed) return;
      const t = (performance.now() - start) / 1000;

      // camera dolly
      const dollyIn = easeOutCubic(seg(t, 0, TL.in));
      const push = easeInCubic(seg(t, TL.climax, TL.end));
      camera.position.z = 9 - 3 * dollyIn - 2.6 * push;

      // logo spring + spin
      const s = 0.18 + (1 - 0.18) * easeOutBack(seg(t, 0, TL.in));
      logoGroup.scale.set(s, s, s);
      let ry = -1.7 + 1.7 * easeOutCubic(seg(t, 0, TL.in));
      if (t > TL.in && t < TL.climax) {
        ry += 0.32 * Math.sin((t - TL.in) * 2.4);
      }
      if (t >= TL.hold) {
        ry += easeInOutCubic(seg(t, TL.hold, TL.climax)) * Math.PI * 2;
      }
      logoGroup.rotation.y = ry;
      logoGroup.rotation.z = (1 - easeOutCubic(seg(t, 0, TL.in))) * -0.25;

      // glow pulse
      const glowBase = 0.2 + 0.42 * dollyIn;
      const pulse = 0.1 * Math.sin(t * 4);
      glowMat.opacity = (glowBase + pulse) * (1 - 0.6 * push);
      const gs = 6.5 + 2.2 * dollyIn + 3 * push;
      glow.scale.set(gs, gs, 1);

      // particles
      pMat.opacity = 0.55 * easeOutCubic(seg(t, 0.3, 1.2)) * (1 - 0.7 * seg(t, TL.climax, TL.end));
      points.rotation.y = t * 0.35;
      points.rotation.z = t * 0.08;
      const expand = 0.55 + 0.9 * easeOutCubic(seg(t, 0.3, TL.climax)) + 0.6 * push;
      const pos = pGeo.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < COUNT; i++) {
        pos.setXYZ(
          i,
          pBase[i * 3] * expand,
          pBase[i * 3 + 1] * expand + Math.sin(t * 1.5 + i) * 0.06,
          pBase[i * 3 + 2] * expand
        );
      }
      pos.needsUpdate = true;

      // shockwave
      const sw = seg(t, TL.hold, TL.climax + 0.2);
      if (sw > 0 && sw < 1) {
        ringMat.opacity = (1 - sw) * 0.85;
        const rs = 0.4 + sw * 6;
        ring.scale.set(rs, rs, rs);
      } else {
        ringMat.opacity = 0;
      }

      // dom overlays
      if (barRef.current) barRef.current.style.transform = `scaleX(${easeOutCubic(seg(t, 0, TL.climax))})`;
      if (wordRef.current) {
        const wOp = easeOutCubic(seg(t, 0.6, 1.5));
        wordRef.current.style.opacity = String(wOp * (1 - push));
        wordRef.current.style.letterSpacing = `${0.5 - 0.34 * wOp}em`;
      }
      if (flashRef.current) {
        flashRef.current.style.opacity = String(easeInCubic(seg(t, TL.climax + 0.05, TL.end)) * 0.7);
      }

      renderer.render(scene, camera);

      if (t >= TL.end) {
        finishRef.current();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(safety);
      window.removeEventListener("resize", onResize);
      glowTex.dispose();
      glowMat.dispose();
      pGeo.dispose();
      (pMat.map as THREE.Texture | null)?.dispose();
      pMat.dispose();
      ring.geometry.dispose();
      ringMat.dispose();
      logoMats.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === mount)
        mount.removeChild(renderer.domElement);
    };
  }, []);

  const skip = () => finishRef.current();

  return (
    <div
      className={`intro-loader ${exiting ? "is-exiting" : ""}`}
      data-testid="intro-loader"
      onClick={skip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") skip();
      }}
      role="button"
      tabIndex={0}
      aria-label="Indlæser Træningsmester — tryk for at springe over"
    >
      <div className="intro-canvas" ref={mountRef} aria-hidden="true" />
      <div className="intro-word" ref={wordRef} aria-hidden="true">
        TRÆNINGSMESTER
      </div>
      <div className="intro-bar" aria-hidden="true">
        <div className="intro-bar-fill" ref={barRef} />
      </div>
      <span className="intro-skip" aria-hidden="true">
        Tryk for at springe over
      </span>
      <div className="intro-flash" ref={flashRef} aria-hidden="true" />
    </div>
  );
}
