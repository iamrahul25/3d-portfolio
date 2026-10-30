"use client";

import * as THREE from "three";
import { Limb } from "./Limb";
import { useTheme } from "@/lib/theme";

const BLACK = "#16161a";

export function Lamp({ position }: { position: [number, number, number] }) {
  const night = useTheme() === "dark";
  const base: [number, number, number] = [0, 0.02, 0];
  const elbow: [number, number, number] = [0.04, 0.48, 0.02];
  const head: [number, number, number] = [0.3, 0.66, 0.2];

  return (
    <group position={position}>
      <mesh position={[0, 0.012, 0]}>
        <cylinderGeometry args={[0.08, 0.09, 0.024, 32]} />
        <meshStandardMaterial color={BLACK} roughness={0.4} metalness={0.4} />
      </mesh>
      <Limb from={base} to={elbow} radius={0.009} color={BLACK} roughness={0.4} />
      <Limb from={elbow} to={head} radius={0.009} color={BLACK} roughness={0.4} />
      <mesh position={elbow}>
        <sphereGeometry args={[0.018, 16, 12]} />
        <meshStandardMaterial color={BLACK} />
      </mesh>
      <group position={head} rotation={[-0.25, 0, 0.75]}>
        <mesh position={[0, -0.04, 0]}>
          <cylinderGeometry args={[0.035, 0.11, 0.13, 32, 1, true]} />
          <meshStandardMaterial color={BLACK} roughness={0.35} metalness={0.3} side={THREE.FrontSide} />
        </mesh>
        <mesh position={[0, -0.04, 0]}>
          <cylinderGeometry args={[0.034, 0.108, 0.128, 32, 1, true]} />
          <meshStandardMaterial
            color="#ffd76a"
            emissive="#ffc23d"
            emissiveIntensity={1.6}
            side={THREE.BackSide}
          />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.02, 24]} />
          <meshStandardMaterial color={BLACK} />
        </mesh>
        <mesh position={[0, -0.07, 0]}>
          <sphereGeometry args={[0.035, 20, 16]} />
          <meshStandardMaterial color="#fff6d8" emissive="#ffd36b" emissiveIntensity={night ? 6 : 3} toneMapped={false} />
        </mesh>
        <pointLight position={[0, -0.14, 0]} color="#ffbe55" intensity={night ? 4 : 2.2} distance={night ? 3.5 : 2.6} decay={1.6}
          castShadow={night}
          shadow-mapSize={[512, 512]}
          shadow-bias={-0.002} />
      </group>
    </group>
  );
}
