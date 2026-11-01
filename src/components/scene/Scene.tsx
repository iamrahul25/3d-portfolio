"use client";

import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  CameraControls,
  CameraControlsImpl,
  ContactShadows,
  Environment,
  Lightformer,
  PerformanceMonitor,
  Sparkles,
} from "@react-three/drei";
import * as THREE from "three";
import type { Project } from "@/data/portfolio";
import { Room } from "./Room";
import { Desk } from "./Desk";
import { Chair } from "./Chair";
import { Developer } from "./Developer";
import { useTheme } from "@/lib/theme";
import { nightMix } from "./nightMix";
import { NightGlow } from "./parts/NightGlow";
import { MAIN_MONITOR, MainMonitor, type ScreenAction } from "./Monitors";

export type View = "overview" | "focus";

export type SceneProps = {
  projects: Project[];
  view: View;
  autoRotate: boolean;
  zoom: { id: number; dir: 1 | -1 };
  immersive?: boolean;
  /** Render frames only while true (hero visible). */
  active?: boolean;
  resetKey?: number;
  onAction: (action: ScreenAction) => void;
  onReady?: () => void;
};

const FOV = 35;
const TONE_MAPPING = THREE.AgXToneMapping;
const OVERVIEW_TARGET = new THREE.Vector3(0, 0.95, -0.95);
const OVERVIEW_DIR = new THREE.Vector3(2.6, 1.55, 3.6).normalize();
const FOCUS_TARGET = new THREE.Vector3(...MAIN_MONITOR.position);
const FOCUS_ELEVATION = THREE.MathUtils.degToRad(32);
const FOCUS_DIR = new THREE.Vector3(0, Math.sin(FOCUS_ELEVATION), Math.cos(FOCUS_ELEVATION));
const UI_RESERVED_PX = 230;
const IMMERSIVE_RESERVED_PX = 90;
const ROOM_BOUNDS = new THREE.Box3(new THREE.Vector3(-2.7, 0, -2.25), new THREE.Vector3(2.7, 3, 1.95));
const { ACTION } = CameraControlsImpl;

function overviewDistance(aspect: number) {
  return 6.6 * THREE.MathUtils.clamp(1.5 / aspect, 1, 2.1);
}

function overviewOffset(aspect: number): [number, number] {
  if (aspect > 1.2) return [-Math.min(1.1, (aspect - 1.2) * 1.6), 0];
  if (aspect < 0.9) return [0, -1.6];
  return [0, 0];
}

function focusDistance(aspect: number, heightPx: number, reservedPx: number) {
  const t = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const usable = THREE.MathUtils.clamp((heightPx - reservedPx) / heightPx, 0.45, 0.85);
  const projected = Math.cos(FOCUS_ELEVATION + MAIN_MONITOR.tilt);
  const h = (MAIN_MONITOR.height * projected * 0.55) / (t * usable);
  const w = (MAIN_MONITOR.width * 0.56) / (t * aspect * 0.94);
  return Math.max(1.4, w, h);
}

const _target = new THREE.Vector3();
const _position = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();

// Dollies by `scale` while keeping the point under (ndcX, ndcY) fixed on screen.
// camera-controls' dollyToCursor ignores focal offset, which the overview framing relies on.
function zoomAtPoint(c: CameraControlsImpl, scale: number, ndcX: number, ndcY: number) {
  const target = c.getTarget(_target, true);
  const position = c.getPosition(_position, true);
  const dist = position.distanceTo(target);
  const next = THREE.MathUtils.clamp(dist * scale, c.minDistance, c.maxDistance);
  if (Math.abs(next - dist) < 1e-4) return false;

  const camera = c.camera as THREE.PerspectiveCamera;
  const halfH = dist * Math.tan(THREE.MathUtils.degToRad(camera.getEffectiveFOV() / 2));
  _forward.subVectors(target, position).normalize();
  _right.crossVectors(_forward, camera.up).normalize();
  _up.crossVectors(_right, _forward);
  const k = 1 - next / dist;
  target.addScaledVector(_right, ndcX * halfH * camera.aspect * k).addScaledVector(_up, ndcY * halfH * k);
  c.moveTo(target.x, target.y, target.z, true);
  c.dollyTo(next, true);
  return true;
}

