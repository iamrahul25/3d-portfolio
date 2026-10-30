"use client";

import { useTheme } from "@/lib/theme";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Instance, Instances, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { Plant } from "./parts/Plant";
import { CatFigurine } from "./parts/CatFigurine";
import { Window } from "./parts/Window";

const WALL = "#f3ece3";
const WOOD = "#d8b07a";

function FadingWall({
  position,
  rotation,
  size,
  normal,
  children,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  normal: [number, number, number];
  children?: React.ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const n = useMemo(() => new THREE.Vector3(...normal), [normal]);
  const p = useMemo(() => new THREE.Vector3(...position), [position]);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera }, delta) => {
    if (!material.current || !group.current) return;
    const facing = tmp.copy(camera.position).sub(p).dot(n) > 0;
    const target = facing ? 1 : 0;
    const m = material.current;
    m.opacity = THREE.MathUtils.damp(m.opacity, target, 6, delta);
    m.depthWrite = m.opacity > 0.95;
    group.current.visible = m.opacity > 0.02;
  });

  return (
    <group ref={group}>
      <group position={position} rotation={rotation}>
        <mesh receiveShadow>
          <planeGeometry args={size} />
          <meshStandardMaterial ref={material} color={WALL} roughness={0.95} transparent />
        </mesh>
        <mesh position={[0, -size[1] / 2 + 0.04, 0.008]}>
          <boxGeometry args={[size[0], 0.08, 0.016]} />
          <meshStandardMaterial color="#ebe2d6" roughness={0.8} />
        </mesh>
      </group>
      {children}
    </group>
  );
}

