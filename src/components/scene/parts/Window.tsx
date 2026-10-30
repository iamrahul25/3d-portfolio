"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { nightMix } from "../nightMix";

const FRAME = "#e9dfd2";
const DAY_TOP = new THREE.Color("#8cc8ff");
const DAY_BOTTOM = new THREE.Color("#e8f4ff");
const NIGHT_TOP = new THREE.Color("#070b22");
const NIGHT_BOTTOM = new THREE.Color("#28305e");

// A wall window whose sky shifts from daylight blue to a starry night as nightMix rises.
export function Window({ width = 0.9, height = 1 }: { width?: number; height?: number }) {
  const sky = useRef<THREE.ShaderMaterial>(null);
  const moon = useRef<THREE.MeshBasicMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTop: { value: DAY_TOP.clone() },
      uBottom: { value: DAY_BOTTOM.clone() },
      uNight: { value: 0 },
    }),
    [],
  );

  useFrame(() => {
    const k = nightMix.value;
    uniforms.uTop.value.copy(DAY_TOP).lerp(NIGHT_TOP, k);
    uniforms.uBottom.value.copy(DAY_BOTTOM).lerp(NIGHT_BOTTOM, k);
    uniforms.uNight.value = k;
    if (moon.current) moon.current.opacity = THREE.MathUtils.smoothstep(k, 0.4, 1);
  });

  const t = 0.04;
  return (
    <group>
      <mesh>
        <planeGeometry args={[width, height]} />
        <shaderMaterial
          ref={sky}
          uniforms={uniforms}
          toneMapped={false}
          vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
          fragmentShader={`
            uniform vec3 uTop; uniform vec3 uBottom; uniform float uNight; varying vec2 vUv;
            float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
            void main(){
              vec3 col = mix(uBottom, uTop, smoothstep(0.0, 1.0, vUv.y));
              vec2 g = floor(vUv * vec2(48.0, 52.0));
              float star = step(0.985, hash(g)) * uNight * smoothstep(0.2, 0.9, vUv.y);
              col += vec3(star) * 0.9;
              gl_FragColor = vec4(col, 1.0);
            }`}
        />
      </mesh>
      <mesh position={[width * 0.22, height * 0.25, 0.002]}>
        <circleGeometry args={[0.07, 32]} />
        <meshBasicMaterial ref={moon} color="#fff4d6" transparent opacity={0} toneMapped={false} />
      </mesh>
      {/* frame */}
      {[
        [0, height / 2 + t / 2, width + t * 2, t],
        [0, -height / 2 - t / 2, width + t * 2, t],
        [-width / 2 - t / 2, 0, t, height],
        [width / 2 + t / 2, 0, t, height],
        [0, 0, t * 0.6, height],
        [0, 0, width, t * 0.6],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.02]} castShadow>
          <boxGeometry args={[w, h, 0.05]} />
          <meshStandardMaterial color={FRAME} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, -height / 2 - t - 0.02, 0.06]}>
        <boxGeometry args={[width + 0.16, 0.03, 0.14]} />
        <meshStandardMaterial color={FRAME} roughness={0.7} />
      </mesh>
    </group>
  );
}