function toNdc(el: HTMLElement, clientX: number, clientY: number) {
  const rect = el.getBoundingClientRect();
  return [((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1] as const;
}

function CameraRig({
  view,
  autoRotate,
  zoom,
  immersive = false,
  resetKey = 0,
}: Pick<SceneProps, "view" | "autoRotate" | "zoom" | "immersive" | "resetKey">) {
  const controls = useRef<CameraControlsImpl>(null);
  const aspect = useThree((s) => s.size.width / s.size.height);
  const heightPx = useThree((s) => s.size.height);
  const canvas = useThree((s) => s.gl.domElement);
  const lastInteraction = useRef(0);
  const introDone = useRef(false);

  useLayoutEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.mouseButtons.left = ACTION.ROTATE;
    c.mouseButtons.middle = ACTION.NONE;
    c.touches.one = ACTION.TOUCH_ROTATE;
    c.touches.three = ACTION.NONE;
    c.setBoundary(ROOM_BOUNDS);
    // Dev-only hook so screenshot scripts can frame close-ups.
    if (process.env.NODE_ENV !== "production") (window as unknown as { __controls?: CameraControlsImpl }).__controls = c;

    const onStart = () => (lastInteraction.current = Infinity);
    const onEnd = () => (lastInteraction.current = performance.now());
    c.addEventListener("controlstart", onStart);
    c.addEventListener("controlend", onEnd);
    return () => {
      c.removeEventListener("controlstart", onStart);
      c.removeEventListener("controlend", onEnd);
    };
  }, []);

  // Outside immersive mode, wheel and pinch go through zoomAtPoint (see the effects below).
  // dollyToCursor assumes a zero focal offset, which immersive framing guarantees.
  useLayoutEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.mouseButtons.wheel = immersive ? ACTION.DOLLY : ACTION.NONE;
    c.mouseButtons.right = immersive ? ACTION.TRUCK : ACTION.NONE;
    c.touches.two = immersive ? ACTION.TOUCH_DOLLY_TRUCK : ACTION.NONE;
    c.dollyToCursor = immersive;
  }, [immersive]);

  // The wheel only zooms while the hero is fully in view, and falls through to page
  // scrolling at the zoom limits so the hero never traps the scroll.
  useEffect(() => {
    if (immersive) return;
    const onWheel = (e: WheelEvent) => {
      const c = controls.current;
      if (!c || e.deltaY === 0) return;
      const rect = canvas.getBoundingClientRect();
      if (!e.ctrlKey && rect.top < -1) return;
      const px = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? rect.height : 1);
      // ctrlKey marks trackpad pinch, which reports much smaller deltas.
      const scale = Math.exp(THREE.MathUtils.clamp(px, -150, 150) * (e.ctrlKey ? 0.01 : 0.0015));
      c.smoothTime = 0.25;
      const zoomed = zoomAtPoint(c, scale, ...toNdc(canvas, e.clientX, e.clientY));
      if (zoomed || e.ctrlKey) e.preventDefault();
      if (zoomed) lastInteraction.current = performance.now();
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [canvas, immersive]);

  useEffect(() => {
    const c = controls.current;
    if (immersive || !c) return;
    const touches = new Map<number, { x: number; y: number }>();
    let lastSpread = 0;
    const pair = () => [...touches.values()] as [{ x: number; y: number }, { x: number; y: number }];

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size !== 2) return;
      const [a, b] = pair();
      lastSpread = Math.hypot(a.x - b.x, a.y - b.y);
      // Rotation stays off until every finger lifts, otherwise the remaining finger jumps the view.
      c.touches.one = ACTION.NONE;
    };
    const onMove = (e: PointerEvent) => {
      const p = touches.get(e.pointerId);
      if (!p) return;
      p.x = e.clientX;
      p.y = e.clientY;
      if (touches.size !== 2) return;
      const [a, b] = pair();
      const spread = Math.hypot(a.x - b.x, a.y - b.y);
      if (lastSpread > 0 && spread > 0) {
        c.smoothTime = 0.12;
        zoomAtPoint(c, lastSpread / spread, ...toNdc(canvas, (a.x + b.x) / 2, (a.y + b.y) / 2));
        lastInteraction.current = performance.now();
      }
      lastSpread = spread;
    };
    const onUp = (e: PointerEvent) => {
      if (!touches.delete(e.pointerId)) return;
      if (touches.size === 0) c.touches.one = ACTION.TOUCH_ROTATE;
    };

    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      c.touches.one = ACTION.TOUCH_ROTATE;
    };
  }, [canvas, immersive]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const target = view === "focus" ? FOCUS_TARGET : OVERVIEW_TARGET;
    const dir = view === "focus" ? FOCUS_DIR : OVERVIEW_DIR;
    const reservedPx = immersive ? IMMERSIVE_RESERVED_PX : UI_RESERVED_PX;
    const dist = view === "focus" ? focusDistance(aspect, heightPx, reservedPx) : overviewDistance(aspect);
    const pos = target.clone().addScaledVector(dir, dist);
    const [offsetX, offsetY] = view === "focus" || immersive ? [0, 0] : overviewOffset(aspect);
    c.setFocalOffset(offsetX, offsetY, 0, introDone.current);

    if (!introDone.current) {
      introDone.current = true;
      const start = OVERVIEW_TARGET.clone().addScaledVector(
        new THREE.Vector3(-2.5, 3.2, 5).normalize(),
        dist * 1.9,
      );
      c.setLookAt(start.x, start.y, start.z, target.x, target.y, target.z, false);
      c.smoothTime = 1.1;
      requestAnimationFrame(() => {
        c.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, true).then(() => {
          c.smoothTime = 0.45;
        });
      });
      lastInteraction.current = performance.now() + 1500;
      return;
    }

    c.smoothTime = 0.55;
    c.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, true);
    lastInteraction.current = performance.now();
  }, [view, aspect, heightPx, immersive, resetKey]);

  useEffect(() => {
    if (zoom.id === 0 || !controls.current) return;
    controls.current.smoothTime = 0.45;
    controls.current.dolly(zoom.dir * 0.8, true);
    lastInteraction.current = performance.now();
  }, [zoom]);

  // A small camera drift when day/night flips, so the toggle feels like it happens in the room.
  const theme = useTheme();
  const prevTheme = useRef(theme);
  useEffect(() => {
    if (prevTheme.current === theme) return;
    prevTheme.current = theme;
    // Hold the 360° spin for a few seconds so the lighting change can be seen from the same angle.
    lastInteraction.current = performance.now() + 4000;
    const c = controls.current;
    if (!c || view !== "overview" || immersive) return;
    const dir = theme === "dark" ? 1 : -1;
    c.smoothTime = 0.9;
    // Lean in slightly and settle lower at night, back out by day. Small enough to stay inside the room bounds.
    c.rotate(0, dir * THREE.MathUtils.degToRad(-2.5), true);
    c.dolly(dir * 0.18, true);
  }, [theme, view, immersive]);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c || !autoRotate || view !== "overview") return;
    if (performance.now() - lastInteraction.current < 3500) return;
    c.rotate(delta * 0.12, 0, true);
  });

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={immersive ? 0.2 : 1}
      maxDistance={immersive ? 12 : Math.min(12, overviewDistance(aspect) * 1.35)}
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI / 2 - 0.04}
      draggingSmoothTime={0.12}
      azimuthRotateSpeed={0.6}
      polarRotateSpeed={0.5}
    />
  );
}

