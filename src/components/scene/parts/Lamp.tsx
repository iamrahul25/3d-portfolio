"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { nightMix } from "../nightMix";
import { Limb } from "./Limb";
import { useTheme } from "@/lib/theme";

const BLACK = "#16161a";
const BRASS = "#c8a165";

export function Lamp({ position }: { position: [number, number, number] }) {
  const night = useTheme() === "dark";
  // The lamp's point-light shadow is a 6-face cube map; skip it on touch devices.
  const coarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const bulb = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  // Bulb follows the night blend, with a brief flicker as it "switches on".
  useFrame(({ clock }) => {
    const k = nightMix.value;
    const flicker = k > 0.05 && k < 0.6 ? 0.55 + 0.45 * Math.sign(Math.sin(clock.elapsedTime * 38)) : 1;
    const on = THREE.MathUtils.lerp(1, 2, k) * flicker;
    if (bulb.current) bulb.current.emissiveIntensity = 3 * on;
    if (light.current) {
      light.current.intensity = 2.2 * on;
      light.current.distance = THREE.MathUtils.lerp(2.6, 3.5, k);
    }
  });
  const base: [number, number, number] = [0, 0.02, 0];
  const elbow: [number, number, number] = [0.04, 0.48, 0.02];
  const head: [number, number, number] = [0.3, 0.66, 0.2];

  const pts = (arr: number[][]) => arr.map(([x, y]) => new THREE.Vector2(x, y));
  // Weighted base: bevelled lathe profile with a rubber foot ring.
  const baseGeo = useMemo(
    () => new THREE.LatheGeometry(pts([[0, 0], [0.088, 0], [0.09, 0.004], [0.09, 0.016], [0.084, 0.024], [0.03, 0.03], [0, 0.03]]), 48),
    [],
  );
  // Shade: flared cone with a rolled lip.
  const shadeGeo = useMemo(
    () =>
      new THREE.LatheGeometry(
        pts([[0.03, 0.03], [0.04, 0.02], [0.06, -0.01], [0.085, -0.05], [0.105, -0.095], [0.112, -0.105], [0.114, -0.11]]),
        48,
      ),
    [],
  );
  const spring = useMemo(() => {
    const pts3: THREE.Vector3[] = [];
    for (let i = 0; i <= 160; i++) {
      const t = i / 160;
      pts3.push(new THREE.Vector3(Math.cos(t * 40 * Math.PI) * 0.006, t * 0.14, Math.sin(t * 40 * Math.PI) * 0.006));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts3), 320, 0.0012, 5, false);
  }, []);
  const off = (p: [number, number, number], dx: number): [number, number, number] => [p[0], p[1], p[2] + dx];

  return (
    <group position={position}>
      <mesh geometry={baseGeo} castShadow receiveShadow>
        <meshPhysicalMaterial color={BLACK} roughness={0.35} metalness={0.5} clearcoat={0.5} clearcoatRoughness={0.25} />
      </mesh>
      <mesh position={[0, 0.001, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.086, 0.003, 8, 48]} />
        <meshStandardMaterial color="#0a0a0b" roughness={0.95} />
      </mesh>
      {/* toggle switch */}
      <mesh position={[0.05, 0.03, 0.03]}>
        <cylinderGeometry args={[0.009, 0.009, 0.008, 20]} />
        <meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.25} />
      </mesh>
      {/* base knuckle */}
      <mesh position={[0, 0.04, 0]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.017, 0.017, 0.036, 20]} />
        <meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.25} />
      </mesh>
      {/* twin parallel arms */}
      {[-0.0105, 0.0105].map((d) => (
        <group key={d}>
          <Limb from={off(base, d)} to={off(elbow, d)} radius={0.0078} color={BLACK} roughness={0.3} />
          <Limb from={off(elbow, d)} to={off(head, d)} radius={0.0078} color={BLACK} roughness={0.3} />
        </group>
      ))}
      <mesh geometry={spring} position={[0.03, 0.12, 0.022]} rotation-z={-0.08}>
        <meshStandardMaterial color="#9a9ca3" metalness={1} roughness={0.3} />
      </mesh>
      <mesh position={elbow} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.015, 0.015, 0.036, 20]} />
        <meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={head} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.013, 0.013, 0.036, 20]} />
        <meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.25} />
      </mesh>
      <group position={head} rotation={[-0.25, 0, 0.75]}>
        <mesh geometry={shadeGeo} castShadow>
          <meshPhysicalMaterial color={BLACK} roughness={0.3} metalness={0.4} clearcoat={0.6} clearcoatRoughness={0.2} side={THREE.FrontSide} />
        </mesh>
        <mesh geometry={shadeGeo} scale={0.985}>
          <meshStandardMaterial color="#ffd76a" emissive="#ffc23d" emissiveIntensity={1.6} side={THREE.BackSide} />
        </mesh>
        <mesh position={[0, -0.11, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.113, 0.0035, 8, 48]} />
          <meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.026, 0.03, 0.025, 24]} />
          <meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.07, 0]}>
          <sphereGeometry args={[0.035, 20, 16]} />
          <meshStandardMaterial ref={bulb} color="#fff6d8" emissive="#ffd36b" emissiveIntensity={3} toneMapped={false} />
        </mesh>
        <pointLight
          ref={light}
          position={[0, -0.14, 0]}
          color="#ffbe55"
          intensity={2.2}
          distance={2.6}
          decay={1.6}
          castShadow={night && !coarse}
          shadow-mapSize={[512, 512]}
          shadow-bias={-0.002} />
      </group>
    </group>
  );
}
