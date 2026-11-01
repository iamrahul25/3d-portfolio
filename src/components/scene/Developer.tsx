"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Instance, Instances, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { Limb } from "./parts/Limb";
import { fabricTexture } from "./materials";

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

  // Fabric materials: knit hoodie with soft sheen, denim-ish trousers.
  const knit = useMemo(() => {
    const t = fabricTexture("#2a2b33", 21).clone();
    t.repeat.set(3, 3);
    t.needsUpdate = true;
    return t;
  }, []);
  const denim = useMemo(() => {
    const t = fabricTexture("#283246", 33).clone();
    t.repeat.set(4, 4);
    t.needsUpdate = true;
    return t;
  }, []);
  const hoodieMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#ffffff",
        map: knit,
        roughness: 0.9,
        sheen: 0.6,
        sheenRoughness: 0.8,
        sheenColor: new THREE.Color("#6b7088"),
      }),
    [knit],
  );
  const pantsMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#ffffff", map: denim, roughness: 0.85, sheen: 0.3, sheenColor: new THREE.Color("#7d8bb0") }),
    [denim],
  );
  const skinMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: SKIN,
        roughness: 0.55,
        sheen: 0.4,
        sheenColor: new THREE.Color("#ffb59a"),
        sheenRoughness: 0.6,
      }),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (head.current) {
      // Mostly looking at the screen; every ~9 s a short glance to the side.
      const cycle = t % 9;
      const glance = cycle > 6.2 && cycle < 7.8 ? Math.sin(((cycle - 6.2) / 1.6) * Math.PI) : 0;
      head.current.rotation.x = 0.12 + Math.sin(t * 0.7) * 0.025 - glance * 0.06;
      head.current.rotation.y = Math.sin(t * 0.35) * 0.05 + glance * 0.55;
    }
    const typing = Math.sin(t * 0.5) > -0.3;
    if (leftHand.current) leftHand.current.position.y = typing ? Math.max(0, Math.sin(t * 15)) * 0.006 : 0;
    // right hand rests on the mouse and nudges it now and then
    if (rightHand.current) {
      rightHand.current.position.x = Math.sin(t * 0.9) * 0.006 * (typing ? 0.3 : 1);
      rightHand.current.position.z = Math.sin(t * 1.3 + 1) * 0.005;
    }
    if (torso.current) torso.current.scale.set(1 + Math.sin(t * 1.4) * 0.006, 1 + Math.sin(t * 1.4) * 0.01, 1 + Math.sin(t * 1.4) * 0.008);
  });

  const shoulderL: V3 = [-0.18, 1.06, -0.76];
  const shoulderR: V3 = [0.18, 1.06, -0.76];
  const elbowL: V3 = [-0.24, 0.86, -0.93];
  const elbowR: V3 = [0.33, 0.86, -0.98];
  const wristL: V3 = [-0.13, 0.83, -1.27];
  const wristR: V3 = [0.42, 0.84, -1.33];

  return (
    <group position={position}>
      <group ref={torso} position={[0, 0.62, -0.6]}>
        <group position={[0, -0.62, 0.6]}>
          <Limb from={[0, 0.66, -0.58]} to={[0, 0.98, -0.73]} radius={0.15} color={HOODIE} scale={[1.3, 1, 0.85]}>
            <primitive object={hoodieMat} attach="material" />
          </Limb>
          <mesh position={[0, 1.1, -0.67]} scale={[1.3, 0.62, 0.95]} material={hoodieMat} castShadow>
            <sphereGeometry args={[0.12, 32, 20]} />
          </mesh>
          {/* hood resting on the upper back */}
          <mesh position={[0, 1.12, -0.58]} rotation={[-0.5, 0, 0]} scale={[1, 0.7, 0.8]} material={hoodieMat} castShadow>
            <torusGeometry args={[0.085, 0.04, 14, 28, Math.PI * 1.2]} />
          </mesh>
          {/* drawstrings */}
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh position={[s * 0.035, 1.03, -0.82]} rotation={[0.25, 0, 0]}>
                <cylinderGeometry args={[0.0035, 0.0035, 0.12, 6]} />
                <meshStandardMaterial color="#e9e6df" roughness={0.8} />
              </mesh>
              <mesh position={[s * 0.035, 0.97, -0.835]}>
                <cylinderGeometry args={[0.005, 0.005, 0.016, 8]} />
                <meshStandardMaterial color="#c9ccd2" metalness={0.8} roughness={0.3} />
              </mesh>
            </group>
          ))}
          {[shoulderL, shoulderR].map((p, i) => (
            <mesh key={i} position={p} material={hoodieMat} castShadow>
              <sphereGeometry args={[0.072, 24, 16]} />
            </mesh>
          ))}
        </group>
      </group>

      <mesh position={[0, 0.58, -0.56]} scale={[1.35, 0.7, 1]} material={pantsMat} castShadow>
        <sphereGeometry args={[0.13, 32, 20]} />
      </mesh>

      <Limb from={[0, 1.08, -0.78]} to={[0, 1.17, -0.82]} radius={0.056} color={SKIN}>
        <primitive object={skinMat} attach="material" />
      </Limb>

      <group ref={head} position={[0, 1.17, -0.82]}>
        {/* cranium + softer jaw, slightly taller than wide */}
        <mesh position={[0, 0.1, -0.03]} scale={[0.96, 1.06, 1]} material={skinMat} castShadow>
          <sphereGeometry args={[0.11, 48, 32]} />
        </mesh>
        <mesh position={[0, 0.058, -0.055]} scale={[0.92, 0.78, 0.88]} material={skinMat}>
          <sphereGeometry args={[0.09, 32, 24]} />
        </mesh>
        {/* face (towards -Z, the monitor): nose, eyes, brows, mouth */}
        <mesh position={[0, 0.085, -0.142]} rotation={[-0.2, 0, 0]} scale={[0.8, 1.2, 1]} material={skinMat}>
          <sphereGeometry args={[0.016, 16, 12]} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={`eye${s}`}>
            <mesh position={[s * 0.036, 0.105, -0.131]}>
              <sphereGeometry args={[0.0075, 16, 12]} />
              <meshPhysicalMaterial color="#1a120d" roughness={0.1} clearcoat={1} />
            </mesh>
            <mesh position={[s * 0.037, 0.13, -0.133]} rotation={[0.25, s * 0.25, s * -0.12]}>
              <boxGeometry args={[0.026, 0.005, 0.006]} />
              <meshStandardMaterial color={HAIR} roughness={0.9} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.05, -0.139]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.003, 0.022, 4, 8]} />
          <meshStandardMaterial color="#b9786a" roughness={0.6} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.106, 0.09, -0.02]} scale={[0.5, 1, 0.8]} material={skinMat}>
            <sphereGeometry args={[0.025, 16, 12]} />
          </mesh>
        ))}
        <group position={[0, 0.1, -0.03]}>
          <mesh position={[0, 0.01, 0.012]} rotation={[0.45, 0, 0]} scale={[1.04, 0.98, 1.05]}>
            <sphereGeometry args={[0.112, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
            <meshStandardMaterial color={HAIR} roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
          <Instances limit={tufts.length} frames={1} castShadow>
            <sphereGeometry args={[1, 12, 10]} />
            <meshStandardMaterial color={HAIR} roughness={0.9} />
            {tufts.map((t, i) => (
              <Instance key={i} position={t.pos} scale={t.r} />
            ))}
          </Instances>
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
            {[-1, 1].map((s) => (
              <mesh key={`lens${s}`} position={[s * 0.04, 0, 0.001]}>
                <circleGeometry args={[0.026, 24]} />
                <meshPhysicalMaterial color="#cfe3ff" transparent opacity={0.18} roughness={0.05} clearcoat={1} depthWrite={false} side={THREE.DoubleSide} />
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

      {[
        [shoulderL, elbowL, 0.056],
        [shoulderR, elbowR, 0.056],
        [elbowL, wristL, 0.047],
        [elbowR, wristR, 0.047],
      ].map(([a, b, r], i) => (
        <Limb key={i} from={a as V3} to={b as V3} radius={r as number} color={HOODIE}>
          <primitive object={hoodieMat} attach="material" />
        </Limb>
      ))}
      {/* ribbed cuffs */}
      {[wristL, wristR].map((w, i) => (
        <mesh key={i} position={w} rotation={[Math.PI / 2 - 0.1, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.042, 0.03, 20]} />
          <meshStandardMaterial color="#202127" roughness={0.95} />
        </mesh>
      ))}
      {[
        { ref: leftHand, p: [-0.12, 0.815, -1.33] as V3, side: -1 },
        { ref: rightHand, p: [0.43, 0.828, -1.41] as V3, side: 1 },
      ].map(({ ref, p, side }, i) => (
        <group key={i} ref={ref}>
          <group position={p}>
            {/* palm */}
            <mesh scale={[1, 0.45, 1.2]} material={skinMat} castShadow>
              <sphereGeometry args={[0.034, 20, 14]} />
            </mesh>
            {/* fingers, slightly curled */}
            <mesh position={[0, -0.006, -0.04]} rotation={[0.35, 0, 0]} scale={[1.05, 0.42, 0.9]} material={skinMat}>
              <sphereGeometry args={[0.028, 20, 14]} />
            </mesh>
            {/* thumb */}
            <mesh position={[-side * 0.03, -0.002, -0.012]} rotation={[0.3, 0, side * 0.9]} material={skinMat}>
              <capsuleGeometry args={[0.0085, 0.022, 4, 10]} />
            </mesh>
          </group>
        </group>
      ))}

      {[-1, 1].map((s) => (
        <group key={s}>
          <Limb from={[s * 0.09, 0.56, -0.6]} to={[s * 0.12, 0.57, -0.98]} radius={0.075} color={PANTS}>
            <primitive object={pantsMat} attach="material" />
          </Limb>
          <Limb from={[s * 0.12, 0.57, -0.98]} to={[s * 0.13, 0.12, -1.02]} radius={0.062} color={PANTS}>
            <primitive object={pantsMat} attach="material" />
          </Limb>
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