// One shadow-map texel covers ~4 mm of the room, so smaller parts would only add draw calls.
const MIN_CASTER_RADIUS = 0.02;
const _worldScale = new THREE.Vector3();

// Instanced meshes keep their own `castShadow` prop: their bounds say nothing about piece size.
function castsShadow(mesh: THREE.Mesh) {
  for (let o: THREE.Object3D | null = mesh; o; o = o.parent) if (o.userData.noCastShadow) return false;
  if ((mesh as THREE.InstancedMesh).isInstancedMesh) return mesh.castShadow;
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  if (materials.some((m) => m.type === "MeshBasicMaterial" || (m.transparent && m.opacity < 0.5))) return false;
  if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
  mesh.getWorldScale(_worldScale);
  const scale = Math.max(Math.abs(_worldScale.x), Math.abs(_worldScale.y), Math.abs(_worldScale.z));
  return mesh.geometry.boundingSphere!.radius * scale >= MIN_CASTER_RADIUS;
}

function AutoShadows() {
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    scene.updateMatrixWorld();
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = castsShadow(mesh);
      mesh.receiveShadow = true;
    });
  }, [scene]);
  return null;
}

const ENV_RESOLUTION = 256;
const SHADOW_SIDE: Record<THREE.Side, THREE.Side> = {
  [THREE.FrontSide]: THREE.BackSide,
  [THREE.BackSide]: THREE.FrontSide,
  [THREE.DoubleSide]: THREE.DoubleSide,
};

