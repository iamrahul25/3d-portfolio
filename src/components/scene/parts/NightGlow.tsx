"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { nightMix } from "../nightMix";

function radialTexture(inner: string, size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.45, inner.replace(/[\d.]+\)$/, "0.35)"));
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function glintTexture(size = 64) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const m = size / 2;
  const core = g.createRadialGradient(m, m, 0, m, m, m * 0.35);
  core.addColorStop(0, "rgba(255,255,255,1)");
  core.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = core;
  g.fillRect(0, 0, size, size);
  g.strokeStyle = "rgba(255,255,255,0.8)";
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(m, 2);
  g.lineTo(m, size - 2);
  g.moveTo(2, m);
  g.lineTo(size - 2, m);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

type Pool = { position: [number, number, number]; scale: [number, number]; strength: number };

// Warm light pools where the desk lamp lands (desk top and the floor beside the chair).
// Additive, unlit planes faded by nightMix, so they cost almost nothing.
const POOLS: Pool[] = [
  { position: [-0.85, 0.787, -1.55], scale: [1.1, 0.8], strength: 0.55 },
  { position: [-0.7, 0.016, -0.75], scale: [2.2, 1.6], strength: 0.22 },
];

// Tiny star glints on hard edges that catch the lamp (monitor stand, PC tower, lamp shade rim, mug).
const GLINTS: { position: [number, number, number]; size: number; phase: number }[] = [
  { position: [-0.06, 0.82, -1.76], size: 0.07, phase: 0 },
  { position: [1.53, 0.82, -1.28], size: 0.08, phase: 1.7 },
  { position: [-0.93, 1.48, -1.62], size: 0.06, phase: 3.1 },
  { position: [0.62, 0.9, -1.35], size: 0.05, phase: 4.4 },
];

export function NightGlow() {
  const poolTex = useMemo(() => radialTexture("rgba(255,184,92,1)"), []);
  const glintTex = useMemo(() => glintTexture(), []);
  const pools = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const glints = useRef<(THREE.Sprite | null)[]>([]);

  useFrame(({ clock }) => {
    const k = nightMix.value;
    pools.current.forEach((m, i) => {
      if (m) m.opacity = POOLS[i].strength * k;
    });
    const t = clock.elapsedTime;
    glints.current.forEach((s, i) => {
      if (!s) return;
      const g = GLINTS[i];
      // Mostly off, briefly peaking: reads as a glint rather than a light.
      const pulse = Math.pow(Math.max(0, Math.sin(t * 0.9 + g.phase)), 12);
      const a = pulse * k;
      (s.material as THREE.SpriteMaterial).opacity = a;
      (s.material as THREE.SpriteMaterial).rotation = t * 0.4 + g.phase;
      s.scale.setScalar(g.size * (0.6 + a * 0.6));
      s.visible = a > 0.01;
    });
  });

  return (
    <group>
      {POOLS.map((p, i) => (
        <mesh key={i} position={p.position} rotation-x={-Math.PI / 2} renderOrder={2}>
          <planeGeometry args={p.scale} />
          <meshBasicMaterial
            ref={(m) => {
              pools.current[i] = m;
            }}
            map={poolTex}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            polygonOffset
            polygonOffsetFactor={-2}
          />
        </mesh>
      ))}
      {GLINTS.map((g, i) => (
        <sprite
          key={i}
          ref={(s) => {
            glints.current[i] = s;
          }}
          position={g.position}
          visible={false}
        >
          <spriteMaterial
            map={glintTex}
            color="#fff1d0"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  );
}
