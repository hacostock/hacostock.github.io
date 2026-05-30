// HacoStock — hero background
// "漂う箱": numbered-feel cardboard boxes drifting in 3D space, one softly glowing.
// Lightweight, theme-aware, pauses when off-screen, honors reduced-motion.

import * as THREE from "three";

const canvas = document.querySelector(".hero-canvas");
if (canvas) {
  try {
    initHeroBg(canvas);
  } catch (e) {
    // Fail silently — the page is fully usable without the background.
    canvas.style.display = "none";
  }
}

function initHeroBg(canvas) {
  // WebGL feature detection.
  let probe;
  try {
    probe = canvas.getContext("webgl2") || canvas.getContext("webgl");
  } catch (e) {
    probe = null;
  }
  if (!probe) {
    canvas.style.display = "none";
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 15);

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const key = new THREE.DirectionalLight(0xffffff, 1.05);
  key.position.set(5, 8, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(-6, -3, 4);
  scene.add(fill);

  function themeColors() {
    const s = getComputedStyle(document.documentElement);
    // Preview build: force the dark "scan/glow" palette regardless of system theme,
    // with cooler box tones to match the deep-navy page background.
    const dark = true;
    return {
      dark,
      accent: new THREE.Color((s.getPropertyValue("--accent").trim()) || "#ff7a45"),
      box: new THREE.Color("#1b2336"),
      edge: new THREE.Color("#3a4a66"),
      label: new THREE.Color("#cdd9ef"),
    };
  }
  let theme = themeColors();

  const group = new THREE.Group();
  scene.add(group);

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const edgeGeo = new THREE.EdgesGeometry(boxGeo);

  // A small "management number" sticker on one face — echoes the app's job of
  // tracking numbered inventory. Drawn white on a transparent canvas so the
  // material's color can tint it (and theme updates can re-tint it).
  const labelGeo = new THREE.PlaneGeometry(0.62, 0.62);
  function makeLabelTexture(text) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 128, 128);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 42px ui-monospace, 'SF Mono', Menlo, monospace";
    ctx.fillText(text, 64, 68);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
  }

  const COUNT = 26;
  const boxes = [];
  let highlight = null;

  for (let i = 0; i < COUNT; i++) {
    const isHi = i === 0;
    const mat = new THREE.MeshStandardMaterial({
      color: isHi ? theme.accent.clone() : theme.box.clone(),
      roughness: 0.85,
      metalness: 0.0,
      transparent: true,
      opacity: isHi ? 0.95 : 0.5,
      emissive: isHi ? theme.accent.clone() : new THREE.Color(0x000000),
      emissiveIntensity: isHi ? 0.6 : 0,
    });
    const mesh = new THREE.Mesh(boxGeo, mat);

    const lineMat = new THREE.LineBasicMaterial({
      color: isHi ? theme.accent.clone() : theme.edge.clone(),
      transparent: true,
      opacity: isHi ? 0.9 : 0.45,
    });
    mesh.add(new THREE.LineSegments(edgeGeo, lineMat)); // children[0] = outline

    // children[1] = the numbered label, sat just proud of the front face.
    const labelMat = new THREE.MeshBasicMaterial({
      map: makeLabelTexture("#" + String(i + 1).padStart(3, "0")),
      transparent: true,
      opacity: isHi ? 1.0 : 0.4,
      color: isHi ? theme.accent.clone() : theme.label.clone(),
      depthWrite: false,
    });
    const labelPlane = new THREE.Mesh(labelGeo, labelMat);
    labelPlane.position.z = 0.505;
    mesh.add(labelPlane);

    const scale = isHi ? 1.7 : 0.7 + Math.random() * 0.9;
    mesh.scale.setScalar(scale);
    mesh.position.set(
      (Math.random() - 0.5) * 24,
      (Math.random() - 0.5) * 13,
      (Math.random() - 0.5) * 10 - 2
    );
    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    mesh.userData = {
      rotSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.14,
        (Math.random() - 0.5) * 0.14,
        (Math.random() - 0.5) * 0.14
      ),
      floatPhase: Math.random() * Math.PI * 2,
      floatAmp: 0.3 + Math.random() * 0.5,
      baseY: mesh.position.y,
    };
    group.add(mesh);
    boxes.push(mesh);
    if (isHi) highlight = mesh;
  }

  // Place the glowing "found" box in the open band above the headline —
  // clear of the phone mockup (right column) and the body copy (left column),
  // pulled slightly toward the camera and given a calm float so it stays put.
  highlight.position.set(-2.2, 4.0, 3.4);
  highlight.scale.setScalar(1.8);
  highlight.userData.baseY = highlight.position.y;
  highlight.userData.floatAmp = 0.26;
  highlight.userData.rotSpeed.set(0.05, 0.07, 0.03);

  function applyTheme() {
    theme = themeColors();
    for (const m of boxes) {
      const isHi = m === highlight;
      m.material.color.copy(isHi ? theme.accent : theme.box);
      if (isHi) m.material.emissive.copy(theme.accent);
      m.children[0].material.color.copy(isHi ? theme.accent : theme.edge); // outline
      if (m.children[1]) m.children[1].material.color.copy(isHi ? theme.accent : theme.label); // label
    }
  }
  const darkMq = window.matchMedia("(prefers-color-scheme: dark)");
  if (darkMq.addEventListener) darkMq.addEventListener("change", applyTheme);

  // Subtle pointer parallax.
  let targetX = 0, targetY = 0, curX = 0, curY = 0;
  window.addEventListener(
    "pointermove",
    (e) => {
      targetX = e.clientX / window.innerWidth - 0.5;
      targetY = e.clientY / window.innerHeight - 0.5;
    },
    { passive: true }
  );

  function resize() {
    const w = canvas.clientWidth || canvas.offsetWidth;
    const h = canvas.clientHeight || canvas.offsetHeight;
    if (!w || !h) return;
    if (canvas.width !== Math.floor(w * renderer.getPixelRatio()) ||
        canvas.height !== Math.floor(h * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }

  const clock = new THREE.Clock();
  let rafId = null;

  function frame() {
    const t = clock.getElapsedTime();
    for (const m of boxes) {
      const d = m.userData;
      m.rotation.x += d.rotSpeed.x * 0.016;
      m.rotation.y += d.rotSpeed.y * 0.016;
      m.rotation.z += d.rotSpeed.z * 0.016;
      m.position.y = d.baseY + Math.sin(t * 0.5 + d.floatPhase) * d.floatAmp;
    }
    highlight.material.emissiveIntensity = 0.5 + Math.sin(t * 1.6) * 0.25;

    curX += (targetX - curX) * 0.04;
    curY += (targetY - curY) * 0.04;
    group.rotation.y = curX * 0.25;
    group.rotation.x = curY * 0.15;

    resize();
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });

  if (reduceMotion) {
    renderer.render(scene, camera); // single static frame
    return;
  }

  // Only animate while the hero is on-screen.
  const hero = canvas.closest(".hero") || canvas.parentElement;
  if ("IntersectionObserver" in window && hero) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            if (!rafId) rafId = requestAnimationFrame(frame);
          } else if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        }
      },
      { threshold: 0 }
    );
    io.observe(hero);
  } else {
    rafId = requestAnimationFrame(frame);
  }
}
