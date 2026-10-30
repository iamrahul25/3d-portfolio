"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Instance, Instances, RoundedBox } from "@react-three/drei";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Project } from "@/data/portfolio";
import { getFontFamily, useCanvasTexture } from "./useCanvasTexture";
import {
  CODE_CHAR_COUNT,
  MAIN_SCREEN,
  drawCodeScreen,
  drawMainScreen,
  drawPhoneScreen,
  drawWallpaper,
  type HitRegion,
} from "./screens/draw";
import { brushedTexture } from "./materials";

const BEZEL = "#141417";
const SANS = "Inter, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "'Cascadia Code', Consolas, 'Courier New', monospace";

export const MAIN_MONITOR = {
  position: [-0.1, 1.27, -1.82] as [number, number, number],
  tilt: -0.1,
  width: 1.3,
  height: 1.3 * (MAIN_SCREEN.height / MAIN_SCREEN.width),
};

export type ScreenAction =
  | { type: "project"; slug: string }
  | { type: "nav"; target: string }
  | { type: "cta" }
  | { type: "focus" };

function setCursor(e: ThreeEvent<PointerEvent>, value: string) {
  const target = e.nativeEvent.target;
  if (target instanceof HTMLElement) target.style.cursor = value;
}

export function MainMonitor({
  projects,
  onAction,
}: {
  projects: Project[];
  onAction: (action: ScreenAction) => void;
}) {
  const surface = useCanvasTexture(MAIN_SCREEN.width, MAIN_SCREEN.height);
  const hits = useRef<HitRegion[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [fontsReady, setFontsReady] = useState(0);

  useEffect(() => {
    document.fonts?.ready.then(() => setFontsReady((n) => n + 1));
  }, []);

  useEffect(() => {
    const font = getFontFamily("--font-geist-sans", SANS);
    hits.current = surface.paint((ctx) => drawMainScreen(ctx, projects, hovered, font));
  }, [surface, projects, hovered, fontsReady]);

  const hitTest = useCallback((e: ThreeEvent<PointerEvent | MouseEvent>) => {
    if (!e.uv) return null;
    const x = e.uv.x * MAIN_SCREEN.width;
    const y = (1 - e.uv.y) * MAIN_SCREEN.height;
    return hits.current.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) ?? null;
  }, []);

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const hit = hitTest(e);
    const id = hit?.id ?? null;
    if (id !== hovered) setHovered(id);
    setCursor(e, "pointer");
  };

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    const hit = hitTest(e);
    if (!hit) return onAction({ type: "focus" });
    if (hit.id === "cta") return onAction({ type: "cta" });
    const [kind, value] = hit.id.split(":");
    if (kind === "project") onAction({ type: "project", slug: value });
    if (kind === "nav") onAction({ type: "nav", target: value });
  };

  const { width, height } = MAIN_MONITOR;
  const brushed = brushedTexture();
  const cableGeo = useMemo(() => {
    const c = new THREE.CatmullRomCurve3(
      [[0, -0.36, -0.1], [0.01, -0.42, -0.14], [0.05, -0.475, -0.24], [0.12, -0.479, -0.32]].map((p) => new THREE.Vector3(...p)),
    );
    return new THREE.TubeGeometry(c, 32, 0.005, 8, false);
  }, []);

  return (
    <group position={MAIN_MONITOR.position}>
      <group rotation={[MAIN_MONITOR.tilt, 0, 0]}>
        {/* thin front frame with slightly taller chin */}
        <RoundedBox args={[width + 0.03, height + 0.05, 0.022]} radius={0.008} smoothness={4} position={[0, -0.01, 0.006]} castShadow>
          <meshPhysicalMaterial color={BEZEL} roughness={0.42} metalness={0.15} clearcoat={0.4} clearcoatRoughness={0.3} />
        </RoundedBox>
        {/* tapered rear housing */}
        <RoundedBox args={[width + 0.02, height + 0.03, 0.02]} radius={0.009} smoothness={4} position={[0, -0.005, -0.012]} castShadow>
          <meshStandardMaterial color="#d9dbe0" metalness={0.7} roughness={0.38} roughnessMap={brushed} />
        </RoundedBox>
        <RoundedBox args={[width * 0.62, height * 0.55, 0.04]} radius={0.018} smoothness={4} position={[0, 0.0, -0.035]} castShadow>
          <meshStandardMaterial color="#d2d4da" metalness={0.7} roughness={0.4} roughnessMap={brushed} />
        </RoundedBox>
        {/* vent slots */}
        {Array.from({ length: 14 }, (_, i) => (
          <mesh key={i} position={[-0.26 + i * 0.04, height * 0.22, -0.0555]}>
            <boxGeometry args={[0.022, 0.004, 0.002]} />
            <meshStandardMaterial color="#5a5c63" roughness={0.6} />
          </mesh>
        ))}
        {/* power LED on chin */}
        <mesh position={[width / 2 - 0.04, -height / 2 - 0.022, 0.0175]}>
          <circleGeometry args={[0.003, 12]} />
          <meshBasicMaterial color="#9fffcf" toneMapped={false} />
        </mesh>
        <mesh
          position={[0, 0, 0.0175]}
          onPointerMove={onMove}
          onPointerOut={(e) => {
            setHovered(null);
            setCursor(e, "");
          }}
          onClick={onClick}
        >
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={surface.texture} toneMapped={false} />
        </mesh>
      </group>
      {/* aluminium neck with cable cut-out */}
      <RoundedBox args={[0.085, 0.42, 0.022]} radius={0.008} smoothness={3} position={[0, -0.27, -0.085]} rotation-x={-0.06} castShadow>
        <meshStandardMaterial color="#cfd1d6" metalness={0.85} roughness={0.3} roughnessMap={brushed} />
      </RoundedBox>
      <RoundedBox args={[0.04, 0.05, 0.026]} radius={0.01} position={[0, -0.36, -0.087]}>
        <meshStandardMaterial color="#1a1a1e" roughness={0.8} />
      </RoundedBox>
      <mesh geometry={cableGeo} castShadow>
        <meshStandardMaterial color="#151518" roughness={0.45} />
      </mesh>
      {/* foot */}
      <RoundedBox args={[0.3, 0.01, 0.22]} radius={0.0045} smoothness={3} position={[0, -0.479, -0.06]} castShadow receiveShadow>
        <meshStandardMaterial color="#cfd1d6" metalness={0.85} roughness={0.28} roughnessMap={brushed} />
      </RoundedBox>
    </group>
  );
}

