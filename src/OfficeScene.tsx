import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import {
  Monitor,
  BookOpen,
  Coffee,
  MousePointer2,
  RotateCcw,
  Move,
  Eye,
} from "lucide-react";
type ObjectId = "computer" | "notebook" | "coffee";
type Props = { onInteract: (id: ObjectId) => void; paused: boolean };
const objectNames: Record<ObjectId, string> = {
  computer: "Usar tu ordenador",
  notebook: "Leer libreta de bienvenida",
  coffee: "Usar máquina de café",
};
let rememberedPose = { x: 0, z: -0.55, yaw: 0, pitch: -0.1 };
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function makeTexture(
  kind: "plaster" | "wood" | "plastic" | "metal" | "carpet",
  color: string,
  seed: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 128, 128);
  const random = rng(seed);
  const pixels = ctx.getImageData(0, 0, 128, 128);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const n =
      (random() - 0.5) * (kind === "carpet" ? 15 : kind === "plaster" ? 10 : 8);
    for (let j = 0; j < 3; j++)
      pixels.data[i + j] = Math.max(0, Math.min(255, pixels.data[i + j] + n));
  }
  ctx.putImageData(pixels, 0, 0);
  // Broad wear patches avoid the old high-frequency checkerboard appearance.
  for (let i = 0; i < 6; i++) {
    const x = random() * 128,
      y = random() * 128,
      r = 12 + random() * 42;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, "rgba(33,29,22,0.10)");
    gradient.addColorStop(1, "rgba(33,29,22,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  }

  for (let i = 0; i < 45; i++) {
    ctx.strokeStyle = `rgba(${kind === "wood" ? "41,28,20" : "15,20,23"},${random() * 0.15})`;
    ctx.lineWidth = kind === "wood" ? 1 : random() * 2;
    ctx.beginPath();
    let x = random() * 128,
      y = random() * 128;
    ctx.moveTo(x, y);
    ctx.lineTo(
      kind === "wood" ? x + random() * 90 : x + random() * 10,
      kind === "wood" ? y + random() * 2 : y + random() * 18,
    );
    ctx.stroke();
  }
  if (kind === "plastic") {
    ctx.fillStyle = "#a29d8520";
    for (let i = 0; i < 25; i++)
      ctx.fillRect(random() * 128, random() * 128, random() * 15, 1);
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function printTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d")!);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.LinearFilter;
  return t;
}
function createOffice(scene: THREE.Scene) {
  const textures: THREE.Texture[] = [];
  function material(
    kind: Parameters<typeof makeTexture>[0],
    color: string,
    seed: number,
  ) {
    const map = makeTexture(kind, color, seed);
    textures.push(map);
    return new THREE.MeshStandardMaterial({
      map,
      roughness: kind === "metal" ? 0.7 : 0.95,
      metalness: kind === "metal" ? 0.22 : 0,
      flatShading: true,
    });
  }
  const wall = material("plaster", "#a7adb0", 1),
    wood = material("wood", "#7b7366", 2),
    plastic = material("plastic", "#bdbbaa", 3),
    dark = material("plastic", "#252c30", 4),
    metal = material("metal", "#5c6366", 5),
    fabric = material("carpet", "#3f4a56", 6),
    paper = material("plaster", "#d0cab4", 7),
    green = material("plastic", "#405b46", 8),
    warmPlastic = material("plastic", "#998d77", 9);
  function box(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat: THREE.Material,
    parent: THREE.Object3D = scene,
  ) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function cylinder(
    rt: number,
    rb: number,
    h: number,
    x: number,
    y: number,
    z: number,
    mat: THREE.Material,
    parent: THREE.Object3D = scene,
    segments = 12,
  ) {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(rt, rb, h, segments),
      mat,
    );
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function label(
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    draw: (c: CanvasRenderingContext2D) => void,
    parent: THREE.Object3D = scene,
  ) {
    const t = printTexture(256, Math.round((256 * h) / w), draw);
    textures.push(t);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: t }),
    );
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }
  function cable(points: THREE.Vector3[], radius = 0.012) {
    const m = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        18,
        radius,
        5,
        false,
      ),
      dark,
    );
    scene.add(m);
    return m;
  }
  // Room: worn plaster, exposed skirting, carpet tiles, and fluorescent panels.
  const floorTexture = makeTexture("carpet", "#565e68", 20);
  textures.push(floorTexture);
  floorTexture.repeat.set(12, 14);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 12),
    new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -1);
  floor.receiveShadow = true;
  scene.add(floor);
  box(10, 3.2, 0.15, 0, 1.6, -6.8, wall);
  box(0.15, 3.2, 12, -5, 1.6, -0.8, wall);
  box(0.15, 3.2, 12, 5, 1.6, -0.8, wall);
  box(10, 0.1, 12, 0, 3.23, -0.8, material("plaster", "#9ca5a8", 24));
  box(10, 0.15, 0.08, 0, 0.08, -6.68, dark);
  box(0.08, 0.15, 12, -4.88, 0.08, -0.8, dark);
  box(0.08, 0.15, 12, 4.88, 0.08, -0.8, dark);
  for (let x = -4.5; x < 5; x++)
    for (let z = -6.5; z < 5; z++) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(0.008, 1),
        new THREE.MeshBasicMaterial({
          color: "#343e4b",
          transparent: true,
          opacity: 0.3,
        }),
      );
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.003, z);
      scene.add(m);
    }
  const glow = new THREE.MeshBasicMaterial({ color: "#bccbd0" });
  for (let z of [-4, 1]) {
    box(1.8, 0.05, 0.6, 0, 3.15, z, metal);
    box(1.65, 0.02, 0.47, 0, 3.11, z, glow);
  }
  // Rainy city through a broad window on the left wall.
  const city = printTexture(256, 192, (c) => {
    c.fillStyle = "#516473";
    c.fillRect(0, 0, 256, 192);
    const r = rng(29);
    for (let i = 0; i < 16; i++) {
      let x = i * 19,
        y = 40 + r() * 80;
      c.fillStyle = i % 2 ? "#344454" : "#405566";
      c.fillRect(x, y, 17, 192 - y);
      for (let a = y + 8; a < 192; a += 12)
        for (let b = x + 3; b < x + 17; b += 6) {
          c.fillStyle = r() > 0.7 ? "#bab08a" : "#677d85";
          c.fillRect(b, a, 2, 4);
        }
    }
    for (let i = 0; i < 160; i++) {
      c.strokeStyle = "#b1c0c02b";
      c.beginPath();
      let x = r() * 256,
        y = r() * 192;
      c.moveTo(x, y);
      c.lineTo(x - 4, y + 22);
      c.stroke();
    }
  });
  textures.push(city);
  const windowGroup = new THREE.Group();
  windowGroup.position.set(-4.87, 1.92, -3.2);
  windowGroup.rotation.y = Math.PI / 2;
  scene.add(windowGroup);
  box(3.2, 1.8, 0.08, 0, 0, 0, dark, windowGroup);
  const pane = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 1.6),
    new THREE.MeshBasicMaterial({ map: city }),
  );
  pane.position.z = 0.05;
  windowGroup.add(pane);
  for (let x of [-1.55, 0, 1.55])
    box(0.07, 1.8, 0.08, x, 0, 0.08, metal, windowGroup);
  box(3.3, 0.07, 0.1, 0, 0, 0.08, metal, windowGroup);
  box(3.5, 0.12, 0.4, 0, -0.94, 0.15, plastic, windowGroup);
  for (let y = 2.72; y > 2.1; y -= 0.12)
    box(0.35, 0.055, 3.1, -4.6, y, -3.2, warmPlastic);
  // Background cabinets, boxes, wall notes and clock.
  box(1.4, 1.5, 0.22, 3.95, 0.75, -6.2, metal);
  for (let y of [0.32, 0.78, 1.23]) {
    box(1.32, 0.4, 0.03, 3.95, y, -5.86, metal);
    box(0.22, 0.03, 0.05, 3.95, y, -5.82, dark);
  }
  box(0.22, 0.5, 0.55, 3.65, 1.77, -6.2, wood);
  label(0.53, 0.15, 3.65, 1.75, -5.918, (c) => {
    c.fillStyle = "#b7b099";
    c.fillRect(0, 0, 256, 73);
    c.fillStyle = "#444843";
    c.font = "26px monospace";
    c.fillText("ARCHIVO / 03", 15, 45);
  });
  box(1.6, 1.1, 0.05, -0.9, 1.95, -6.65, wood);
  for (let i = 0; i < 7; i++) {
    const p = box(
      0.24,
      0.28,
      0.01,
      -1.4 + (i % 4) * 0.32,
      1.73 + Math.floor(i / 4) * 0.38,
      -6.6,
      i % 2 ? paper : warmPlastic,
    );
    p.rotation.z = ((i % 3) - 1) * 0.12;
  }
  label(1.1, 0.26, 1.08, 2.55, -6.65, (c) => {
    c.fillStyle = "#aab0b0";
    c.fillRect(0, 0, 256, 60);
    c.fillStyle = "#3b474d";
    c.font = "bold 38px monospace";
    c.fillText("forma®", 25, 43);
  });
  const clock = cylinder(0.23, 0.23, 0.05, 2.42, 2.52, -6.55, plastic);
  clock.rotation.x = Math.PI / 2;
  label(0.41, 0.41, 2.42, 2.52, -6.515, (c) => {
    c.fillStyle = "#d0cfbf";
    c.fillRect(0, 0, 256, 256);
    c.strokeStyle = "#434d50";
    c.lineWidth = 8;
    c.beginPath();
    c.arc(128, 128, 111, 0, Math.PI * 2);
    c.stroke();
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(128, 128);
    c.lineTo(128, 67);
    c.moveTo(128, 128);
    c.lineTo(173, 141);
    c.stroke();
    c.font = "18px monospace";
    c.fillStyle = "#4b5659";
    c.fillText("12", 116, 40);
  });
  // Main desk and older CRT workstation.
  box(3.3, 0.12, 1.65, 0, 0.86, -2.15, wood);
  for (let x of [-1.4, 1.4]) {
    box(0.08, 0.83, 0.09, x, 0.41, -2.7, metal);
    box(0.08, 0.83, 0.09, x, 0.41, -1.55, metal);
    box(0.1, 0.05, 1.3, x, 0.08, -2.13, metal);
  }
  box(0.7, 0.06, 0.47, 0, 0.97, -2.43, plastic);
  box(0.16, 0.18, 0.16, 0, 1.08, -2.44, plastic);
  const computer = new THREE.Group();
  computer.userData.interaction = "computer";
  scene.add(computer);
  box(1.36, 1.08, 0.75, 0, 1.65, -2.55, plastic, computer);
  box(1.28, 1.02, 0.14, 0, 1.65, -2.105, plastic, computer);
  box(1.08, 0.81, 0.07, 0, 1.72, -2.015, dark, computer);
  const screen = label(
    0.99,
    0.72,
    0,
    1.72,
    -1.973,
    (c) => {
      c.fillStyle = "#14252c";
      c.fillRect(0, 0, 256, 186);
      c.fillStyle = "#33504e";
      c.fillRect(0, 0, 256, 16);
      c.font = "9px monospace";
      c.fillStyle = "#a4c8c3";
      c.fillText("FORMA OS                      09:07", 9, 11);
      c.font = "bold 26px monospace";
      c.fillStyle = "#bed7cf";
      c.fillText("forma", 29, 58);
      c.font = "10px monospace";
      c.fillStyle = "#8ba9ad";
      c.fillText("junior@forma:~", 29, 78);
      c.fillStyle = "#344b4d";
      c.fillRect(23, 95, 207, 65);
      c.font = "9px monospace";
      c.fillStyle = "#c1d29a";
      c.fillText("MARTA / 1 MENSAJE NUEVO", 33, 112);
      c.fillStyle = "#a4b6bb";
      c.fillText("Te dejamos algo sencillito.", 33, 132);
      c.fillText("Pulsa E para empezar.", 33, 148);
      c.fillStyle = "#778f85";
      c.fillRect(0, 169, 256, 17);
      c.fillStyle = "#273b37";
      c.fillRect(9, 173, 31, 8);
    },
    computer,
  );
  screen.userData.interaction = "computer";
  label(
    0.21,
    0.05,
    0,
    1.22,
    -2.022,
    (c) => {
      c.fillStyle = "#b5b3a3";
      c.fillRect(0, 0, 256, 61);
      c.fillStyle = "#5b6664";
      c.font = "bold 35px monospace";
      c.fillText("FORMA", 52, 42);
    },
    computer,
  );
  box(0.07, 0.035, 0.018, 0.47, 1.23, -2.019, dark, computer);
  const led = new THREE.Mesh(
    new THREE.SphereGeometry(0.009, 5, 4),
    new THREE.MeshBasicMaterial({ color: "#abc687" }),
  );
  led.position.set(0.515, 1.23, -2.0);
  computer.add(led);
  for (let i = 0; i < 9; i++)
    box(0.011, 0.6, 0.012, -0.686, 1.64, -2.55 + i * 0.04, dark, computer);
  // Keyboard with individual keys, mouse and cables.
  const keyboard = new THREE.Group();
  keyboard.position.set(0, 0.96, -1.42);
  keyboard.rotation.x = 0.05;
  scene.add(keyboard);
  box(1.03, 0.08, 0.35, 0, 0, 0, plastic, keyboard);
  for (let row = 0; row < 5; row++)
    for (let col = 0; col < 14; col++) {
      box(
        0.054,
        0.023,
        0.041,
        -0.45 + col * 0.065,
        0.055,
        -0.13 + row * 0.058,
        row === 4 && col > 3 && col < 9 ? warmPlastic : plastic,
        keyboard,
      );
    }
  box(0.27, 0.025, 0.04, -0.06, 0.058, 0.1, warmPlastic, keyboard);
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), plastic);
  mouse.scale.set(0.8, 0.45, 1.4);
  mouse.position.set(0.88, 0.99, -1.42);
  scene.add(mouse);
  box(0.22, 0.013, 0.3, 0.9, 0.932, -1.45, fabric);
  cable([
    new THREE.Vector3(0.87, 0.99, -1.5),
    new THREE.Vector3(1, 0.95, -1.7),
    new THREE.Vector3(0.6, 0.95, -2.15),
  ]);
  cable([
    new THREE.Vector3(0, 0.96, -1.55),
    new THREE.Vector3(-0.25, 0.94, -1.8),
    new THREE.Vector3(-0.75, 0.93, -2.4),
  ]);
  box(0.45, 0.63, 0.75, 1.14, 0.37, -2.25, plastic);
  box(0.4, 0.11, 0.02, 1.14, 0.59, -1.866, dark);
  box(0.39, 0.02, 0.02, 1.14, 0.5, -1.864, metal);
  // Telephone: display, keypad, receiver and coiled lead.
  const phone = new THREE.Group();
  phone.position.set(-1.05, 0.95, -1.73);
  phone.rotation.y = 0.23;
  scene.add(phone);
  box(0.44, 0.085, 0.6, 0, 0, 0, plastic, phone);
  box(0.3, 0.045, 0.2, 0.05, 0.09, -0.16, plastic, phone);
  label(
    0.19,
    0.07,
    0.065,
    0.115,
    -0.13,
    (c) => {
      c.fillStyle = "#73887c";
      c.fillRect(0, 0, 256, 94);
      c.fillStyle = "#324b40";
      c.font = "31px monospace";
      c.fillText("09:07", 34, 65);
    },
    phone,
  ).rotation.x = -Math.PI / 2;
  for (let r = 0; r < 4; r++)
    for (let col = 0; col < 3; col++) {
      const key = cylinder(
        0.024,
        0.025,
        0.019,
        -0.045 + col * 0.069,
        0.063,
        -0.04 + r * 0.069,
        warmPlastic,
        phone,
        8,
      );
      key.rotation.x = 0;
    }
  box(0.085, 0.06, 0.5, -0.17, 0.09, -0.015, warmPlastic, phone);
  box(0.12, 0.07, 0.09, -0.17, 0.11, -0.24, warmPlastic, phone);
  box(0.12, 0.07, 0.09, -0.17, 0.11, 0.22, warmPlastic, phone);
  const cord: THREE.Vector3[] = [];
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 18;
    cord.push(
      new THREE.Vector3(
        -1.32 + Math.sin(a) * 0.035,
        0.945 + Math.cos(a) * 0.025,
        -1.45 - i * 0.006,
      ),
    );
  }
  cable(cord, 0.008);
  // Notebook, a pen, paperwork, mug and desk lamp.
  const notebook = new THREE.Group();
  notebook.userData.interaction = "notebook";
  notebook.position.set(0.98, 0.952, -2.4);
  notebook.rotation.y = -0.16;
  scene.add(notebook);
  box(0.42, 0.035, 0.52, 0, 0, 0, green, notebook);
  const cover = label(
    0.38,
    0.48,
    0,
    0.024,
    0,
    (c) => {
      c.fillStyle = "#4d6555";
      c.fillRect(0, 0, 256, 323);
      c.fillStyle = "#c1c5a6";
      c.font = "bold 33px monospace";
      c.fillText("DON'T", 27, 120);
      c.fillText("PANIC.", 27, 161);
      c.font = "13px monospace";
      c.fillText("NOTAS DEL JUNIOR", 27, 263);
    },
    notebook,
  );
  cover.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 8; i++)
    box(0.045, 0.025, 0.012, -0.215, 0.019, -0.2 + i * 0.058, metal, notebook);
  box(0.025, 0.018, 0.35, 1.27, 0.954, -2.4, dark).rotation.y = 0.2;
  for (let i = 0; i < 4; i++) {
    const p = box(0.45, 0.004, 0.35, -0.93, 0.947 + i * 0.009, -2.6, paper);
    p.rotation.y = i * 0.04;
  }
  const sheet = label(0.38, 0.28, -0.92, 0.985, -2.6, (c) => {
    c.fillStyle = "#cac9b4";
    c.fillRect(0, 0, 256, 188);
    c.fillStyle = "#69716b";
    c.font = "bold 17px monospace";
    c.fillText("TU PRIMER DIA", 20, 33);
    c.font = "12px monospace";
    for (let i = 0; i < 6; i++)
      c.fillText(
        [
          "Leer el ticket",
          "Abrir el proyecto",
          "Reproducir el error",
          "Pedir ayuda",
          "Guardar el cambio",
          "Volver a probar",
        ][i],
        20,
        59 + i * 18,
      );
  });
  sheet.rotation.x = -Math.PI / 2;
  cylinder(0.1, 0.085, 0.18, -0.78, 1.025, -1.26, plastic);
  cylinder(
    0.085,
    0.085,
    0.006,
    -0.78,
    1.12,
    -1.26,
    new THREE.MeshStandardMaterial({ color: "#312b23", roughness: 1 }),
  );
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.055, 0.015, 5, 10),
    plastic,
  );
  handle.position.set(-0.67, 1.036, -1.26);
  scene.add(handle);
  cylinder(0.13, 0.15, 0.035, 1.45, 0.94, -2.57, dark);
  const lampStem = box(0.035, 0.53, 0.035, 1.45, 1.2, -2.57, metal);
  lampStem.rotation.z = -0.2;
  const shade = cylinder(0.08, 0.19, 0.2, 1.36, 1.48, -2.57, metal);
  shade.rotation.z = -0.3;
  const lamp = new THREE.PointLight("#f0c99a", 1.7, 3.5, 2);
  lamp.position.set(1.36, 1.37, -2.4);
  scene.add(lamp);
  // A second workspace, chair, books and coffee corner.
  box(2, 0.1, 1.2, -3, 0.86, -4.8, wood);
  for (let x of [-3.8, -2.2]) box(0.08, 0.86, 0.08, x, 0.43, -4.6, metal);
  box(0.9, 0.7, 0.55, -3, 1.32, -5, dark);
  label(0.71, 0.51, -3, 1.35, -4.714, (c) => {
    c.fillStyle = "#223138";
    c.fillRect(0, 0, 256, 184);
    c.fillStyle = "#7c9c93";
    for (let i = 0; i < 11; i++)
      c.fillRect(15, 15 + i * 13, 30 + ((i * 29) % 180), 2);
  });
  box(0.6, 0.05, 0.2, -3, 0.96, -4.27, plastic);
  cylinder(0.34, 0.34, 0.08, -3, 0.54, -3.75, fabric);
  box(0.6, 0.55, 0.08, -3, 0.9, -3.38, fabric);
  cylinder(0.04, 0.04, 0.5, -3, 0.27, -3.75, metal);
  for (let a = 0; a < 5; a++) {
    const leg = box(
      0.45,
      0.03,
      0.045,
      -3 + Math.sin(a * 1.26) * 0.2,
      0.04,
      -3.75 + Math.cos(a * 1.26) * 0.2,
      dark,
    );
    leg.rotation.y = a * 1.26;
  }
  const coffee = new THREE.Group();
  coffee.userData.interaction = "coffee";
  scene.add(coffee);
  box(1.45, 0.9, 0.22, 3.6, 0.45, -4.7, wood, coffee);
  box(1.55, 0.075, 0.75, 3.6, 0.94, -4.7, plastic, coffee);
  box(0.55, 0.22, 0.4, 3.66, 1.3, -4.7, dark, coffee);
  box(0.42, 0.1, 0.04, 3.66, 1.52, -4.47, metal, coffee);
  box(0.25, 0.22, 0.02, 3.66, 1.29, -4.478, dark, coffee);
  cylinder(0.055, 0.05, 0.1, 3.66, 1.17, -4.42, plastic, coffee);
  label(
    0.22,
    0.075,
    3.66,
    1.52,
    -4.445,
    (c) => {
      c.fillStyle = "#748b74";
      c.fillRect(0, 0, 256, 88);
      c.fillStyle = "#2c4536";
      c.font = "25px monospace";
      c.fillText("READY", 60, 58);
    },
    coffee,
  );
  for (let i = 0; i < 3; i++)
    cylinder(0.07, 0.06, 0.11, 3.12 + i * 0.16, 1.025, -4.7, paper, coffee);
  // Door, light switch, waste basket, and notice on the workstation.
  box(0.08, 2.3, 1.35, 4.88, 1.15, 1.7, wood);
  box(0.03, 0.11, 0.03, 4.79, 1.02, 1.3, metal);
  box(0.03, 0.14, 0.09, 4.81, 1.35, 0.72, plastic);
  cylinder(0.24, 0.19, 0.45, -1.93, 0.24, -2.44, metal);
  for (let i = 0; i < 7; i++)
    box(
      0.05,
      0.07,
      0.05,
      -1.93 + Math.sin(i) * 0.11,
      0.46,
      -2.44 + Math.cos(i) * 0.11,
      paper,
    );
  const badge = label(
    0.29,
    0.1,
    -0.46,
    1.22,
    -2.014,
    (c) => {
      c.fillStyle = "#c1b393";
      c.fillRect(0, 0, 256, 88);
      c.fillStyle = "#5a5145";
      c.font = "22px monospace";
      c.fillText("JUNIOR / 001", 15, 54);
    },
    computer,
  );
  badge.rotation.z = 0.02;
  return { textures, targets: [computer, notebook, coffee] };
}
const retroShader = {
  uniforms: {
    tDiffuse: { value: null },
    strength: { value: 0.22 },
    resolution: { value: new THREE.Vector2(800, 500) },
  },
  vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `uniform sampler2D tDiffuse;uniform float strength;uniform vec2 resolution;varying vec2 vUv;
float bayer(vec2 p){vec2 a=mod(floor(p),4.0);float v=0.0;if(a.y<1.0){if(a.x<1.0)v=0.0;else if(a.x<2.0)v=8.0;else if(a.x<3.0)v=2.0;else v=10.0;}else if(a.y<2.0){if(a.x<1.0)v=12.0;else if(a.x<2.0)v=4.0;else if(a.x<3.0)v=14.0;else v=6.0;}else if(a.y<3.0){if(a.x<1.0)v=3.0;else if(a.x<2.0)v=11.0;else if(a.x<3.0)v=1.0;else v=9.0;}else{if(a.x<1.0)v=15.0;else if(a.x<2.0)v=7.0;else if(a.x<3.0)v=13.0;else v=5.0;}return (v/16.0)-0.5;}
void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float d=bayer(vUv*resolution);float n=fract(sin(dot(floor(vUv*resolution),vec2(12.9898,78.233)))*43758.5453)-.5;c+=d*.025*strength+n*.012*strength;c=mix(c,floor(c*28.0+.5)/28.0,strength*.35);float vignette=smoothstep(.18,.85,length((vUv-.5)*vec2(1.1,1.0)));c*=1.0-vignette*.25;gl_FragColor=vec4(c,1.0);}`,
};
export default function OfficeScene({ onInteract, paused }: Props) {
  const mount = useRef<HTMLDivElement>(null),
    callbacks = useRef({ onInteract, paused }),
    reset = useRef(() => {}),
    explore = useRef(() => {}),
    direct = useRef((id: ObjectId) => callbacks.current.onInteract(id)),
    setLook = useRef((dx: number, dy: number) => {}),
    movement = useRef(new Set<string>()),
    qualityRef = useRef(0.22);
  callbacks.current = { onInteract, paused };
  const [target, setTarget] = useState<ObjectId | null>("computer"),
    [failed, setFailed] = useState(false),
    [locked, setLocked] = useState(false),
    [quality, setQuality] = useState(0.22),
    [message, setMessage] = useState(
      "Arrastra para mirar. Acércate a los objetos y pulsa E.",
    ),
    [ready, setReady] = useState(false);
  useEffect(() => {
    qualityRef.current = quality;
  }, [quality]);
  useEffect(() => {
    const host = mount.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    host.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      "Oficina 3D en primera persona",
    );
    renderer.domElement.tabIndex = 0;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#252f3a");
    scene.fog = new THREE.FogExp2("#394554", 0.04);
    scene.add(new THREE.HemisphereLight("#c7d7e5", "#303b43", 1.45));
    const light = new THREE.DirectionalLight("#c1d3e8", 2.7);
    light.position.set(-4, 5, -0.5);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.camera.left = -6;
    light.shadow.camera.right = 6;
    light.shadow.camera.top = 6;
    light.shadow.camera.bottom = -6;
    light.shadow.bias = -0.001;
    scene.add(light);
    const ambient = new THREE.PointLight("#a3b6c4", 12, 12, 2);
    ambient.position.set(0, 2.8, -3);
    scene.add(ambient);
    const { textures, targets } = createOffice(scene);
    const camera = new THREE.PerspectiveCamera(58, 1, 0.05, 35);
    camera.rotation.order = "YXZ";
    let yaw = rememberedPose.yaw,
      pitch = rememberedPose.pitch;
    camera.position.set(rememberedPose.x, 1.58, rememberedPose.z);
    camera.rotation.set(pitch, yaw, 0);
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new OutputPass());
    const retro = new ShaderPass(retroShader);
    composer.addPass(retro);
    let renderWidth = 800,
      renderHeight = 500;
    const resize = () => {
      const w = Math.max(1, host.clientWidth),
        h = Math.max(1, host.clientHeight);
      renderWidth = Math.min(1280, Math.round(w * 0.9));
      renderHeight = Math.round((renderWidth * h) / w);
      renderer.setSize(renderWidth, renderHeight, false);
      composer.setSize(renderWidth, renderHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      retro.uniforms.resolution.value.set(renderWidth, renderHeight);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    const raycaster = new THREE.Raycaster(),
      point = new THREE.Vector2();
    let hovered: ObjectId | null = null,
      previousTarget: ObjectId | null = null,
      dragging = false,
      dragDistance = 0,
      lastPointer = { x: 0, y: 0 };
    let running = true,
      raf = 0,
      last = 0;
    const interaction = (object: THREE.Object3D | null): ObjectId | null => {
      let o = object;
      while (o) {
        if (o.userData.interaction) return o.userData.interaction as ObjectId;
        o = o.parent;
      }
      return null;
    };
    function aim(x = 0, y = 0) {
      point.set(x, y);
      raycaster.setFromCamera(point, camera);
      const hit = raycaster.intersectObjects(targets, true)[0];
      return hit && hit.distance < 3.5 ? interaction(hit.object) : null;
    }
    function activate(id: ObjectId) {
      if (callbacks.current.paused) return;
      if (document.pointerLockElement === renderer.domElement)
        document.exitPointerLock();
      movement.current.clear();
      rememberedPose = {
        x: camera.position.x,
        z: camera.position.z,
        yaw,
        pitch,
      };
      callbacks.current.onInteract(id);
    }
    direct.current = (id) => activate(id);
    reset.current = () => {
      camera.position.set(0, 1.58, -0.55);
      yaw = 0;
      pitch = -0.1;
      camera.rotation.set(pitch, yaw, 0);
      setMessage("De vuelta a tu puesto. El primer mensaje sigue esperando.");
    };
    setLook.current = (dx, dy) => {
      if (callbacks.current.paused) return;
      yaw -= dx * 0.003;
      pitch = THREE.MathUtils.clamp(pitch - dy * 0.003, -1.1, 0.75);
      camera.rotation.set(pitch, yaw, 0);
    };
    explore.current = () => {
      try {
        const result = renderer.domElement.requestPointerLock();
        if (result)
          result.catch(() =>
            setMessage(
              "Arrastra sobre la escena para mirar; WASD para moverte.",
            ),
          );
      } catch {
        setMessage("Arrastra sobre la escena para mirar; WASD para moverte.");
      }
    };
    function down(e: KeyboardEvent) {
      if (
        callbacks.current.paused ||
        (e.target as HTMLElement).closest("input,textarea,select")
      )
        return;
      const key = e.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
        ].includes(key)
      ) {
        e.preventDefault();
        movement.current.add(key);
      }
      if (key === "e") {
        e.preventDefault();
        const id = aim();
        if (id) activate(id);
        else
          setMessage(
            "Apunta a un objeto cercano: monitor, libreta o cafetera.",
          );
      }
    }
    const up = (e: KeyboardEvent) =>
      movement.current.delete(e.key.toLowerCase());
    const blur = () => {
      movement.current.clear();
      dragging = false;
    };
    function pointerDown(e: PointerEvent) {
      if (callbacks.current.paused) return;
      dragging = true;
      dragDistance = 0;
      lastPointer = { x: e.clientX, y: e.clientY };
      renderer.domElement.setPointerCapture(e.pointerId);
    }
    function pointerMove(e: PointerEvent) {
      if (callbacks.current.paused) return;
      const pointerLocked = document.pointerLockElement === renderer.domElement;
      if (!dragging && !pointerLocked) return;
      const dx = pointerLocked ? e.movementX : e.clientX - lastPointer.x,
        dy = pointerLocked ? e.movementY : e.clientY - lastPointer.y;
      dragDistance += Math.abs(dx) + Math.abs(dy);
      setLook.current(dx, dy);
      lastPointer = { x: e.clientX, y: e.clientY };
    }
    function pointerUp(e: PointerEvent) {
      if (callbacks.current.paused) return;
      if (dragDistance < 6) {
        const r = renderer.domElement.getBoundingClientRect();
        const id = aim(
          ((e.clientX - r.left) / r.width) * 2 - 1,
          (-(e.clientY - r.top) / r.height) * 2 + 1,
        );
        if (id) activate(id);
      }
      dragging = false;
    }
    function pointerLock() {
      setLocked(document.pointerLockElement === renderer.domElement);
      movement.current.clear();
    }
    function contextLost(e: Event) {
      e.preventDefault();
      running = false;
      setFailed(true);
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointermove", pointerMove);
    renderer.domElement.addEventListener("pointerup", pointerUp);
    renderer.domElement.addEventListener("pointercancel", blur);
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    document.addEventListener("pointerlockchange", pointerLock);
    function blocked(x: number, z: number) {
      return (
        x < -4.5 ||
        x > 4.5 ||
        z < -6.2 ||
        z > 3.8 ||
        (x > -1.9 && x < 1.9 && z > -3.18 && z < -1.08) ||
        (x > -4.16 && x < -1.85 && z > -5.55 && z < -3.99) ||
        (x > 2.57 && x < 4.6 && z > -5.36 && z < -4.06)
      );
    }
    function tick(time: number) {
      if (!running) return;
      const dt = Math.min((time - last) / 1000, 0.04);
      last = time;
      if (!callbacks.current.paused) {
        const keys = movement.current;
        const forward =
          Number(keys.has("w") || keys.has("arrowup")) -
          Number(keys.has("s") || keys.has("arrowdown"));
        const right =
          Number(keys.has("d") || keys.has("arrowright")) -
          Number(keys.has("a") || keys.has("arrowleft"));
        if (forward || right) {
          const length = Math.hypot(forward, right),
            speed = (dt * 1.9) / length;
          const dx = (-Math.sin(yaw) * forward + Math.cos(yaw) * right) * speed,
            dz = (-Math.cos(yaw) * forward - Math.sin(yaw) * right) * speed;
          const x = camera.position.x + dx,
            z = camera.position.z + dz;
          if (!blocked(x, camera.position.z)) camera.position.x = x;
          if (!blocked(camera.position.x, z)) camera.position.z = z;
        }
        hovered = aim();
        if (hovered !== previousTarget) {
          previousTarget = hovered;
          setTarget(hovered);
        }
        rememberedPose = {
          x: camera.position.x,
          z: camera.position.z,
          yaw,
          pitch,
        };
      } else movement.current.clear();
      retro.uniforms.strength.value = qualityRef.current;
      composer.render();
      raf = requestAnimationFrame(tick);
    }
    setReady(true);
    raf = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      movement.current.clear();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      document.removeEventListener("pointerlockchange", pointerLock);
      if (document.pointerLockElement === renderer.domElement)
        document.exitPointerLock();
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointermove", pointerMove);
      renderer.domElement.removeEventListener("pointerup", pointerUp);
      renderer.domElement.removeEventListener("pointercancel", blur);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const materials = Array.isArray(o.material)
            ? o.material
            : [o.material];
          materials.forEach((m) => m.dispose());
        }
      });
      textures.forEach((t) => t.dispose());
      light.shadow.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div className="immersive-office">
      <div className="scene-render" ref={mount}>
        {!ready && !failed && (
          <div className="scene-loading">Preparando tu primer día…</div>
        )}
      </div>
      {failed ? (
        <div className="scene-fallback">
          <Monitor size={38} />
          <h2>La vista 3D no está disponible.</h2>
          <p>Puedes seguir jugando con los accesos de abajo.</p>
        </div>
      ) : (
        <>
          <div className="camera-caption">
            <span className="record-dot" /> FORMA HQ <span>09:07 / LUNES</span>
          </div>
          <div className="viewfinder" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div
            className={`crosshair ${target ? "has-target" : ""}`}
            aria-hidden="true"
          />
          <div className="scene-bottom-caption">
            <span>ESTACIÓN 001 · JUNIOR</span>
            <span>35 MM / RETRO RENDER</span>
          </div>
          {target && (
            <button
              className="world-prompt"
              onClick={() => direct.current(target)}
            >
              <kbd>E</kbd>
              <span>{objectNames[target]}</span>
              <MousePointer2 size={12} />
            </button>
          )}
        </>
      )}
      <div className="scene-settings">
        <button onClick={() => explore.current()}>
          <Eye size={13} />
          {locked ? "Ratón activo · Esc libera" : "Explorar con ratón"}
        </button>
        <button aria-label="Volver a tu puesto" onClick={() => reset.current()}>
          <RotateCcw size={13} />
        </button>
        <label>
          TEXTURA{" "}
          <input
            aria-label="Intensidad de textura retro"
            type="range"
            min="0"
            max="1"
            step=".05"
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="scene-instructions">
        <Move size={13} />
        <span>{message}</span>
        <kbd>WASD</kbd>
      </div>
      <div className="scene-access">
        <button onClick={() => direct.current("computer")}>
          <Monitor size={14} />
          Usar tu ordenador
        </button>
        <button onClick={() => direct.current("notebook")}>
          <BookOpen size={14} />
          Leer libreta de bienvenida
        </button>
        <button onClick={() => direct.current("coffee")}>
          <Coffee size={14} />
          Usar máquina de café
        </button>
      </div>
      <div className="touch-controls" aria-label="Controles de movimiento">
        <button
          aria-label="Mover hacia delante"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            movement.current.add("w");
          }}
          onPointerUp={() => movement.current.delete("w")}
          onPointerCancel={() => movement.current.delete("w")}
        >
          ↑
        </button>
        <div>
          {[
            ["a", "←", "Mover a la izquierda"],
            ["s", "↓", "Mover hacia atrás"],
            ["d", "→", "Mover a la derecha"],
          ].map(([k, arrow, name]) => (
            <button
              key={k}
              aria-label={name}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                movement.current.add(k);
              }}
              onPointerUp={() => movement.current.delete(k)}
              onPointerCancel={() => movement.current.delete(k)}
            >
              {arrow}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
