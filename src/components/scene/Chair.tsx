"use client";

import { RoundedBox } from "@react-three/drei";

const WHITE = "#f2f2ef";
const MESH = "#202024";

export function Chair({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.52, 0.03, 0.5]} radius={0.012} position={[0, 0.425, 0]}>
        <meshStandardMaterial color={WHITE} roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.07, 0.48]} radius={0.03} smoothness={4} position={[0, 0.47, -0.01]}>
        <meshStandardMaterial color={MESH} roughness={0.85} />
      </RoundedBox>

      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.3, 16]} />
        <meshStandardMaterial color="#8d8f95" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.036, 0.04, 0.14, 16]} />
        <meshStandardMaterial color="#1e1e22" />
      </mesh>

      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <mesh position={[0.15, 0.08, 0]} rotation={[0, 0, -0.08]}>
              <boxGeometry args={[0.3, 0.035, 0.05]} />
              <meshStandardMaterial color={WHITE} roughness={0.4} />
            </mesh>
            <mesh position={[0.29, 0.03, 0]}>
              <sphereGeometry args={[0.03, 16, 12]} />
              <meshStandardMaterial color="#18181b" roughness={0.4} />
            </mesh>
          </group>
        );
      })}

      <mesh position={[0, 0.55, 0.25]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[0.07, 0.24, 0.03]} />
        <meshStandardMaterial color={WHITE} roughness={0.4} />
      </mesh>

      <group position={[0, 0.98, 0.29]} rotation={[0.12, 0, 0]}>
        {[-1, 1].map((s) => (
          <RoundedBox key={`v${s}`} args={[0.045, 0.64, 0.05]} radius={0.018} position={[s * 0.235, 0, 0]}>
            <meshStandardMaterial color={WHITE} roughness={0.4} />
          </RoundedBox>
        ))}
        {[-1, 1].map((s) => (
          <RoundedBox key={`h${s}`} args={[0.5, 0.045, 0.05]} radius={0.018} position={[0, s * 0.3, 0]}>
            <meshStandardMaterial color={WHITE} roughness={0.4} />
          </RoundedBox>
        ))}
        <mesh>
          <boxGeometry args={[0.44, 0.58, 0.014]} />
          <meshStandardMaterial color={MESH} roughness={0.95} />
        </mesh>
      </group>

      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.27, 0, 0.02]}>
          <mesh position={[0, 0.56, 0.04]}>
            <boxGeometry args={[0.03, 0.22, 0.04]} />
            <meshStandardMaterial color={WHITE} roughness={0.4} />
          </mesh>
          <RoundedBox args={[0.06, 0.03, 0.26]} radius={0.012} position={[0, 0.68, 0]}>
            <meshStandardMaterial color="#1e1e22" roughness={0.6} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}
