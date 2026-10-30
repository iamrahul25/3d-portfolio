"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Instance, Instances, RoundedBox } from "@react-three/drei";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { brushedTexture, fabricTexture, woodTexture } from "./materials";
import { Lamp } from "./parts/Lamp";
import { CatFigurine } from "./parts/CatFigurine";
import { Plant } from "./parts/Plant";
import { CodeMonitor, Laptop, PhoneStand } from "./Monitors";

export const DESK_TOP_Y = 0.785;
const WOOD = "#d8b07a";
const METAL = "#1b1b1f";
const WHITE = "#f4f3ef";

function Keyboard({ position }: { position: [number, number, number] }) {
  const keys = useMemo(() => {
    const list: { x: number; z: number; w: number }[] = [];
    const cols = 15;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < cols; c++) {
        list.push({ x: -0.205 + c * 0.0293, z: -0.056 + r * 0.028, w: 0.024 });
      }
    }
    list.push({ x: 0, z: 0.084, w: 0.17 });
    return list;
  }, []);

  const keycap = useMemo(() => new RoundedBoxGeometry(1, 0.012, 0.022, 2, 0.004), []);
  const brushed = brushedTexture();

  return (
    <group position={position}>
      {/* aluminium case, slightly wedge-shaped */}
      <RoundedBox args={[0.46, 0.018, 0.17]} radius={0.007} smoothness={3} rotation-x={0.035} castShadow receiveShadow>
        <meshStandardMaterial color="#3a3c43" metalness={0.75} roughness={0.38} roughnessMap={brushed} />
      </RoundedBox>
      <Instances limit={100} geometry={keycap} castShadow>
        <meshStandardMaterial color="#25262c" roughness={0.55} />
        {keys.map((k, i) => (
          <Instance key={i} position={[k.x, 0.014 + (k.z + 0.06) * 0.03, k.z]} scale={[k.w, 1, 1]} />
        ))}
      </Instances>
      {/* accent escape + enter keys */}
      <mesh geometry={keycap} position={[-0.205, 0.0135, -0.056]} scale={[0.024, 1.02, 1.02]}>
        <meshStandardMaterial color="#f5b400" roughness={0.5} />
      </mesh>
      <mesh geometry={keycap} position={[0.205, 0.0145, 0.0]} scale={[0.024, 1.02, 1.02]}>
        <meshStandardMaterial color="#e9e6df" roughness={0.5} />
      </mesh>
    </group>
  );
}

function Cable({ points, radius = 0.006, color = "#151518" }: { points: [number, number, number][]; radius?: number; color?: string }) {
  const geo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, "centripetal");
    return new THREE.TubeGeometry(curve, 48, radius, 8, false);
  }, [points, radius]);
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color={color} roughness={0.45} />
    </mesh>
  );
}

function Mug({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.038, 0.034, 0.1, 32]} />
        <meshStandardMaterial color="#fbfaf7" roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.093, 0]}>
        <cylinderGeometry args={[0.033, 0.033, 0.005, 32]} />
        <meshStandardMaterial color="#5a3a22" roughness={0.2} />
      </mesh>
      <mesh position={[0.042, 0.05, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.022, 0.006, 10, 24, Math.PI]} />
        <meshStandardMaterial color="#fbfaf7" roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.002, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.004, 32]} />
        <meshStandardMaterial color="#b98a55" roughness={0.8} />
      </mesh>
    </group>
  );
}

function PencilCup({ position }: { position: [number, number, number] }) {
  const pencils: { r: [number, number, number]; c: string; x: number }[] = [
    { r: [0.15, 0, 0.1], c: "#f5b400", x: -0.01 },
    { r: [-0.1, 0, -0.12], c: "#f5b400", x: 0.012 },
    { r: [0.05, 0, -0.2], c: "#111111", x: 0.004 },
    { r: [-0.18, 0, 0.18], c: "#e5e7eb", x: -0.004 },
  ];
  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.1, 24, 1, true]} />
        <meshStandardMaterial color="#1d1d21" roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      {pencils.map((p, i) => (
        <mesh key={i} position={[p.x, 0.1, 0]} rotation={p.r}>
          <cylinderGeometry args={[0.004, 0.004, 0.16, 6]} />
          <meshStandardMaterial color={p.c} />
        </mesh>
      ))}
    </group>
  );
}