const CODE_W = 720;
const CODE_H = 1280;

export function CodeMonitor({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  const surface = useCanvasTexture(CODE_W, CODE_H);
  const state = useRef({ chars: 0, acc: 0, pause: 0, blink: 0 });

  useFrame((_, delta) => {
    const s = state.current;
    s.acc += delta;
    s.blink += delta;
    if (s.acc < 0.05) return;
    s.acc = 0;
    if (s.chars >= CODE_CHAR_COUNT) {
      s.pause += 0.05;
      if (s.pause > 3) {
        s.chars = 0;
        s.pause = 0;
      }
    } else {
      s.chars += 2;
    }
    const cursor = Math.floor(s.blink * 2) % 2 === 0;
    surface.paint((ctx) => drawCodeScreen(ctx, CODE_W, CODE_H, s.chars, MONO, cursor));
  });

  const brushed = brushedTexture();
  const w = 0.4;
  const h = w * (CODE_H / CODE_W);

  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[w + 0.025, h + 0.025, 0.02]} radius={0.007} smoothness={4} position={[0, 0, 0.005]} castShadow>
        <meshPhysicalMaterial color={BEZEL} roughness={0.42} metalness={0.15} clearcoat={0.4} clearcoatRoughness={0.3} />
      </RoundedBox>
      <RoundedBox args={[w + 0.015, h + 0.015, 0.02]} radius={0.008} smoothness={4} position={[0, 0, -0.012]} castShadow>
        <meshStandardMaterial color="#d9dbe0" metalness={0.7} roughness={0.38} roughnessMap={brushed} />
      </RoundedBox>
      <mesh position={[0, 0, 0.0155]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={surface.texture} toneMapped={false} />
      </mesh>
      {/* pivot mount + short neck down to the riser */}
      <mesh position={[0, 0, -0.03]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.035, 0.035, 0.018, 24]} />
        <meshStandardMaterial color="#2a2a30" metalness={0.6} roughness={0.35} />
      </mesh>
      <RoundedBox args={[0.05, h / 2 + 0.02, 0.018]} radius={0.006} position={[0, -h / 4 - 0.01, -0.045]} castShadow>
        <meshStandardMaterial color="#cfd1d6" metalness={0.85} roughness={0.3} roughnessMap={brushed} />
      </RoundedBox>
    </group>
  );
}