function ShelfBooks({ position }: { position: [number, number, number] }) {
  const books = useMemo(() => {
    const colors = ["#1f2937", "#e7dfd2", "#3f3f46", "#d4a373", "#f5f5f4", "#27272a", "#a8a29e"];
    let x = 0;
    return colors.map((c, i) => {
      const w = 0.035 + ((i * 7) % 3) * 0.008;
      const h = 0.2 + ((i * 5) % 4) * 0.025;
      const book = { x: x + w / 2, w, h, c };
      x += w + 0.004;
      return book;
    });
  }, []);
  return (
    <group position={position}>
      {books.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, 0]}>
          <boxGeometry args={[b.w, b.h, 0.16]} />
          <meshStandardMaterial color={b.c} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Shelf() {
  const night = useTheme() === "dark";
  const y = 2.05;
  return (
    <group position={[-0.1, y, -2.08]}>
      <RoundedBox args={[1.9, 0.04, 0.24]} radius={0.008}>
        <meshStandardMaterial color={WOOD} roughness={0.55} />
      </RoundedBox>
      <mesh position={[0, -0.026, 0.08]}>
        <boxGeometry args={[1.82, 0.01, 0.02]} />
        <meshStandardMaterial color="#fff2c9" emissive="#ffc85a" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <pointLight position={[0, -0.15, 0.2]} color="#ffc061" intensity={night ? 3.2 : 1.4} distance={2.2} decay={1.5} />
      {[-0.75, 0.75].map((x) => (
        <mesh key={x} position={[x, -0.06, -0.06]}>
          <boxGeometry args={[0.03, 0.1, 0.1]} />
          <meshStandardMaterial color="#1b1b1f" />
        </mesh>
      ))}
      <ShelfBooks position={[0.15, 0.02, 0]} />
      <CatFigurine position={[-0.3, 0.02, 0]} scale={1.15} rotation={[0, 0.2, 0]} />
      <Plant position={[-0.75, 0.02, 0]} scale={0.8} leaves={14} seed={11} spread={1.3} leafSize={[0.04, 0.12]} />
      <Plant position={[0.72, 0.02, 0]} scale={0.6} leaves={10} seed={5} potColor="#1f1f23" />
      <group position={[0.45, 0.02, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.018 + i * 0.036, 0]} rotation={[0, i * 0.12 - 0.1, 0]}>
            <boxGeometry args={[0.2, 0.034, 0.15]} />
            <meshStandardMaterial color={["#e7e5e4", "#292524", "#d6a461"][i]} roughness={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Pegboard() {
  const holes = useMemo(() => {
    const list: [number, number][] = [];
    for (let x = 0; x < 13; x++) for (let y = 0; y < 10; y++) list.push([-0.39 + x * 0.065, -0.3 + y * 0.065]);
    return list;
  }, []);
  const notes: { p: [number, number]; r: number; s: [number, number] }[] = [
    { p: [-0.22, 0.12], r: 0.05, s: [0.2, 0.22] },
    { p: [0.08, 0.15], r: -0.04, s: [0.17, 0.2] },
    { p: [0.25, -0.12], r: 0.06, s: [0.18, 0.2] },
    { p: [-0.12, -0.17], r: -0.03, s: [0.22, 0.16] },
  ];
  return (
    <group position={[1.6, 1.55, -2.185]}>
      <RoundedBox args={[0.92, 0.72, 0.025]} radius={0.01}>
        <meshStandardMaterial color="#d79b5c" roughness={0.75} />
      </RoundedBox>
      <Instances limit={200}>
        <circleGeometry args={[0.007, 8]} />
        <meshBasicMaterial color="#8a5a2b" />
        {holes.map(([x, y], i) => (
          <Instance key={i} position={[x, y, 0.0135]} />
        ))}
      </Instances>
      {notes.map((n, i) => (
        <group key={i} position={[n.p[0], n.p[1], 0.016]} rotation={[0, 0, n.r]}>
          <mesh>
            <planeGeometry args={n.s} />
            <meshStandardMaterial color="#fbf8f1" roughness={0.9} />
          </mesh>
          {[0, 1, 2].map((l) => (
            <mesh key={l} position={[-n.s[0] * 0.1, n.s[1] * 0.15 - l * 0.035, 0.001]}>
              <planeGeometry args={[n.s[0] * 0.6, 0.008]} />
              <meshBasicMaterial color="#c8c2b6" />
            </mesh>
          ))}
          <mesh position={[0, n.s[1] / 2 - 0.015, 0.008]}>
            <sphereGeometry args={[0.012, 12, 8]} />
            <meshStandardMaterial color={["#ef4444", "#111827", "#f59e0b", "#111827"][i]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function WallArt() {
  return (
    <group>
      <RoundedBox args={[0.6, 0.72, 0.03]} radius={0.006}>
        <meshStandardMaterial color="#fafaf9" roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0, 0.016]}>
        <planeGeometry args={[0.48, 0.6]} />
        <meshStandardMaterial color="#f1efea" />
      </mesh>
      <mesh position={[-0.05, 0.04, 0.018]}>
        <planeGeometry args={[0.22, 0.34]} />
        <meshStandardMaterial color="#3f3f46" />
      </mesh>
      <mesh position={[0.07, -0.06, 0.019]}>
        <planeGeometry args={[0.18, 0.26]} />
        <meshStandardMaterial color="#a8a29e" />
      </mesh>
    </group>
  );
}

function PCTower({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.22, 0.46, 0.46]} radius={0.012} position={[0, 0.23, 0]}>
        <meshStandardMaterial color="#18181b" roughness={0.35} metalness={0.3} />
      </RoundedBox>
      <mesh position={[0.111, 0.25, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.36, 0.34]} />
        <meshStandardMaterial color="#232327" roughness={0.2} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.25, 0.231]}>
        <boxGeometry args={[0.01, 0.32, 0.002]} />
        <meshStandardMaterial color="#ffd27a" emissive="#ffb340" emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function Room() {
  return (
    <group>
      <RoundedBox args={[5.4, 0.16, 4.2]} radius={0.05} smoothness={4} position={[0, -0.08, -0.15]}>
        <meshStandardMaterial color="#efe5d8" roughness={0.9} />
      </RoundedBox>

      <RoundedBox args={[2.0, 0.014, 1.55]} radius={0.006} position={[-0.1, 0.007, -0.6]}>
        <meshStandardMaterial color="#f0ae35" roughness={1} />
      </RoundedBox>

      <FadingWall position={[0, 1.5, -2.22]} rotation={[0, 0, 0]} size={[5.4, 3]} normal={[0, 0, 1]}>
        <Shelf />
        <Pegboard />
      </FadingWall>
      <FadingWall
        position={[-2.69, 1.5, -0.85]}
        rotation={[0, Math.PI / 2, 0]}
        size={[2.75, 3]}
        normal={[1, 0, 0]}
      >
        <group position={[-2.67, 1.7, -1.1]} rotation={[0, Math.PI / 2, 0]}>
          <WallArt />
        </group>
        <group position={[-2.675, 1.65, -0.05]} rotation={[0, Math.PI / 2, 0]}>
          <Window width={0.85} height={0.95} />
        </group>
      </FadingWall>
      <PCTower position={[1.68, 0, -1.5]} />

      <Plant
        position={[-2.15, 0, -1.75]}
        scale={1.9}
        leaves={24}
        leafSize={[0.04, 0.14]}
        height={0.26}
        seed={21}
        potRadius={0.1}
        potHeight={0.2}
      />
      <Plant
        position={[2.2, 0, -1.85]}
        scale={1.8}
        leaves={22}
        leafSize={[0.04, 0.14]}
        height={0.24}
        seed={42}
        potRadius={0.1}
        potHeight={0.2}
      />
      <Plant position={[-2.2, 0, 0.9]} scale={1.6} leaves={14} seed={9} />
      <Plant position={[2.25, 0, 1.1]} scale={1.4} leaves={12} seed={17} potColor="#1f1f23" />
    </group>
  );
}
