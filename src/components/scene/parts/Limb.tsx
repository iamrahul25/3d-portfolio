"use client";

import { useMemo } from "react";
import * as THREE from "three";

type Vec3 = [number, number, number];

const UP = new THREE.Vector3(0, 1, 0);

export function Limb({
  from,
  to,
  radius,
  color,
  scale = [1, 1, 1],
  roughness = 0.8,
  children,
}: {
  from: Vec3;
  to: Vec3;
  radius: number;
  color: string;
  scale?: Vec3;
  roughness?: number;
  /** Optional custom material element; defaults to a plain standard material. */
  children?: React.ReactNode;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    const length = dir.length();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
    const position = a.add(b).multiplyScalar(0.5);
    return { position, quaternion, length };
  }, [from, to]);

  return (
    <mesh position={position} quaternion={quaternion} scale={scale} castShadow>
      <capsuleGeometry args={[radius, Math.max(length, 0.001), 6, 16]} />
      {children ?? <meshStandardMaterial color={color} roughness={roughness} />}
    </mesh>
  );
}
