"use client";

import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { fabricTexture, meshWeaveAlpha } from "./materials";

const SHELL = "#f2f2ef";

// Ergonomic task chair: fabric seat cushion, see-through woven mesh back, chrome gas lift,
// five-spoke base with twin-wheel casters.
export function Chair({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const seatFabric = useMemo(() => {
    const t = fabricTexture("#24252b", 9).clone();
    t.repeat.set(3, 3);
    t.needsUpdate = true;
    return t;
  }, []);
  const weave = useMemo(() => {
    const t = meshWeaveAlpha().clone();
    t.repeat.set(16, 22);
    t.needsUpdate = true;
    return t;
  }, []);
  const shell = <meshStandardMaterial color={SHELL} roughness={0.35} />;
  const chrome = <meshStandardMaterial color="#c9ccd2" metalness={1} roughness={0.18} />;
  const rubber = <meshStandardMaterial color="#141417" roughness={0.7} />;

  return (
    <group position={position} rotation={rotation}>
      {/* seat pan + cushion */}
      <RoundedBox args={[0.52, 0.03, 0.5]} radius={0.012} position={[0, 0.425, 0]} castShadow>
        {shell}
      </RoundedBox>
      <RoundedBox args={[0.5, 0.075, 0.48]} radius={0.034} smoothness={5} position={[0, 0.472, -0.01]} castShadow receiveShadow>
        <meshStandardMaterial color="#ffffff" map={seatFabric} roughness={0.92} />
      </RoundedBox>
      {/* waterfall front edge */}
      <mesh position={[0, 0.468, -0.245]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.034, 0.43, 6, 16]} />
        <meshStandardMaterial color="#ffffff" map={seatFabric} roughness={0.92} />
      </mesh>

      {/* mechanism + gas lift */}
      <RoundedBox args={[0.2, 0.05, 0.22]} radius={0.015} position={[0, 0.39, 0]}>
        <meshStandardMaterial color="#1c1c20" roughness={0.5} metalness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.27, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.26, 24]} />
        {chrome}
      </mesh>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.032, 0.04, 0.14, 24]} />
        <meshStandardMaterial color="#1e1e22" roughness={0.45} />
      </mesh>

      {/* five-spoke base and casters */}
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <mesh position={[0.15, 0.085, 0]} rotation={[0, 0, Math.PI / 2 - 0.1]} castShadow>
              <capsuleGeometry args={[0.02, 0.27, 4, 12]} />
              {shell}
            </mesh>
            <mesh position={[0.29, 0.06, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.03, 8]} />
              {chrome}
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[0.3, 0.026, s * 0.011]} castShadow>
                <cylinderGeometry args={[0.026, 0.026, 0.016, 20]} />
                {rubber}
              </mesh>
            ))}
            <mesh position={[0.3, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.024, 0.024, 0.008, 20]} />
              <meshStandardMaterial color="#2a2a2f" roughness={0.4} />
            </mesh>
          </group>
        );
      })}

      {/* back spine */}
      <mesh position={[0, 0.58, 0.25]} rotation={[0.25, 0, 0]} castShadow>
        <capsuleGeometry args={[0.028, 0.2, 4, 12]} />
        {shell}
      </mesh>

      {/* mesh back in a rounded frame */}
      <group position={[0, 0.98, 0.29]} rotation={[0.12, 0, 0]}>
        {[-1, 1].map((s) => (
          <RoundedBox key={`v${s}`} args={[0.045, 0.64, 0.05]} radius={0.02} smoothness={4} position={[s * 0.235, 0, 0]} castShadow>
            {shell}
          </RoundedBox>
        ))}
        {[-1, 1].map((s) => (
          <RoundedBox key={`h${s}`} args={[0.5, 0.045, 0.05]} radius={0.02} smoothness={4} position={[0, s * 0.3, 0]} castShadow>
            {shell}
          </RoundedBox>
        ))}
        {/* curved mesh panel (cylinder segment) so the back wraps around the sitter */}
        <mesh position={[0, 0, 0.42]} rotation={[0, Math.PI, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.58, 32, 1, true, -0.5, 1.0]} />
          <meshStandardMaterial
            color="#5b5f6b"
            roughness={0.75}
            alphaMap={weave}
            alphaTest={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* headrest */}
        <group position={[0, 0.4, 0.01]}>
          <RoundedBox args={[0.3, 0.12, 0.05]} radius={0.022} smoothness={4} castShadow>
            <meshStandardMaterial color="#ffffff" map={seatFabric} roughness={0.9} />
          </RoundedBox>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.08, -0.07, 0.01]}>
              <cylinderGeometry args={[0.008, 0.008, 0.08, 10]} />
              {chrome}
            </mesh>
          ))}
        </group>
        {/* lumbar pad */}
        <RoundedBox args={[0.36, 0.08, 0.025]} radius={0.012} position={[0, -0.17, -0.012]} castShadow>
          <meshStandardMaterial color="#2a2b31" roughness={0.6} />
        </RoundedBox>
      </group>

      {/* armrests */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.27, 0, 0.02]}>
          <RoundedBox args={[0.03, 0.22, 0.045]} radius={0.012} position={[0, 0.56, 0.04]} castShadow>
            {shell}
          </RoundedBox>
          <RoundedBox args={[0.07, 0.035, 0.27]} radius={0.016} smoothness={4} position={[0, 0.685, 0]} castShadow>
            <meshStandardMaterial color="#1e1e22" roughness={0.75} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}
