import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * A clean, draggable 3D iPhone showing the app screen.
 * Grab to rotate (with inertia), idle auto-rotate, gentle float.
 * Falls back to a flat image if WebGL is unavailable.
 */
export default function Phone3D({
  screen,
  alt
}: {
  screen: string;
  alt: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    if (!renderer.getContext()) {
      setFailed(true);
      return;
    }

    let w = mount.clientWidth || 420;
    let h = mount.clientHeight || 460;
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(22, w / h, 0.1, 100);
    camera.position.set(0, 0, 12);

    // Lighting — soft studio
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(4, 6, 8);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xdfe6ff, 0.45);
    fill.position.set(-6, 2, 4);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.6);
    rim.position.set(-2, 4, -6);
    scene.add(rim);

    const group = new THREE.Group();
    scene.add(group);

    // Body
    const bodyGeo = new RoundedBoxGeometry(2.05, 4.25, 0.26, 8, 0.2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0b0b0d,
      metalness: 0.6,
      roughness: 0.38
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Subtle metallic side frame highlight
    const frameGeo = new RoundedBoxGeometry(2.1, 4.3, 0.18, 6, 0.22);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x2a2c33,
      metalness: 0.9,
      roughness: 0.3
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.z = -0.02;
    group.add(frame);

    // Screen
    const loader = new THREE.TextureLoader();
    const tex = loader.load(
      screen,
      () => renderer.render(scene, camera),
      undefined,
      () => {}
    );
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const screenGeo = new THREE.PlaneGeometry(1.82, 4.0);
    const screenMat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.z = 0.135;
    group.add(screenMesh);

    // Notch / dynamic-island pill
    const islandGeo = new RoundedBoxGeometry(0.62, 0.16, 0.05, 4, 0.07);
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.5 });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.set(0, 1.72, 0.16);
    group.add(island);

    // ---- interaction state ----
    let targetY = -0.4;
    let targetX = 0.06;
    let curY = targetY;
    let curX = targetX;
    let dragging = false;
    let lx = 0;
    let ly = 0;
    let vY = 0;
    let lastInteract = performance.now();
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

    const el = renderer.domElement;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
      vY = 0;
      lastInteract = performance.now();
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      targetY += dx * 0.01;
      targetX = clamp(targetX + dy * 0.006, -0.55, 0.55);
      vY = dx * 0.01;
      lx = e.clientX;
      ly = e.clientY;
      lastInteract = performance.now();
    };
    const onUp = () => {
      dragging = false;
      lastInteract = performance.now();
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);

    let running = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    io.observe(mount);

    const ro = new ResizeObserver(() => {
      w = mount.clientWidth || w;
      h = mount.clientHeight || h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    let raf = 0;
    const animate = (t: number) => {
      raf = requestAnimationFrame(animate);
      if (!running) return;
      if (!dragging) {
        if (!reduced && t - lastInteract > 2200) {
          targetY += 0.0025;
        } else {
          targetY += vY * 0.92;
          vY *= 0.9;
        }
        targetX += (0.06 - targetX) * 0.02;
      }
      curY += (targetY - curY) * 0.09;
      curX += (targetX - curX) * 0.09;
      group.rotation.y = curY;
      group.rotation.x = curX;
      group.position.y = reduced ? 0 : Math.sin(t * 0.0011) * 0.07;
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      bodyGeo.dispose();
      frameGeo.dispose();
      screenGeo.dispose();
      islandGeo.dispose();
      bodyMat.dispose();
      frameMat.dispose();
      screenMat.dispose();
      islandMat.dispose();
      tex.dispose();
      renderer.dispose();
      if (el.parentNode === mount) mount.removeChild(el);
    };
  }, [screen]);

  if (failed) {
    return (
      <div className="device phone3d-fallback" data-testid="phone3d-fallback">
        <div className="device-screen">
          <img src={screen} alt={alt} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="phone3d"
      ref={mountRef}
      role="img"
      aria-label={alt}
      data-testid="phone3d"
    />
  );
}