// WebGLShadowMap renders casters with a shared depth material onto which it copies each caster's
// side/map/alphaMap, so its shader variants are invisible to compileAsync. These stand-ins share
// the same program cache keys, which lets those variants compile up front as well.
function shadowProxies(gl: THREE.WebGLRenderer, scene: THREE.Scene, pointLight: boolean) {
  const root = new THREE.Scene();
  const seen = new Set<string>();
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.castShadow || mesh.customDepthMaterial || mesh.customDistanceMaterial) return;
    const instanced = mesh as THREE.InstancedMesh;
    const { attributes } = mesh.geometry;
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      const side = m.shadowSide ?? (gl.shadowMap.type === THREE.VSMShadowMap ? m.side : SHADOW_SIDE[m.side]);
      const { map = null, alphaMap = null } = m as THREE.MeshStandardMaterial;
      const key = [
        instanced.isInstancedMesh,
        !!instanced.instanceColor,
        side,
        map?.uuid,
        alphaMap?.uuid,
        m.alphaTest,
        !!attributes.normal,
        !!attributes.uv1,
        !!attributes.uv2,
        !!attributes.uv3,
      ].join();
      if (seen.has(key)) continue;
      seen.add(key);
      const params = { side, map, alphaMap, alphaTest: m.alphaTest };
      const material = pointLight ? new THREE.MeshDistanceMaterial(params) : new THREE.MeshDepthMaterial(params);
      if (instanced.isInstancedMesh) {
        const proxy = new THREE.InstancedMesh(mesh.geometry, material, instanced.count);
        proxy.instanceMatrix = instanced.instanceMatrix;
        proxy.instanceColor = instanced.instanceColor;
        root.add(proxy);
      } else {
        root.add(new THREE.Mesh(mesh.geometry, material));
      }
    }
  });
  return root;
}

// three compiles the PMREM prefilter shader synchronously the first time the environment map is
// prefiltered (~0.5 s on some GPUs). An identical material compiled async while the scene graph
// is still being built lets that step pick the finished program from the cache instead.
let pmremWarmup: Promise<unknown> = Promise.resolve();
function createRenderer(params: THREE.WebGLRendererParameters) {
  const gl = new THREE.WebGLRenderer(params);
  // Reading back shader logs makes the first use of every program wait on the driver.
  gl.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
  const pmrem = new THREE.PMREMGenerator(gl) as unknown as {
    _lodMax: number;
    _cubeSize: number;
    _allocateTargets?: () => THREE.WebGLRenderTarget;
    _ggxMaterial?: THREE.Material | null;
  };
  if (typeof pmrem._allocateTargets === "function") {
    pmrem._lodMax = Math.floor(Math.log2(ENV_RESOLUTION));
    pmrem._cubeSize = 2 ** pmrem._lodMax;
    pmrem._allocateTargets().dispose();
    if (pmrem._ggxMaterial) {
      // Any offscreen target gives the same (linear, untonemapped) variant PMREM renders with.
      const offscreen = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
      // Position-only, like PMREM's own planes: the attribute set is part of the program key.
      const geometry = new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(9, 3));
      gl.setRenderTarget(offscreen);
      pmremWarmup = gl.compileAsync(new THREE.Mesh(geometry, pmrem._ggxMaterial), new THREE.Camera());
      gl.setRenderTarget(null);
      pmremWarmup.then(() => offscreen.dispose());
    }
  }
  return gl;
}

// compileAsync only waits for each material's last program, but a material shared by different
// kinds of objects (instanced or not, with or without normals...) gets one program per kind.
function programsReady(gl: THREE.WebGLRenderer) {
  const programs = (gl.info.programs ?? []) as unknown as { isReady(): boolean }[];
  return new Promise<void>((resolve) => {
    const check = () => (programs.every((p) => p.isReady()) ? resolve() : setTimeout(check, 10));
    check();
  });
}