function Book({
  position,
  size,
  color,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0.004, 0, 0]}>
        <boxGeometry args={[size[0] - 0.006, size[1] * 0.8, size[2] + 0.002]} />
        <meshStandardMaterial color="#f6f1e6" roughness={0.9} />
      </mesh>
    </group>
  );
}

function DrawerCabinet({ position }: { position: [number, number, number] }) {
  const w = 0.44;
  const h = 0.6;
  const d = 0.58;
  return (
    <group position={position}>
      <RoundedBox args={[w, h, d]} radius={0.012} smoothness={3} position={[0, h / 2 + 0.03, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={WHITE} roughness={0.5} />
      </RoundedBox>
      {[0, 1, 2].map((i) => {
        const y = 0.03 + h - 0.1 - i * 0.19;
        return (
          <group key={i} position={[0, y, d / 2 + 0.004]}>
            <RoundedBox args={[w - 0.03, 0.172, 0.014]} radius={0.005} smoothness={3} castShadow>
              <meshStandardMaterial color="#f7f6f2" roughness={0.42} />
            </RoundedBox>
            <mesh position={[0, 0.055, 0.014]} rotation-z={Math.PI / 2} castShadow>
              <capsuleGeometry args={[0.0055, 0.11, 4, 10]} />
              <meshStandardMaterial color="#c9ccd2" metalness={0.9} roughness={0.25} />
            </mesh>
          </group>
        );
      })}
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <mesh key={i} position={[(sx * (w - 0.06)) / 2, 0.015, (sz * (d - 0.06)) / 2]}>
          <sphereGeometry args={[0.015, 12, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}
    </group>
  );
}

export function Desk() {
  const legX = 1.33;
  const legZ = [-1.27, -1.93];
  const topH = 0.05;
  const topY = DESK_TOP_Y - topH / 2;
  const legH = topY - topH / 2;
  const y = DESK_TOP_Y;
  const wood = useMemo(() => {
    const t = woodTexture("#d2a46c", 7).clone();
    t.repeat.set(2.2, 0.7);
    t.needsUpdate = true;
    return t;
  }, []);
  const brushed = brushedTexture();
  const mat = useMemo(() => {
    const t = fabricTexture("#2b2c32", 4).clone();
    t.repeat.set(4, 1.4);
    t.needsUpdate = true;
    return t;
  }, []);
  const frame = <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.42} roughnessMap={brushed} />;

  return (
    <group>
      {/* solid oak top with soft rounded edges and visible grain */}
      <RoundedBox args={[2.8, topH, 0.86]} radius={0.016} smoothness={4} position={[0, topY, -1.6]} castShadow receiveShadow>
        <meshStandardMaterial
          color="#f3d7b0"
          map={wood}
          bumpMap={wood}
          bumpScale={0.6}
          roughness={0.48}
          metalness={0}
        />
      </RoundedBox>

      {[-1, 1].map((s) => (
        <group key={s} position={[s * legX, 0, 0]}>
          {legZ.map((z) => (
            <RoundedBox key={z} args={[0.045, legH, 0.045]} radius={0.008} smoothness={2} position={[0, legH / 2, z]} castShadow>
              {frame}
            </RoundedBox>
          ))}
          <RoundedBox args={[0.06, 0.04, 0.8]} radius={0.01} smoothness={2} position={[0, 0.026, -1.6]} castShadow>
            {frame}
          </RoundedBox>
          {/* levelling feet */}
          {[-1.97, -1.23].map((z) => (
            <mesh key={z} position={[0, 0.003, z]}>
              <cylinderGeometry args={[0.022, 0.024, 0.006, 16]} />
              <meshStandardMaterial color="#0f0f12" roughness={0.8} />
            </mesh>
          ))}
          <RoundedBox args={[0.04, 0.04, 0.7]} radius={0.008} smoothness={2} position={[0, legH - 0.03, -1.6]}>
            {frame}
          </RoundedBox>
        </group>
      ))}
      <RoundedBox args={[2.62, 0.04, 0.03]} radius={0.008} smoothness={2} position={[0, legH - 0.03, -1.93]}>
        {frame}
      </RoundedBox>
      {/* under-desk cable tray + cables dropping to the PC */}
      <mesh position={[-0.1, legH - 0.09, -1.86]}>
        <boxGeometry args={[1.2, 0.06, 0.1]} />
        <meshStandardMaterial color="#1a1a1e" metalness={0.5} roughness={0.5} wireframe={false} />
      </mesh>
      <Cable points={[[-0.1, y + 0.05, -1.98], [-0.1, y - 0.02, -2.0], [-0.05, legH - 0.07, -1.9], [0.6, legH - 0.08, -1.88], [1.2, legH - 0.1, -1.9], [1.55, 0.5, -1.7], [1.6, 0.35, -1.62]]} />
      <Cable points={[[1.02, y + 0.09, -1.95], [1.05, y - 0.01, -2.0], [1.1, legH - 0.07, -1.9], [1.45, 0.5, -1.72], [1.58, 0.3, -1.62]]} radius={0.005} />
      <Cable points={[[-0.95, y + 0.01, -1.72], [-1.1, y + 0.005, -1.95], [-1.15, y - 0.05, -2.02], [-1.0, legH - 0.07, -1.9], [-0.2, legH - 0.08, -1.88]]} radius={0.004} color="#e8e6e1" />

      <DrawerCabinet position={[0.82, 0, -1.6]} />

      {/* felt desk mat */}
      <RoundedBox args={[0.95, 0.004, 0.34]} radius={0.0019} smoothness={2} position={[0.05, y + 0.002, -1.42]} receiveShadow>
        <meshStandardMaterial color="#ffffff" map={mat} roughness={0.95} />
      </RoundedBox>
      <Keyboard position={[-0.12, y + 0.013, -1.42]} />
      <group position={[0.31, y + 0.016, -1.42]}>
        <mesh scale={[0.032, 0.016, 0.052]}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshStandardMaterial color="#141418" roughness={0.3} />
        </mesh>
      </group>

      <Mug position={[0.48, y, -1.74]} />
      <PencilCup position={[0.66, y, -1.95]} />
      <PhoneStand position={[0.66, y, -1.56]} rotation={[0, -0.35, 0]} />
      <RoundedBox args={[0.1, 0.024, 0.065]} radius={0.008} position={[0.36, y + 0.012, -1.68]}>
        <meshStandardMaterial color="#f7f7f5" roughness={0.3} />
      </RoundedBox>

      <group position={[0.68, y + 0.012, -1.3]} rotation={[0, -0.12, 0]}>
        <RoundedBox args={[0.22, 0.022, 0.28]} radius={0.006}>
          <meshStandardMaterial color="#1b1b1f" roughness={0.6} />
        </RoundedBox>
        <mesh position={[0.02, 0.016, 0]} rotation={[Math.PI / 2, 0, 0.5]}>
          <cylinderGeometry args={[0.005, 0.005, 0.15, 8]} />
          <meshStandardMaterial color="#d4a017" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      <Book position={[1.02, y + 0.022, -1.8]} size={[0.32, 0.044, 0.26]} color="#1f2937" />
      <Book position={[1.02, y + 0.064, -1.8]} size={[0.3, 0.04, 0.24]} color="#e0a43a" rotation={[0, 0.08, 0]} />
      <CodeMonitor position={[1.02, y + 0.084 + 0.42, -1.79]} rotation={[0, -0.5, 0]} />
      <CatFigurine position={[1.3, y, -1.42]} rotation={[0, -0.7, 0]} scale={0.9} />

      <Book position={[-1.25, y + 0.02, -1.85]} size={[0.28, 0.04, 0.22]} color="#e6dccb" />
      <Book position={[-1.25, y + 0.058, -1.85]} size={[0.26, 0.036, 0.2]} color="#c2763a" rotation={[0, 0.15, 0]} />
      <Lamp position={[-1.25, y + 0.076, -1.85]} />
      <Laptop position={[-0.88, y, -1.55]} rotation={[0, 0.5, 0]} />
      <Plant position={[-1.26, y, -1.35]} scale={0.7} leaves={12} seed={3} />
    </group>
  );
}
