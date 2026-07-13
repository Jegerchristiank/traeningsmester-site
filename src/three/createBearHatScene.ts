import * as THREE from "three";

const DURATION_SECONDS = 5.2;
const LOOP_SECONDS = DURATION_SECONDS * 2;
const LOOP_MILLISECONDS = LOOP_SECONDS * 1000;
const INTERACTION_DURATION_MILLISECONDS = 900;
const BRAND_BLUE = 0x0047ab;
const BRAND_RED = 0xe31836;
const INK = 0x101319;
const LOGO_URL = "/brand/tm-logo.png";

export type BearHatSceneController = {
  dispose: () => void;
  pause: () => void;
  play: () => void;
  react: (target: BearInteractionTarget) => void;
  renderFinalPose: () => void;
};

export type BearInteractionTarget = "head" | "belly" | "leftArm" | "rightArm";

export type BearHatSceneOptions = {
  onFallback?: (error: Error) => void;
  onReady?: () => void;
};

type ArmRig = {
  shoulder: THREE.Group;
  elbow: THREE.Group;
  paw: THREE.Mesh;
};

type ActiveBearInteraction = {
  startedAt: number;
  target: BearInteractionTarget;
};

function asError(reason: unknown, fallbackMessage: string): Error {
  return reason instanceof Error ? reason : new Error(fallbackMessage);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function segment(time: number, start: number, end: number): number {
  return clamp01((time - start) / (end - start));
}

function smooth(value: number): number {
  const v = clamp01(value);
  return v * v * (3 - 2 * v);
}

function easeOutBack(value: number): number {
  const v = clamp01(value);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (v - 1) ** 3 + c1 * (v - 1) ** 2;
}

function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function pulse(time: number, start: number, peak: number, end: number): number {
  if (time <= peak) return smooth(segment(time, start, peak));
  return 1 - smooth(segment(time, peak, end));
}

function pingPongTime(elapsedSeconds: number): number {
  const phase = (elapsedSeconds % LOOP_SECONDS) / LOOP_SECONDS;
  // Cosine easing makes both direction changes land with zero velocity.
  return DURATION_SECONDS * (0.5 - 0.5 * Math.cos(phase * Math.PI * 2));
}

/**
 * Creates the decorative Træningsmester bear scene inside an existing element.
 * React owns the element; this controller owns every Three.js/WebGL resource.
 */
export function createBearHatScene(
  container: HTMLElement,
  options: BearHatSceneOptions = {},
): BearHatSceneController {
  let renderer: THREE.WebGLRenderer;

  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      failIfMajorPerformanceCaveat: true,
      powerPreference: "default",
      premultipliedAlpha: false,
    });
  } catch (reason) {
    throw asError(reason, "WebGL could not be initialized for the bear scene.");
  }

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, container.clientWidth < 640 ? 1.35 : 1.75),
  );
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.94;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const canvas = renderer.domElement;
  canvas.style.display = "block";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.width = "100%";
  canvas.setAttribute("aria-hidden", "true");
  canvas.tabIndex = -1;
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-2.55, 2.55, 2.55, -2.55, 0.1, 30);
  camera.position.set(0, 0.25, 7.5);
  camera.lookAt(0, 0.2, 0);

  scene.add(new THREE.HemisphereLight(0xfff4df, 0x40566b, 1.75));
  scene.add(new THREE.AmbientLight(0xfff8ef, 0.42));

  const keyLight = new THREE.DirectionalLight(0xfff2d6, 2.05);
  keyLight.position.set(4.5, 7.5, 7.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -3;
  keyLight.shadow.camera.right = 3;
  keyLight.shadow.camera.top = 4;
  keyLight.shadow.camera.bottom = -3;
  keyLight.shadow.bias = -0.00015;
  keyLight.shadow.normalBias = 0.035;
  keyLight.shadow.radius = 3;
  scene.add(keyLight);

  const softBoxLight = new THREE.RectAreaLight(0xffe7c4, 2.15, 5, 5);
  softBoxLight.position.set(-3.5, 4.5, 5.5);
  softBoxLight.lookAt(0, 0.2, 0);
  scene.add(softBoxLight);

  const blueRim = new THREE.DirectionalLight(BRAND_BLUE, 0.68);
  blueRim.position.set(-4, 3.5, -3);
  scene.add(blueRim);

  const redRim = new THREE.PointLight(BRAND_RED, 0.32, 10, 2);
  redRim.position.set(3.2, 1.8, -2.2);
  scene.add(redRim);

  const fur = new THREE.MeshPhysicalMaterial({
    color: 0x8a5435,
    roughness: 0.66,
    metalness: 0,
    clearcoat: 0.025,
    clearcoatRoughness: 0.8,
  });
  const furLight = new THREE.MeshPhysicalMaterial({
    color: 0xd9ad7d,
    roughness: 0.72,
    clearcoat: 0.04,
  });
  const furDark = new THREE.MeshStandardMaterial({ color: 0x5e341f, roughness: 0.8 });
  const ink = new THREE.MeshPhysicalMaterial({
    color: INK,
    roughness: 0.32,
    clearcoat: 0.35,
  });
  const eyeHighlight = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const blue = new THREE.MeshPhysicalMaterial({
    color: BRAND_BLUE,
    roughness: 0.55,
    clearcoat: 0.16,
  });
  const red = new THREE.MeshPhysicalMaterial({
    color: BRAND_RED,
    roughness: 0.58,
    clearcoat: 0.12,
  });
  const hatDark = new THREE.MeshPhysicalMaterial({
    color: 0x172234,
    roughness: 0.55,
    clearcoat: 0.1,
  });

  const ellipsoid = (
    material: THREE.Material,
    scale: [number, number, number],
    segments = 48,
  ): THREE.Mesh => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, segments, Math.max(20, Math.round(segments / 2))),
      material,
    );
    mesh.scale.set(...scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  const tube = (
    points: [THREE.Vector3, THREE.Vector3, THREE.Vector3],
    radius: number,
    material: THREE.Material,
  ): THREE.Mesh => {
    const curve = new THREE.QuadraticBezierCurve3(points[0], points[1], points[2]);
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 8, false), material);
    mesh.castShadow = true;
    return mesh;
  };

  const createSoftShadow = (): THREE.Mesh => {
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 256;
    shadowCanvas.height = 128;
    const context = shadowCanvas.getContext("2d");
    if (!context) throw new Error("The bear shadow texture could not be created.");

    const gradient = context.createRadialGradient(128, 64, 4, 128, 64, 123);
    gradient.addColorStop(0, "rgba(16,19,25,0.28)");
    gradient.addColorStop(0.48, "rgba(16,19,25,0.13)");
    gradient.addColorStop(1, "rgba(16,19,25,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, shadowCanvas.width, shadowCanvas.height);

    const texture = new THREE.CanvasTexture(shadowCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.25, 1.25), material);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, -1.49, 0.08);
    return shadow;
  };

  scene.add(createSoftShadow());

  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x765138, roughness: 0.92 });
  const leafDarkMaterial = new THREE.MeshStandardMaterial({ color: 0x2f6748, roughness: 0.96 });
  const leafMidMaterial = new THREE.MeshStandardMaterial({ color: 0x4f8358, roughness: 0.96 });
  const leafLightMaterial = new THREE.MeshStandardMaterial({ color: 0x739d69, roughness: 0.96 });
  const meadowMaterial = new THREE.MeshStandardMaterial({ color: 0x6f9463, roughness: 0.98 });

  const createTree = (scale: number, mirrored = false): THREE.Group => {
    const tree = new THREE.Group();
    tree.scale.setScalar(scale);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.17, 1.35, 14), trunkMaterial);
    trunk.position.y = 0.68;
    trunk.rotation.z = mirrored ? -0.035 : 0.035;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    const crownShapes: Array<[number, number, number, THREE.Material]> = [
      [-0.22, 1.2, 0.5, leafDarkMaterial],
      [0.24, 1.24, 0.47, leafMidMaterial],
      [-0.02, 1.58, 0.58, leafMidMaterial],
      [0.02, 1.92, 0.45, leafLightMaterial],
    ];

    crownShapes.forEach(([x, y, size, material]) => {
      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 2), material);
      crown.position.set(mirrored ? -x : x, y, 0);
      crown.rotation.set(0.08 * y, x * 0.4, x);
      crown.castShadow = true;
      crown.receiveShadow = true;
      tree.add(crown);
    });

    return tree;
  };

  const createCloud = (): THREE.Group => {
    const cloud = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({
      color: 0xfffdf7,
      depthWrite: false,
      toneMapped: false,
    });
    const parts: Array<[number, number, number, number]> = [
      [-0.3, 0, 0.35, 0.18],
      [0.02, 0.09, 0.46, 0.25],
      [0.36, -0.01, 0.34, 0.17],
    ];

    parts.forEach(([x, y, scaleX, scaleY]) => {
      const part = ellipsoid(material, [scaleX, scaleY, 0.08], 32);
      part.position.set(x, y, 0);
      part.castShadow = false;
      part.receiveShadow = false;
      cloud.add(part);
    });

    return cloud;
  };

  const createSoftSun = (): THREE.Group => {
    const sun = new THREE.Group();
    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(0.46, 48),
      new THREE.MeshBasicMaterial({ color: 0xf8e9bf, depthWrite: false, toneMapped: false }),
    );
    const middle = new THREE.Mesh(
      new THREE.CircleGeometry(0.37, 48),
      new THREE.MeshBasicMaterial({ color: 0xf6dea0, depthWrite: false, toneMapped: false }),
    );
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.29, 48),
      new THREE.MeshBasicMaterial({ color: 0xf3d486, depthWrite: false, toneMapped: false }),
    );
    middle.position.z = 0.005;
    disc.position.z = 0.01;
    sun.add(halo, middle, disc);
    return sun;
  };

  const environment = new THREE.Group();
  environment.position.z = -1.65;
  scene.add(environment);

  const meadow = ellipsoid(meadowMaterial, [2.65, 0.34, 0.55]);
  meadow.position.set(0, -1.55, -0.15);
  environment.add(meadow);

  const leftTree = createTree(1.05);
  leftTree.position.set(-1.82, -1.48, -0.32);
  const rightTree = createTree(0.91, true);
  rightTree.position.set(1.86, -1.48, -0.42);
  const farTree = createTree(0.6, true);
  farTree.position.set(1.18, -1.47, -0.72);
  environment.add(leftTree, rightTree, farTree);

  const cloud = createCloud();
  cloud.position.set(1.58, 1.87, -0.7);
  cloud.scale.setScalar(0.62);
  environment.add(cloud);

  const sun = createSoftSun();
  sun.position.set(-1.62, 1.72, -0.85);
  environment.add(sun);

  const flowerSpecs = [
    [-1.25, 0xe8b04c, 1],
    [-1.03, 0xe98b8b, 0.82],
    [1.24, 0xf3d36a, 0.9],
  ] as const;

  flowerSpecs.forEach(([x, color, scale]) => {
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x416d48, roughness: 1 });
    const flowerMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.28, 8), stemMaterial);
    stem.position.set(x, -1.27, -0.02);
    const flower = ellipsoid(flowerMaterial, [0.07 * scale, 0.07 * scale, 0.04], 24);
    flower.position.set(x, -1.11, 0);
    environment.add(stem, flower);
  });

  const bear = new THREE.Group();
  bear.position.y = -0.4;
  scene.add(bear);

  const body = ellipsoid(fur, [0.86, 1.02, 0.58]);
  body.position.set(0, -0.12, 0);
  bear.add(body);

  const belly = ellipsoid(furLight, [0.54, 0.68, 0.13]);
  belly.position.set(0, -0.26, 0.54);
  bear.add(belly);

  const chestLogoMaterial = new THREE.MeshBasicMaterial({
    alphaTest: 0.01,
    depthWrite: false,
    opacity: 0,
    transparent: true,
    toneMapped: false,
  });
  const chestLogo = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.66), chestLogoMaterial);
  chestLogo.position.set(0, -0.22, 0.687);
  bear.add(chestLogo);

  const leftLeg = ellipsoid(fur, [0.36, 0.56, 0.39]);
  leftLeg.position.set(-0.43, -1.02, 0.02);
  leftLeg.rotation.z = -0.08;
  const rightLeg = ellipsoid(fur, [0.36, 0.56, 0.39]);
  rightLeg.position.set(0.43, -1.02, 0.02);
  rightLeg.rotation.z = 0.08;
  bear.add(leftLeg, rightLeg);

  ([
    [leftLeg, -1],
    [rightLeg, 1],
  ] as const).forEach(([leg, sign]) => {
    const pad = ellipsoid(furLight, [0.23, 0.13, 0.08], 36);
    pad.position.set(sign * 0.02, -0.18, 0.37);
    leg.add(pad);
  });

  const head = new THREE.Group();
  head.position.set(0, 1.05, 0.06);
  bear.add(head);

  const skull = ellipsoid(fur, [0.73, 0.7, 0.63]);
  head.add(skull);

  [-1, 1].forEach((sign) => {
    const ear = ellipsoid(fur, [0.29, 0.29, 0.2], 40);
    ear.position.set(sign * 0.52, 0.46, -0.01);
    head.add(ear);
    const inner = ellipsoid(furLight, [0.16, 0.17, 0.07], 36);
    inner.position.set(sign * 0.52, 0.46, 0.19);
    head.add(inner);
  });

  const muzzle = ellipsoid(furLight, [0.5, 0.34, 0.25]);
  muzzle.position.set(0, -0.2, 0.57);
  head.add(muzzle);

  const nose = ellipsoid(ink, [0.14, 0.1, 0.09], 36);
  nose.position.set(0, -0.13, 0.81);
  head.add(nose);

  const smile = tube(
    [
      new THREE.Vector3(-0.19, -0.31, 0.79),
      new THREE.Vector3(0, -0.49, 0.84),
      new THREE.Vector3(0.19, -0.31, 0.79),
    ],
    0.022,
    ink,
  );
  head.add(smile);

  const createEye = (sign: number): THREE.Mesh => {
    const eye = ellipsoid(ink, [0.095, 0.135, 0.065], 36);
    eye.position.set(sign * 0.3, 0.12, 0.59);
    const glint = ellipsoid(eyeHighlight, [0.025, 0.031, 0.017], 20);
    glint.position.set(-0.022, 0.043, 0.063);
    eye.add(glint);
    head.add(eye);
    return eye;
  };

  const leftEye = createEye(-1);
  const rightEye = createEye(1);

  const leftBrow = tube(
    [
      new THREE.Vector3(-0.42, 0.32, 0.58),
      new THREE.Vector3(-0.3, 0.38, 0.64),
      new THREE.Vector3(-0.18, 0.32, 0.58),
    ],
    0.018,
    furDark,
  );
  const rightBrow = tube(
    [
      new THREE.Vector3(0.18, 0.32, 0.58),
      new THREE.Vector3(0.3, 0.38, 0.64),
      new THREE.Vector3(0.42, 0.32, 0.58),
    ],
    0.018,
    furDark,
  );
  head.add(leftBrow, rightBrow);

  const createArm = (sign: number): ArmRig => {
    const shoulder = new THREE.Group();
    shoulder.position.set(sign * 0.7, 0.43, 0.02);

    const upper = ellipsoid(fur, [0.27, 0.55, 0.28]);
    upper.position.set(0, -0.43, 0);
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.83, 0);
    shoulder.add(elbow);

    const forearm = ellipsoid(fur, [0.24, 0.48, 0.26]);
    forearm.position.set(0, -0.36, 0.02);
    elbow.add(forearm);

    const paw = ellipsoid(fur, [0.3, 0.29, 0.29]);
    paw.position.set(0, -0.73, 0.08);
    elbow.add(paw);

    bear.add(shoulder);
    return { shoulder, elbow, paw };
  };

  const leftArm = createArm(-1);
  const rightArm = createArm(1);

  const hat = new THREE.Group();
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.1, 48), hatDark);
  brim.castShadow = true;
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.43, 0.55, 48), blue);
  crown.position.y = 0.31;
  crown.castShadow = true;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.435, 0.435, 0.13, 48), red);
  band.position.y = 0.105;
  band.castShadow = true;
  const hatHighlight = new THREE.Mesh(
    new THREE.TorusGeometry(0.365, 0.018, 10, 48, Math.PI * 0.78),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.34 }),
  );
  hatHighlight.rotation.x = Math.PI / 2;
  hatHighlight.rotation.z = 0.18;
  hatHighlight.position.set(-0.06, 0.47, 0.03);
  hat.add(brim, crown, band, hatHighlight);
  hat.position.set(0, 1.75, 0.04);
  hat.rotation.x = 0.06;
  bear.add(hat);

  const animateBear = (rawTime: number): void => {
    const time = Math.min(DURATION_SECONDS, Math.max(0, rawTime));
    const entrance = easeOutBack(segment(time, 0, 0.62));
    const hop = Math.sin(Math.PI * smooth(segment(time, 0.38, 1.05)));
    const breathe = Math.sin((time / 2.2) * Math.PI * 2) * 0.012;
    const reach = smooth(segment(time, 0.98, 1.68));
    const reachFirst = smooth(segment(time, 0.98, 1.3));
    const reachSecond = smooth(segment(time, 1.3, 1.68));
    const lift = smooth(segment(time, 1.82, 2.78));
    const bow = pulse(time, 2.45, 2.95, 3.48);
    const settle = smooth(segment(time, 4.2, 5.1));

    bear.scale.setScalar(lerp(0.74, 1, entrance));
    bear.scale.y *= 1 + breathe;
    bear.position.set(0, -0.4 + lerp(-0.48, 0, entrance) + hop * 0.17, 0);
    bear.rotation.set(0, lerp(-0.12, 0.03, entrance) - bow * 0.06, bow * -0.055);

    body.scale.y = 1.02 * (1 - hop * 0.035 + breathe);
    body.scale.x = 0.86 * (1 + hop * 0.025);
    belly.scale.x = 0.54;
    belly.scale.y = 0.68 * (1 - hop * 0.025 + breathe * 0.7);
    belly.scale.z = 0.13;

    const wink = Math.sin(Math.PI * smooth(segment(time, 0.72, 0.9)));
    rightEye.scale.y = 0.135 * Math.max(0.08, 1 - wink * 0.94);
    leftEye.scale.y = 0.135;
    rightBrow.rotation.z = wink * -0.13;

    head.rotation.set(bow * 0.08, lift * -0.08, bow * 0.11 - reach * 0.035);
    head.position.set(0, 1.05 + hop * 0.025, 0.06);
    head.scale.setScalar(1);

    leftArm.shoulder.rotation.set(0, 0, -0.2 + hop * 0.05);
    leftArm.elbow.rotation.set(0, 0, 0.16);

    const wave =
      Math.sin(segment(time, 3.05, 4.15) * Math.PI * 3) * pulse(time, 2.95, 3.5, 4.28);
    const reachingShoulderAngle = lerp(lerp(0.18, 2, reachFirst), 2.75, reachSecond);
    const heldShoulderAngle = lerp(reachingShoulderAngle, 2.2, lift);
    const reachingElbowAngle = lerp(lerp(-0.1, 1.2, reachFirst), 0.85, reachSecond);
    const heldElbowAngle = lerp(reachingElbowAngle, 1.26, lift);
    rightArm.shoulder.position.z = lerp(0.02, 0.42, reach);
    rightArm.shoulder.rotation.set(
      lerp(0, -0.12, lift),
      lerp(0, 0.08, lift),
      heldShoulderAngle + wave * 0.055,
    );
    rightArm.elbow.rotation.set(0, 0, heldElbowAngle - wave * 0.025);
    rightArm.paw.rotation.z = lerp(0, 0.16, lift);

    // The hat stays attached until the paw reaches it, then follows the hand.
    hat.position.set(
      lerp(0, 1.17, lift),
      lerp(1.75, 1.53, lift) + wave * 0.055,
      lerp(0.04, 0.58, lift),
    );
    hat.rotation.set(
      lerp(0.06, -0.32, lift),
      lerp(0, -0.24, lift),
      lerp(0, -0.48, lift) + wave * 0.14,
    );
    hat.scale.setScalar(1 - settle * 0.008);

    leftLeg.rotation.z = -0.08 - hop * 0.04;
    rightLeg.rotation.z = 0.08 + hop * 0.04;
  };

  let disposed = false;
  let ready = false;
  let contextLost = false;
  let manuallyPaused = false;
  let inView = false;
  let pageVisible = document.visibilityState === "visible";
  let finalPoseLocked = false;
  let elapsedMilliseconds = 0;
  let lastFrameMilliseconds = 0;
  let animationFrame = 0;
  let activeInteraction: ActiveBearInteraction | null = null;

  const applyInteraction = (now: number): void => {
    if (!activeInteraction) return;

    const progress = clamp01(
      (now - activeInteraction.startedAt) / INTERACTION_DURATION_MILLISECONDS,
    );
    if (progress >= 1) {
      activeInteraction = null;
      return;
    }

    const envelope = Math.sin(progress * Math.PI);
    const wiggle = Math.sin(progress * Math.PI * 6) * envelope;

    switch (activeInteraction.target) {
      case "head":
        // A soft lean and side-to-side nuzzle, layered on top of the hat animation.
        head.rotation.y += wiggle * 0.045;
        head.rotation.z += -0.16 * envelope + wiggle * 0.035;
        head.position.x -= 0.1 * envelope;
        head.position.y -= 0.035 * envelope;
        head.scale.set(1 + envelope * 0.025, 1 - envelope * 0.015, 1 + envelope * 0.025);
        break;
      case "belly":
        belly.scale.x *= 1 + envelope * 0.13 + wiggle * 0.025;
        belly.scale.y *= 1 - envelope * 0.08;
        bear.rotation.z += wiggle * 0.025;
        break;
      case "leftArm":
        leftArm.shoulder.rotation.z = lerp(
          leftArm.shoulder.rotation.z,
          -1.32,
          envelope,
        );
        leftArm.elbow.rotation.z -= envelope * 0.24 + wiggle * 0.08;
        break;
      case "rightArm":
        rightArm.shoulder.rotation.z += envelope * 0.16;
        rightArm.elbow.rotation.z += envelope * 0.18 + wiggle * 0.11;
        rightArm.paw.rotation.z += wiggle * 0.15;
        break;
    }
  };

  const renderAt = (seconds: number, now = performance.now()): void => {
    if (disposed || contextLost) return;
    animateBear(seconds);
    applyInteraction(now);
    renderer.render(scene, camera);
  };

  const stopAnimationFrame = (): void => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastFrameMilliseconds = 0;
  };

  const shouldAnimate = (): boolean =>
    ready &&
    !disposed &&
    !contextLost &&
    inView &&
    pageVisible &&
    (activeInteraction !== null || (!manuallyPaused && !finalPoseLocked));

  const tick = (now: number): void => {
    animationFrame = 0;
    if (!shouldAnimate()) return;

    if (lastFrameMilliseconds === 0) lastFrameMilliseconds = now;
    const frameDelta = Math.min(100, Math.max(0, now - lastFrameMilliseconds));
    lastFrameMilliseconds = now;
    if (!manuallyPaused && !finalPoseLocked) {
      elapsedMilliseconds = (elapsedMilliseconds + frameDelta) % LOOP_MILLISECONDS;
    }

    renderAt(
      finalPoseLocked
        ? DURATION_SECONDS
        : pingPongTime(elapsedMilliseconds / 1000),
      now,
    );

    if (shouldAnimate()) animationFrame = requestAnimationFrame(tick);
  };

  const updatePlayback = (): void => {
    if (shouldAnimate()) {
      if (!animationFrame) animationFrame = requestAnimationFrame(tick);
    } else {
      stopAnimationFrame();
    }
  };

  const resize = (): void => {
    if (disposed || contextLost) return;
    const width = Math.max(1, Math.round(container.clientWidth));
    const height = Math.max(1, Math.round(container.clientHeight));
    const aspect = width / height;
    const halfHeight = Math.max(2.55, 2.65 / Math.max(aspect, 0.5));

    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, width < 640 ? 1.35 : 1.75),
    );
    renderer.setSize(width, height, false);
    renderAt(
      finalPoseLocked
        ? DURATION_SECONDS
        : pingPongTime(elapsedMilliseconds / 1000),
    );
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      inView = Boolean(entry?.isIntersecting);
      updatePlayback();
    },
    { threshold: 0.08 },
  );
  intersectionObserver.observe(container);

  const handleVisibilityChange = (): void => {
    pageVisible = document.visibilityState === "visible";
    updatePlayback();
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);

  const handleContextLost = (event: Event): void => {
    event.preventDefault();
    if (disposed || contextLost) return;
    contextLost = true;
    stopAnimationFrame();
    options.onFallback?.(new Error("The WebGL context for the bear scene was lost."));
  };

  const handleContextRestored = (): void => {
    // The poster remains the durable fallback. A remount creates a fresh renderer.
    contextLost = true;
  };

  canvas.addEventListener("webglcontextlost", handleContextLost, false);
  canvas.addEventListener("webglcontextrestored", handleContextRestored, false);

  resize();
  renderAt(0);

  const logoTexture = new THREE.TextureLoader().load(
    LOGO_URL,
    (texture) => {
      if (disposed) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      chestLogoMaterial.map = texture;
      chestLogoMaterial.opacity = 1;
      chestLogoMaterial.needsUpdate = true;
      ready = true;
      renderAt(0);
      options.onReady?.();
      updatePlayback();
    },
    undefined,
    (reason) => {
      if (disposed) return;
      options.onFallback?.(asError(reason, `The same-origin logo could not be loaded from ${LOGO_URL}.`));
    },
  );
  logoTexture.colorSpace = THREE.SRGBColorSpace;

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    stopAnimationFrame();
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    canvas.removeEventListener("webglcontextlost", handleContextLost, false);
    canvas.removeEventListener("webglcontextrestored", handleContextRestored, false);

    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>([logoTexture]);

    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
      meshMaterials.forEach((material) => {
        materials.add(material);
        Object.values(material).forEach((value) => {
          if (value instanceof THREE.Texture) textures.add(value);
        });
      });
    });

    textures.forEach((texture) => texture.dispose());
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    keyLight.shadow.map?.dispose();
    scene.clear();
    renderer.renderLists.dispose();
    renderer.dispose();
    renderer.forceContextLoss();

    if (canvas.parentNode === container) container.removeChild(canvas);
  };

  return {
    dispose,
    pause: () => {
      manuallyPaused = true;
      updatePlayback();
    },
    play: () => {
      manuallyPaused = false;
      finalPoseLocked = false;
      updatePlayback();
    },
    react: (target) => {
      activeInteraction = {
        startedAt: performance.now(),
        target,
      };
      updatePlayback();
    },
    renderFinalPose: () => {
      elapsedMilliseconds = DURATION_SECONDS * 1000;
      finalPoseLocked = true;
      stopAnimationFrame();
      renderAt(DURATION_SECONDS);
    },
  };
}