// Lights that only matter in one theme are tagged `userData.phase` and hidden (not just dimmed)
// while their intensity is zero, which drops them from every shader and skips their shadow pass.
const PHASE_EPSILON = 1e-3;

function phaseLights(scene: THREE.Scene) {
  const lights: THREE.Light[] = [];
  scene.traverse((o) => {
    if ((o as THREE.Light).isLight && (o.userData.phase || o.userData.nightShadow)) lights.push(o as THREE.Light);
  });
  return lights;
}

type LightConfig = { day: boolean; night: boolean; lampShadow: boolean };

function applyLightConfig(lights: THREE.Light[], config: LightConfig) {
  for (const l of lights) {
    if (l.userData.phase === "day") l.visible = config.day;
    if (l.userData.phase === "night") l.visible = config.night;
    if (l.userData.nightShadow) l.castShadow = config.lampShadow;
  }
}

function snapshotLights(lights: THREE.Light[]) {
  const saved = lights.map((l) => [l.visible, l.castShadow] as const);
  return () => lights.forEach((l, i) => ([l.visible, l.castShadow] = saved[i]));
}

// Each phase switches as a group off the shared day/night blend, so the only light setups that
// ever occur are day, night and the cross-fade between them (the ones Precompile warms).
function LightCulling() {
  const lights = useRef<THREE.Light[] | null>(null);
  useFrame(({ scene }) => {
    lights.current ??= phaseLights(scene).filter((l) => l.userData.phase);
    const k = nightMix.value;
    for (const l of lights.current) l.visible = l.userData.phase === "night" ? k > PHASE_EPSILON : k < 1 - PHASE_EPSILON;
  });
  return null;
}

// Compiles every shader with KHR_parallel_shader_compile before the first frame is drawn, so the
// driver builds them on its own threads instead of stalling the page for seconds. Afterwards the
// light setups used by the other theme (and the cross-fade between them) are warmed in idle time,
// so the day/night toggle doesn't hitch either.
function Precompile({ bloom, onDone }: { bloom: boolean; onDone: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const lampShadows = !window.matchMedia("(pointer: coarse)").matches;
  useEffect(() => {
    let cancelled = false;
    const night = document.documentElement.dataset.theme === "dark";
    const lights = phaseLights(scene);
    // Night bloom draws the scene into an offscreen target, which needs its own shader variants.
    const offscreen = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    const depthProxies = shadowProxies(gl, scene, false);
    const distanceProxies = lampShadows ? shadowProxies(gl, scene, true) : null;
    const current: LightConfig = { day: !night, night, lampShadow: night && lampShadows };
    const compileWith = (config: LightConfig, toTarget: boolean) => {
      const restore = snapshotLights(lights);
      const previous = { target: gl.getRenderTarget(), toneMapping: gl.toneMapping };
      applyLightConfig(lights, config);
      // The bloom composer swaps the renderer's tone mapping out while it's mounted.
      gl.toneMapping = TONE_MAPPING;
      gl.setRenderTarget(toTarget ? offscreen : null);
      const ready = [gl.compileAsync(scene, camera)];
      if (!toTarget) {
        // Shadow passes draw into the shadow map, but take the scene's light setup into account.
        gl.setRenderTarget(offscreen);
        if (config.day) ready.push(gl.compileAsync(depthProxies, camera, scene));
        if (config.lampShadow && distanceProxies) ready.push(gl.compileAsync(distanceProxies, camera, scene));
      }
      gl.setRenderTarget(previous.target);
      gl.toneMapping = previous.toneMapping;
      restore();
      if (config !== current) {
        // Compiling for another light setup leaves it behind in places three only refreshes for lit
        // materials: unlit materials keep the warmed program, and shadow passes (which run before a
        // frame sets up its lights) reuse the warmed light counts. Either way the next frame would
        // pick up a program that may still be compiling and block on it, so the on-screen setup
        // is compiled again (all cache hits) to put everything back.
        gl.compile(scene, camera);
      }
      return Promise.all(ready);
    };

    applyLightConfig(lights, current);
    // The bloom chunk loads lazily, so a night visit draws a few frames without it first.
    const first = [false, ...(night && bloom ? [true] : [])].map((toTarget) =>
      pmremWarmup.then(async () => {
        if (!cancelled) await compileWith(current, toTarget);
      }),
    );
    Promise.all(first).then(async () => {
      await programsReady(gl);
      if (cancelled) return;
      onDone();
      await new Promise((r) => setTimeout(r, 2500));
      // Bloom can be switched off at runtime by the PerformanceMonitor, so night setups are warmed
      // for both the on-screen and the offscreen (bloom) path.
      const opposite: LightConfig = { day: night, night: !night, lampShadow: !night && lampShadows };
      const toNight: LightConfig = { day: true, night: true, lampShadow: lampShadows };
      const toDay: LightConfig = { day: true, night: true, lampShadow: false };
      const variants = (config: LightConfig, nightBloom: boolean): [LightConfig, boolean][] =>
        bloom && nightBloom ? [[config, false], [config, true]] : [[config, false]];
      // Ordered by what the next toggle needs first: the cross-fade, then the settled theme.
      const later = night
        ? [...variants(toDay, false), ...variants(opposite, false), ...variants(toNight, true)]
        : [...variants(toNight, true), ...variants(opposite, true), ...variants(toDay, false)];
      for (const [config, toTarget] of later) {
        if (cancelled) break;
        await compileWith(config, toTarget);
      }
      offscreen.dispose();
    });
    return () => {
      cancelled = true;
      offscreen.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera]);
  return null;
}

function Ready({ onReady }: { onReady?: () => void }) {
  const fired = useRef(false);
  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    onReady?.();
  });
  return null;
}

