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

const leafGeometry = new THREE.SphereGeometry(1, 14, 10);

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
      return { angle, tilt, len, width, stem, color: GREENS[Math.floor(rand() * GREENS.length)] };
    });
  }, [leaves, leafSize, height, seed, spread]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    group.current.rotation.z = Math.sin(t * 0.8 + seed) * 0.015;
    group.current.rotation.x = Math.cos(t * 0.6 + seed) * 0.012;
  });

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, potHeight / 2, 0]}>
        <cylinderGeometry args={[potRadius, potRadius * 0.78, potHeight, 32, 1, true]} />
        <meshStandardMaterial color={potColor} roughness={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, potHeight - 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[potRadius * 0.96, 32]} />
        <meshStandardMaterial color="#4a3426" roughness={1} />
      </mesh>
      <group ref={group} position={[0, potHeight, 0]}>
        {leafData.map((l, i) => (
          <group key={i} rotation={[0, l.angle, 0]}>
            <mesh position={[0, l.stem / 2, 0]}>
              <cylinderGeometry args={[0.004, 0.005, l.stem, 5]} />
              <meshStandardMaterial color="#3d6b2f" />
            </mesh>
            <group position={[0, l.stem, 0]} rotation={[l.tilt, 0, 0]}>
              <mesh geometry={leafGeometry} position={[0, l.len, 0]} scale={[l.width, l.len, l.width * 0.18]}>
                <meshStandardMaterial color={l.color} roughness={0.6} side={THREE.DoubleSide} />
              </mesh>
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}
