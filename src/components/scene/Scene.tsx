"use client";

import { Suspense, useEffect, useLayoutEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls, CameraControlsImpl, ContactShadows, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import type { Project } from "@/data/portfolio";
import { Room } from "./Room";
import { Desk } from "./Desk";
import { Chair } from "./Chair";
import { Developer } from "./Developer";
import { MAIN_MONITOR, MainMonitor, type ScreenAction } from "./Monitors";

export type View = "overview" | "focus";

export type SceneProps = {
  projects: Project[];
  view: View;
  autoRotate: boolean;
  zoom: { id: number; dir: 1 | -1 };
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
const { ACTION } = CameraControlsImpl;

function overviewDistance(aspect: number) {
  return 6.6 * THREE.MathUtils.clamp(1.5 / aspect, 1, 2.1);
}

function overviewOffset(aspect: number): [number, number] {
  if (aspect > 1.2) return [-Math.min(1.1, (aspect - 1.2) * 1.6), 0];
  if (aspect < 0.9) return [0, -1.6];
  return [0, 0];
}

function focusDistance(aspect: number, heightPx: number) {
  const t = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const usable = THREE.MathUtils.clamp((heightPx - UI_RESERVED_PX) / heightPx, 0.45, 0.85);
  const projected = Math.cos(FOCUS_ELEVATION + MAIN_MONITOR.tilt);
  const h = (MAIN_MONITOR.height * projected * 0.55) / (t * usable);
  const w = (MAIN_MONITOR.width * 0.56) / (t * aspect * 0.94);
  return Math.max(1.4, w, h);
}

function CameraRig({ view, autoRotate, zoom }: Pick<SceneProps, "view" | "autoRotate" | "zoom">) {
  const controls = useRef<CameraControlsImpl>(null);
  const aspect = useThree((s) => s.size.width / s.size.height);
  const heightPx = useThree((s) => s.size.height);
  const lastInteraction = useRef(0);
  const introDone = useRef(false);

  useLayoutEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.mouseButtons.left = ACTION.ROTATE;
    c.mouseButtons.right = ACTION.NONE;
    c.mouseButtons.middle = ACTION.NONE;
    c.mouseButtons.wheel = ACTION.NONE;
    c.touches.one = ACTION.TOUCH_ROTATE;
    c.touches.two = ACTION.TOUCH_DOLLY;
    c.touches.three = ACTION.NONE;

    const onStart = () => (lastInteraction.current = Infinity);
    const onEnd = () => (lastInteraction.current = performance.now());
    c.addEventListener("controlstart", onStart);
    c.addEventListener("controlend", onEnd);
    return () => {
      c.removeEventListener("controlstart", onStart);
      c.removeEventListener("controlend", onEnd);
    };
  }, []);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const target = view === "focus" ? FOCUS_TARGET : OVERVIEW_TARGET;
    const dir = view === "focus" ? FOCUS_DIR : OVERVIEW_DIR;
    const dist = view === "focus" ? focusDistance(aspect, heightPx) : overviewDistance(aspect);
    const pos = target.clone().addScaledVector(dir, dist);
    const [offsetX, offsetY] = view === "focus" ? [0, 0] : overviewOffset(aspect);
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
  }, [view, aspect, heightPx]);

  useEffect(() => {
    if (zoom.id === 0) return;
    controls.current?.dolly(zoom.dir * 0.8, true);
    lastInteraction.current = performance.now();
  }, [zoom]);

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
      minDistance={1}
      maxDistance={12}
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

export default function Scene({ projects, view, autoRotate, zoom, onAction, onReady }: SceneProps) {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: FOV, near: 0.05, far: 60, position: [6, 5, 8] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <Suspense fallback={null}>
        <hemisphereLight args={["#fff4e6", "#cdb9a3", 0.75]} />
        <ambientLight intensity={0.2} />
        <directionalLight
          position={[3.5, 6, 3.2]}
          intensity={1.7}
          color="#fff0dc"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.02}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
          shadow-camera-near={0.5}
          shadow-camera-far={20}
        />
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

        <ContactShadows position={[0, -0.165, -0.15]} scale={9} blur={2.6} opacity={0.35} far={1.5} />
        <AutoShadows />
        <CameraRig view={view} autoRotate={autoRotate} zoom={zoom} />
        <Ready onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