const DAY = { hemi: 0.75, amb: 0.15, key: 2.1, rim: 0.55, env: 0.45, moon: 0, exposure: 1.15 };
const NIGHT = { hemi: 0.06, amb: 0.02, key: 0, rim: 0.12, env: 0.04, moon: 0.3, exposure: 0.95 };
const HEMI_DAY = new THREE.Color("#fff4e6");
const HEMI_NIGHT = new THREE.Color("#6f7cff");

// Day/night lighting rig; values ease between the two presets so toggling feels like a dimmer.
function Lights({ mobile = false }: { mobile?: boolean }) {
  const night = useTheme() === "dark";
  const t = useRef(night ? 1 : 0);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const amb = useRef<THREE.AmbientLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const moon = useRef<THREE.DirectionalLight>(null);

  useFrame(({ gl, scene }, delta) => {
    const goal = night ? 1 : 0;
    t.current = THREE.MathUtils.damp(t.current, goal, 3.5, delta);
    const k = t.current;
    nightMix.value = k;
    const mix = (p: keyof typeof DAY) => THREE.MathUtils.lerp(DAY[p], NIGHT[p], k);
    if (hemi.current) {
      hemi.current.intensity = mix("hemi");
      hemi.current.color.copy(HEMI_DAY).lerp(HEMI_NIGHT, k);
    }
    if (amb.current) amb.current.intensity = mix("amb");
    if (key.current) key.current.intensity = mix("key");
    if (rim.current) rim.current.intensity = mix("rim");
    if (moon.current) moon.current.intensity = mix("moon");
    // Set every frame: drei's <Environment> re-applies its own intensity on re-render.
    scene.environmentIntensity = mix("env");
    gl.toneMappingExposure = mix("exposure");
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={["#fff4e6", "#cdb9a3", 0.75]} />
      <ambientLight ref={amb} intensity={0.15} />
      {/* cool rim light from behind-left to separate silhouettes from the walls */}
      <directionalLight ref={rim} position={[-4, 3.5, -3]} intensity={0.55} color="#cfe0ff" />
      {/* moonlight, only visible at night */}
      <directionalLight ref={moon} position={[4, 4, 4]} intensity={0} color="#8fa2ff" userData={{ phase: "night" }} />
      <directionalLight
        ref={key}
        userData={{ phase: "day" }}
        position={[3.5, 6, 3.2]}
        intensity={2.1}
        color="#ffe6c4"
        castShadow
        shadow-mapSize={mobile ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
      />
    </>
  );
}

// Night-only ambience: dust motes drifting in the lamp light and a cool spill from the monitor.
function NightAmbience() {
  const night = useTheme() === "dark";
  const glow = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!glow.current) return;
    const goal = night ? 1.6 + Math.sin(clock.elapsedTime * 1.3) * 0.08 : 0;
    glow.current.intensity = THREE.MathUtils.lerp(glow.current.intensity, goal, 0.06);
  });
  const [mx, my, mz] = MAIN_MONITOR.position;
  return (
    <>
      <pointLight
        ref={glow}
        position={[mx, my, mz + 0.45]}
        color="#9db4ff"
        intensity={0}
        distance={2.4}
        decay={1.8}
        userData={{ phase: "night" }}
      />
      {night && (
        <Sparkles count={60} scale={[2.6, 1.6, 1.6]} position={[-0.6, 1.6, -1.2]} size={2.2} speed={0.25} opacity={0.55} color="#ffd59a" />
      )}
    </>
  );
}