export function Laptop({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  const surface = useCanvasTexture(1000, 620);

  useEffect(() => {
    surface.paint((ctx) => drawWallpaper(ctx, 1000, 620));
  }, [surface]);

  const keys = useMemo(() => {
    const list: { x: number; z: number; w: number }[] = [];
    const rows = [14, 14, 13, 12];
    rows.forEach((n, r) => {
      const pitch = 0.0205;
      const off = (-(n - 1) * pitch) / 2;
      for (let c = 0; c < n; c++) list.push({ x: off + c * pitch, z: -0.085 + r * 0.021, w: 0.0172 });
    });
    list.push({ x: 0, z: -0.085 + 4 * 0.021, w: 0.1 }); // space bar
    return list;
  }, []);
  const keycap = useMemo(() => new RoundedBoxGeometry(1, 0.0016, 0.0172, 2, 0.0006), []);
  const alu = <meshPhysicalMaterial color="#c7cad1" metalness={0.9} roughness={0.32} clearcoat={0.2} clearcoatRoughness={0.4} />;
  const W = 0.32;
  const D = 0.222;

  return (
    <group position={position} rotation={rotation}>
      {/* unibody base: thin slab with rounded corners; a slightly smaller top plate gives the chamfered edge */}
      <RoundedBox args={[W, 0.008, D]} radius={0.0035} smoothness={4} position={[0, 0.004, 0]} castShadow receiveShadow>
        {alu}
      </RoundedBox>
      <RoundedBox args={[W - 0.004, 0.0012, D - 0.004]} radius={0.0006} position={[0, 0.0084, 0]}>
        <meshPhysicalMaterial color="#d3d6dc" metalness={0.9} roughness={0.22} />
      </RoundedBox>
      {/* keyboard well + individual black keys */}
      <mesh position={[0, 0.0091, -0.042]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.296, 0.108]} />
        <meshStandardMaterial color="#202227" roughness={0.9} />
      </mesh>
      <Instances limit={64} geometry={keycap}>
        <meshStandardMaterial color="#141519" roughness={0.6} />
        {keys.map((k, i) => (
          <Instance key={i} position={[k.x, 0.0098, k.z]} scale={[k.w, 1, 1]} />
        ))}
      </Instances>
      {/* glass trackpad */}
      <RoundedBox args={[0.12, 0.0006, 0.072]} radius={0.0003} position={[0, 0.0092, 0.064]}>
        <meshPhysicalMaterial color="#c2c5cc" metalness={0.6} roughness={0.12} clearcoat={1} />
      </RoundedBox>
      {/* front lip notch */}
      <mesh position={[0, 0.006, D / 2 + 0.0001]}>
        <boxGeometry args={[0.04, 0.003, 0.0006]} />
        <meshStandardMaterial color="#9da1a8" metalness={0.9} roughness={0.4} />
      </mesh>
      {/* hinge barrel */}
      <mesh position={[0, 0.0085, -D / 2 + 0.002]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.0042, 0.0042, W - 0.06, 20]} />
        <meshStandardMaterial color="#2a2c31" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* lid */}
      <group position={[0, 0.0085, -D / 2 + 0.002]} rotation={[-0.3, 0, 0]}>
        <RoundedBox args={[W, 0.212, 0.005]} radius={0.0025} smoothness={4} position={[0, 0.106, -0.0025]} castShadow>
          {alu}
        </RoundedBox>
        {/* back logo */}
        <mesh position={[0, 0.112, -0.0052]} rotation-y={Math.PI}>
          <circleGeometry args={[0.011, 32]} />
          <meshPhysicalMaterial color="#e8eaee" metalness={1} roughness={0.08} />
        </mesh>
        {/* black glass bezel, then the screen */}
        <mesh position={[0, 0.106, 0.0001]}>
          <planeGeometry args={[W - 0.006, 0.206]} />
          <meshPhysicalMaterial color="#08090b" roughness={0.08} clearcoat={1} />
        </mesh>
        <mesh position={[0, 0.108, 0.0004]}>
          <planeGeometry args={[W - 0.018, 0.19]} />
          <meshBasicMaterial map={surface.texture} toneMapped={false} />
        </mesh>
        {/* camera */}
        <mesh position={[0, 0.2045, 0.0004]}>
          <circleGeometry args={[0.0014, 12]} />
          <meshStandardMaterial color="#1d2a3a" roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

export function PhoneStand({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const surface = useCanvasTexture(200, 420);

  useEffect(() => {
    surface.paint((ctx) => drawPhoneScreen(ctx, 200, 420));
  }, [surface]);

  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.08, 0.012, 0.07]} radius={0.004} position={[0, 0.006, 0]}>
        <meshStandardMaterial color="#1c1c20" />
      </RoundedBox>
      <group position={[0, 0.012, -0.01]} rotation={[-0.25, 0, 0]}>
        <mesh position={[0, 0.035, -0.012]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.03, 0.07, 0.008]} />
          <meshStandardMaterial color="#1c1c20" />
        </mesh>
        <RoundedBox args={[0.072, 0.15, 0.008]} radius={0.004} position={[0, 0.08, 0]}>
          <meshStandardMaterial color="#0d0d10" roughness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0.08, 0.0045]}>
          <planeGeometry args={[0.064, 0.14]} />
          <meshBasicMaterial map={surface.texture} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
