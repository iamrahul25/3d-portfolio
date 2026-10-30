"use client";

import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { Bloom, EffectComposer } from "@react-three/postprocessing";
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

function AutoShadows() {
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const basic = (mesh.material as THREE.Material | undefined)?.type === "MeshBasicMaterial";
      mesh.castShadow = !basic;
      mesh.receiveShadow = true;
    });
  }, [scene]);
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
const _hemiSky = new THREE.Color();

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
      hemi.current.color.copy(_hemiSky.set("#fff4e6").lerp(new THREE.Color("#6f7cff"), k));
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
      <directionalLight ref={moon} position={[4, 4, 4]} intensity={0} color="#8fa2ff" />
      <directionalLight
        ref={key}
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
      <pointLight ref={glow} position={[mx, my, mz + 0.45]} color="#9db4ff" intensity={0} distance={2.4} decay={1.8} />
      {night && (
        <Sparkles count={60} scale={[2.6, 1.6, 1.6]} position={[-0.6, 1.6, -1.2]} size={2.2} speed={0.25} opacity={0.55} color="#ffd59a" />
      )}
    </>
  );
}

// Bloom only at night (when the lamp, shelf strip and screens are the light sources) and
// only on devices that can afford a full-screen pass.
function NightBloom({ capable }: { capable: boolean }) {
  const night = useTheme() === "dark";
  if (!night || !capable) return null;
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.7} luminanceThreshold={1.05} luminanceSmoothing={0.2} radius={0.7} />
    </EffectComposer>
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
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      shadows="percentage"
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: FOV, near: 0.05, far: 60, position: [6, 5, 8] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.AgXToneMapping;
        gl.toneMappingExposure = 1.15;
      }}
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

        <ContactShadows position={[0, -0.165, -0.15]} scale={9} blur={2.2} opacity={0.42} far={1.5} />
        <AutoShadows />
        <CameraRig view={view} autoRotate={autoRotate} zoom={zoom} immersive={immersive} resetKey={resetKey} />
        <Ready onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
