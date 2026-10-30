"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Leaf: tapered blade with a V-fold along the midrib and a droop toward the tip.
// Vertex colours brighten the midrib and darken the edges so leaves read as leaves.
function makeLeaf() {
  const g = new THREE.PlaneGeometry(1, 1, 6, 14);
  const pos = g.attributes.position;
  const col: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) * 2; // -1..1 across
    const v = pos.getY(i) + 0.5; // 0 base .. 1 tip
    const w = Math.pow(Math.sin(Math.PI * Math.min(v * 1.05, 1)), 0.75) * (1 - 0.25 * v);
    const x = u * 0.5 * w;
    const z = Math.abs(u) * w * 0.12 + v * v * 0.28;
    pos.setXYZ(i, x, v, z);
    const rib = 1 - Math.min(Math.abs(u) * 4, 1);
    const shade = 0.82 + 0.18 * (1 - Math.abs(u)) + rib * 0.18 + v * 0.05;
    col.push(shade, shade + rib * 0.04, shade * (1 - rib * 0.08));
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}
const leafGeometry = makeLeaf();

function makePot(r: number, h: number) {
  const P = (x: number, y: number) => new THREE.Vector2(x, y);
  return new THREE.LatheGeometry(
    [
      P(0, 0), P(r * 0.74, 0), P(r * 0.78, 0.008), P(r * 0.97, h - 0.016), P(r * 1.04, h - 0.012),
      P(r * 1.06, h - 0.004), P(r * 1.03, h), P(r * 0.95, h), P(r * 0.93, h - 0.01), P(r * 0.9, h - 0.03),
    ],
    40,
  );
}

function makeSoil(r: number, seed: number) {
  const g = new THREE.CircleGeometry(r, 28, 0, Math.PI * 2);
  const pos = g.attributes.position;
  const rand = seeded(seed + 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    const edge = Math.hypot(x, y) / r;
    pos.setZ(i, (1 - edge * edge) * 0.012 + (rand() - 0.5) * 0.004);
  }
  g.computeVertexNormals();
  return g;
}

type PlantProps = {
  position: [number, number, number];
  scale?: number;
  leaves?: number;
  leafSize?: [number, number];
  height?: number;
  potColor?: string;
  potRadius?: number;
  potHeight?: number;
  seed?: number;
  spread?: number;
};

const GREENS = ["#2f7d3b", "#3c9447", "#4caf50", "#2e6b34", "#58a95c"];

export function Plant({
  position,
  scale = 1,
  leaves = 14,
  leafSize = [0.05, 0.13],
  height = 0.12,
  potColor = "#f5f2ec",
  potRadius = 0.09,
  potHeight = 0.16,
  seed = 7,
  spread = 1,
}: PlantProps) {
  const group = useRef<THREE.Group>(null);

  const leafData = useMemo(() => {
    const rand = seeded(seed);
    return Array.from({ length: leaves }, (_, i) => {
      const angle = (i / leaves) * Math.PI * 2 + rand() * 0.6;
      const tilt = (0.35 + rand() * 0.75) * spread;
      const len = leafSize[1] * (0.75 + rand() * 0.5);
      const width = leafSize[0] * (0.8 + rand() * 0.4);
      const stem = height * (0.4 + rand() * 0.8);
      const c = new THREE.Color(GREENS[Math.floor(rand() * GREENS.length)]);
      c.offsetHSL((rand() - 0.5) * 0.03, (rand() - 0.5) * 0.12, (rand() - 0.5) * 0.06 + (tilt < 0.6 ? 0.04 : 0));
      return { angle, tilt, len, width, stem, twist: (rand() - 0.5) * 0.6, lean: 0.08 + rand() * 0.28, off: 0.006 + rand() * 0.02, color: c };
    });
  }, [leaves, leafSize, height, seed, spread]);

  const pot = useMemo(() => makePot(potRadius, potHeight), [potRadius, potHeight]);
  const soil = useMemo(() => makeSoil(potRadius * 0.92, seed), [potRadius, seed]);
  const pebbles = useMemo(() => {
    const rand = seeded(seed + 11);
    return Array.from({ length: 7 }, () => {
      const a = rand() * Math.PI * 2, d = rand() * potRadius * 0.75;
      return { p: [Math.cos(a) * d, potHeight - 0.024, Math.sin(a) * d] as [number, number, number], s: 0.004 + rand() * 0.005, c: rand() > 0.5 ? "#b9ab98" : "#8c8172" };
    });
  }, [seed, potRadius, potHeight]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    group.current.rotation.z = Math.sin(t * 0.8 + seed) * 0.015;
    group.current.rotation.x = Math.cos(t * 0.6 + seed) * 0.012;
  });

  return (
    <group position={position} scale={scale}>
      <mesh geometry={pot} castShadow receiveShadow>
        <meshPhysicalMaterial color={potColor} roughness={0.45} clearcoat={0.5} clearcoatRoughness={0.35} side={THREE.DoubleSide} />
      </mesh>
      {/* saucer */}
      <mesh position={[0, 0.004, 0]} receiveShadow>
        <cylinderGeometry args={[potRadius * 0.95, potRadius * 0.88, 0.008, 32]} />
        <meshStandardMaterial color={potColor} roughness={0.6} />
      </mesh>
      <mesh geometry={soil} position={[0, potHeight - 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <meshStandardMaterial color="#3e2b1f" roughness={1} />
      </mesh>
      {pebbles.map((pb, i) => (
        <mesh key={i} position={pb.p} scale={[pb.s, pb.s * 0.6, pb.s]}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color={pb.c} roughness={0.9} />
        </mesh>
      ))}
      <group ref={group} position={[0, potHeight - 0.025, 0]}>
        {leafData.map((l, i) => (
          <group key={i} rotation={[0, l.angle, 0]}>
           <group position={[0, 0, l.off]} rotation-x={l.lean}>
            <mesh position={[0, l.stem / 2, 0]}>
              <cylinderGeometry args={[0.004, 0.005, l.stem, 5]} />
              <meshStandardMaterial color="#4a7a35" roughness={0.6} />
            </mesh>
            <group position={[0, l.stem, 0]} rotation={[l.tilt, 0, 0]}>
              <mesh geometry={leafGeometry} rotation-y={l.twist} scale={[l.width * 2, l.len * 2, l.len * 2]} castShadow>
                <meshPhysicalMaterial color={l.color} vertexColors roughness={0.5} sheen={0.4} sheenColor="#d8f5b0" side={THREE.DoubleSide} />
              </mesh>
            </group>
           </group>
          </group>
        ))}
      </group>
    </group>
  );
}
