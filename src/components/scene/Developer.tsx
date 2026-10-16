"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { Limb } from "./parts/Limb";

type V3 = [number, number, number];

const HOODIE = "#1c1c21";
const PANTS = "#17171b";
const SKIN = "#eab995";
const HAIR = "#17110e";

export function Developer({ position }: { position: V3 }) {
  const head = useRef<THREE.Group>(null);
  const leftHand = useRef<THREE.Group>(null);
  const rightHand = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);

  const tufts = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const up = 0.35 + ((i * 7) % 5) * 0.08;
        return {
          pos: [Math.cos(a) * 0.1 * Math.cos(up), 0.03 + Math.sin(up) * 0.1, Math.sin(a) * 0.1 * Math.cos(up) + 0.01] as V3,
          r: 0.035 + ((i * 3) % 4) * 0.006,
        };
      }),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (head.current) {
      head.current.rotation.x = 0.12 + Math.sin(t * 0.7) * 0.03;
      head.current.rotation.y = Math.sin(t * 0.35) * 0.08;
    }
    const typing = Math.sin(t * 0.5) > -0.3;
    if (leftHand.current) leftHand.current.position.y = typing ? Math.max(0, Math.sin(t * 17)) * 0.008 : 0;
    if (rightHand.current) rightHand.current.position.y = typing ? Math.max(0, Math.sin(t * 17 + 2)) * 0.008 : 0;
    if (torso.current) torso.current.scale.setScalar(1 + Math.sin(t * 1.6) * 0.008);
  });

  const shoulderL: V3 = [-0.18, 1.06, -0.76];
  const shoulderR: V3 = [0.18, 1.06, -0.76];
  const elbowL: V3 = [-0.24, 0.86, -0.93];
  const elbowR: V3 = [0.24, 0.86, -0.93];
  const wristL: V3 = [-0.13, 0.83, -1.27];
  const wristR: V3 = [0.13, 0.83, -1.27];

  return (
    <group position={position}>
      <group ref={torso} position={[0, 0.62, -0.6]}>
        <group position={[0, -0.62, 0.6]}>
          <Limb from={[0, 0.66, -0.58]} to={[0, 0.98, -0.73]} radius={0.15} color={HOODIE} scale={[1.3, 1, 0.85]} />
          <mesh position={[0, 1.13, -0.67]} scale={[1.25, 0.7, 0.9]}>
            <sphereGeometry args={[0.11, 24, 16]} />
            <meshStandardMaterial color={HOODIE} roughness={0.85} />
          </mesh>
          {[shoulderL, shoulderR].map((p, i) => (
            <mesh key={i} position={p}>
              <sphereGeometry args={[0.072, 20, 14]} />
              <meshStandardMaterial color={HOODIE} roughness={0.85} />
            </mesh>
          ))}
        </group>
      </group>

      <mesh position={[0, 0.58, -0.56]} scale={[1.35, 0.7, 1]}>
        <sphereGeometry args={[0.13, 24, 16]} />
        <meshStandardMaterial color={PANTS} roughness={0.85} />
      </mesh>

      <Limb from={[0, 1.08, -0.78]} to={[0, 1.2, -0.82]} radius={0.045} color={SKIN} />

      <group ref={head} position={[0, 1.2, -0.82]}>
        <mesh position={[0, 0.1, -0.03]}>
          <sphereGeometry args={[0.11, 32, 24]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.108, 0.09, -0.02]} scale={[0.5, 1, 0.8]}>
            <sphereGeometry args={[0.025, 12, 8]} />
            <meshStandardMaterial color={SKIN} roughness={0.7} />
          </mesh>
        ))}
        <group position={[0, 0.1, -0.03]}>
          <mesh position={[0, 0.01, 0.012]} rotation={[0.45, 0, 0]} scale={[1.04, 0.98, 1.05]}>
            <sphereGeometry args={[0.112, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
            <meshStandardMaterial color={HAIR} roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
          {tufts.map((t, i) => (
            <mesh key={i} position={t.pos}>
              <sphereGeometry args={[t.r, 12, 10]} />
              <meshStandardMaterial color={HAIR} roughness={0.9} />
            </mesh>
          ))}
          <mesh position={[0.02, 0.05, -0.09]} rotation={[0.9, 0, 0.2]} scale={[1.6, 0.5, 1]}>
            <sphereGeometry args={[0.04, 12, 10]} />
            <meshStandardMaterial color={HAIR} roughness={0.9} />
          </mesh>
          <group position={[0, -0.005, -0.105]}>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.04, 0, 0]}>
                <torusGeometry args={[0.028, 0.004, 8, 24]} />
                <meshStandardMaterial color="#0b0b0d" metalness={0.5} roughness={0.3} />
              </mesh>
            ))}
            <mesh>
              <boxGeometry args={[0.025, 0.004, 0.004]} />
              <meshStandardMaterial color="#0b0b0d" />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={`t${s}`} position={[s * 0.1, 0.005, 0.05]} rotation={[0, s * 0.1, 0]}>
                <boxGeometry args={[0.004, 0.004, 0.1]} />
                <meshStandardMaterial color="#0b0b0d" />
              </mesh>
            ))}
          </group>
        </group>
      </group>

      <Limb from={shoulderL} to={elbowL} radius={0.055} color={HOODIE} />
      <Limb from={shoulderR} to={elbowR} radius={0.055} color={HOODIE} />
      <Limb from={elbowL} to={wristL} radius={0.048} color={HOODIE} />
      <Limb from={elbowR} to={wristR} radius={0.048} color={HOODIE} />
      {[
        { ref: leftHand, p: [-0.12, 0.815, -1.33] as V3 },
        { ref: rightHand, p: [0.12, 0.815, -1.33] as V3 },
      ].map(({ ref, p }, i) => (
        <group key={i} ref={ref}>
          <mesh position={p} scale={[1, 0.5, 1.35]}>
            <sphereGeometry args={[0.036, 16, 12]} />
            <meshStandardMaterial color={SKIN} roughness={0.7} />
          </mesh>
        </group>
      ))}

      {[-1, 1].map((s) => (
        <group key={s}>
          <Limb from={[s * 0.09, 0.56, -0.6]} to={[s * 0.12, 0.57, -0.98]} radius={0.075} color={PANTS} />
          <Limb from={[s * 0.12, 0.57, -0.98]} to={[s * 0.13, 0.12, -1.02]} radius={0.062} color={PANTS} />
          <group position={[s * 0.13, 0.05, -1.08]}>
            <RoundedBox args={[0.11, 0.08, 0.23]} radius={0.03} smoothness={4}>
              <meshStandardMaterial color="#f7f7f5" roughness={0.6} />
            </RoundedBox>
            <mesh position={[0, -0.037, 0]}>
              <boxGeometry args={[0.112, 0.012, 0.232]} />
              <meshStandardMaterial color="#d6d3d1" />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}