// Bloom only at night and only on devices that can afford it. The postprocessing
// libraries (~100 kB) live in their own chunk and load on first use.
const NightBloomFx = lazy(() => import("./NightBloomFx"));

function NightBloom({ capable }: { capable: boolean }) {
  const night = useTheme() === "dark";
  if (!night || !capable) return null;
  return (
    <Suspense fallback={null}>
      <NightBloomFx />
    </Suspense>
  );
}

// Phones and small touch screens get cheaper shadows and a lower DPR ceiling.
function useIsMobile() {
  const [mobile] = useState(
    () => typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768),
  );
  return mobile;
}

function canAffordEffects() {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  return !coarse && cores >= 4;
}

export default function Scene({
  projects,
  view,
  autoRotate,
  zoom,
  immersive,
  resetKey,
  onAction,
  onReady,
  active = true,
}: SceneProps) {
  // Start at a sensible DPR and step down on slow GPUs instead of dropping frames.
  const mobile = useIsMobile();
  const [dpr, setDpr] = useState(() => Math.max(1, Math.min(typeof window === "undefined" ? 1.5 : window.devicePixelRatio || 1, mobile ? 1.5 : 2)));
  const [fx, setFx] = useState(canAffordEffects);
  const [compiled, setCompiled] = useState(false);
  return (
    <Canvas
      frameloop={active && compiled ? "always" : "never"}
      shadows="percentage"
      dpr={dpr}
      gl={(defaults) => createRenderer({ ...defaults, antialias: true, alpha: true, powerPreference: "high-performance" })}
      camera={{ fov: FOV, near: 0.05, far: 60, position: [6, 5, 8] }}
      onCreated={({ gl }) => {
        gl.toneMapping = TONE_MAPPING;
        gl.toneMappingExposure = 1.15;      }}
    >
      <Suspense fallback={null}>
        <PerformanceMonitor
          bounds={() => [45, 60]}
          onIncline={() => setDpr((d) => Math.min(mobile ? 1.5 : 2, d + 0.25))}
          onDecline={() => setDpr((d) => Math.max(1, d - 0.25))}
          onChange={({ factor }) => factor < 0.3 && setFx(false)}
          flipflops={3}
          onFallback={() => {
            setDpr(1);
            setFx(false);
          }}
        />
        <Lights mobile={mobile} />
        <NightAmbience />
        <NightGlow />
        <NightBloom capable={fx} />
        <Environment resolution={256} frames={1} environmentIntensity={0.45}>
          <Lightformer intensity={2} position={[0, 5, -2]} scale={[10, 5, 1]} rotation-x={Math.PI / 2} color="#fff3e0" />
          <Lightformer intensity={1.2} position={[-5, 1.5, -1]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} color="#ffe9cc" />
          <Lightformer intensity={1.2} position={[5, 1.5, -1]} rotation-y={-Math.PI / 2} scale={[10, 3, 1]} />
          <Lightformer intensity={0.8} position={[0, 1.5, 6]} scale={[10, 3, 1]} />
        </Environment>

        <Room />
        <Desk />
        <MainMonitor projects={projects} onAction={onAction} />
        <Chair position={[-0.1, 0, -0.55]} />
        <Developer position={[-0.1, 0, 0]} />

        <ContactShadows position={[0, -0.165, -0.15]} scale={9} blur={2.2} opacity={0.42} far={1.5} frames={1} />
        <AutoShadows />
        <CameraRig view={view} autoRotate={autoRotate} zoom={zoom} immersive={immersive} resetKey={resetKey} />
        <LightCulling />
        <Precompile bloom={fx} onDone={() => setCompiled(true)} />
        <Ready onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
