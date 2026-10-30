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
  const halo = useRef<THREE.MeshBasicMaterial>(null);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const spill = useRef<THREE.PointLight>(null);
  const glowTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.35, "rgba(255,255,255,0.45)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
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
    const m = THREE.MathUtils.smoothstep(k, 0.4, 1);
    if (moon.current) moon.current.opacity = m;
    if (halo.current) halo.current.opacity = 0.55 * m;
    if (glow.current) glow.current.opacity = 0.2 * k;
    if (spill.current) spill.current.intensity = 0.9 * k;
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
      {/* moon halo */}
      <mesh position={[width * 0.22, height * 0.25, 0.003]}>
        <planeGeometry args={[0.42, 0.42]} />
        <meshBasicMaterial
          ref={halo}
          map={glowTex}
          color="#ffe8b0"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      {/* night glow spilling past the frame onto the wall */}
      <mesh position={[0, 0, 0.03]} renderOrder={3}>
        <planeGeometry args={[width * 1.25, height * 1.8]} />
        <meshBasicMaterial
          ref={glow}
          map={glowTex}
          color="#5b74ff"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <pointLight ref={spill} position={[0, -0.1, 0.6]} color="#7d92ff" intensity={0} distance={2.4} decay={1.8} />
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
