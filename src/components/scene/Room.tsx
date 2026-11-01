"use client";
import { aoGradient, brushedTexture, corkTexture, floorTexture, plasterTexture, rugTexture, woodTexture } from "./materials";

import { useTheme } from "@/lib/theme";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Instance, Instances, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { Plant } from "./parts/Plant";
import { CatFigurine } from "./parts/CatFigurine";
import { Window } from "./parts/Window";

const WALL = "#f3ece3";
const WOOD = "#d8b07a";

function FadingWall({
  position,
  rotation,
  size,
  normal,
  children,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  normal: [number, number, number];
  children?: React.ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const n = useMemo(() => new THREE.Vector3(...normal), [normal]);
  const p = useMemo(() => new THREE.Vector3(...position), [position]);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const plaster = useMemo(() => {
    const t = plasterTexture().clone();
    t.repeat.set(size[0] * 1.5, size[1] * 1.5);
    t.needsUpdate = true;
    return t;
  }, [size]);
  const ao = aoGradient();
  const hidden = useRef(false);

  useFrame(({ camera }, delta) => {
    if (!material.current || !group.current) return;
    const facing = tmp.copy(camera.position).sub(p).dot(n) > 0;
    const target = facing ? 1 : 0;
    const m = material.current;
    m.opacity = THREE.MathUtils.damp(m.opacity, target, 6, delta);
    m.depthWrite = m.opacity > 0.95;
    const hide = m.opacity <= 0.02;
    if (hide === hidden.current) return;
    hidden.current = hide;
    // Only drawables are hidden: hiding the shelf/window lights too would change the scene's
    // light count, which recompiles every lit shader each time the camera swings past a wall.
    group.current.traverse((o) => {
      if ((o as THREE.Mesh).isMesh || (o as THREE.Sprite).isSprite || (o as THREE.Points).isPoints) o.visible = !hide;
    });
  });

  return (
    <group ref={group}>
      {/* the key light sits in front of both walls, so their shadows would land outside the room */}
      <group position={position} rotation={rotation} userData={{ noCastShadow: true }}>
        <mesh receiveShadow>
          <planeGeometry args={size} />
          <meshStandardMaterial
            ref={material}
            color={WALL}
            roughness={0.92}
            bumpMap={plaster}
            bumpScale={0.35}
            roughnessMap={plaster}
            transparent
          />
        </mesh>
        {/* soft contact shadow where the wall meets the floor */}
        <mesh position={[0, -size[1] / 2 + 0.22, 0.002]}>
          <planeGeometry args={[size[0], 0.44]} />
          <meshBasicMaterial alphaMap={ao} color="#3a2a1a" transparent opacity={0.12} depthWrite={false} />
        </mesh>
        {/* skirting board with a moulded top lip */}
        <RoundedBox args={[size[0], 0.1, 0.014]} radius={0.004} smoothness={2} position={[0, -size[1] / 2 + 0.05, 0.007]} receiveShadow>
          <meshStandardMaterial color="#efe7dc" roughness={0.55} />
        </RoundedBox>
        <mesh position={[0, -size[1] / 2 + 0.1, 0.012]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.006, 0.006, size[0], 10]} />
          <meshStandardMaterial color="#efe7dc" roughness={0.55} />
        </mesh>
      </group>
      {children}
    </group>
  );
}

function ShelfBooks({ position }: { position: [number, number, number] }) {
  const books = useMemo(() => {
    const colors = ["#1f2937", "#e7dfd2", "#3f3f46", "#d4a373", "#f5f5f4", "#27272a", "#a8a29e"];
    let x = 0;
    return colors.map((c, i) => {
      const w = 0.035 + ((i * 7) % 3) * 0.008;
      const h = 0.2 + ((i * 5) % 4) * 0.025;
      const book = { x: x + w / 2, w, h, c };
      x += w + 0.004;
      return book;
    });
  }, []);
  return (
    <group position={position}>
      {books.map((b, i) => {
        const last = i === books.length - 1;
        return (
          <group key={i} position={[b.x + (last ? 0.03 : 0), 0, 0]} rotation-z={last ? -0.22 : 0}>
            {/* hard cover */}
            <RoundedBox args={[b.w, b.h, 0.16]} radius={0.003} smoothness={2} position={[0, b.h / 2, 0]} castShadow>
              <meshPhysicalMaterial color={b.c} roughness={0.55} clearcoat={0.25} clearcoatRoughness={0.5} />
            </RoundedBox>
            {/* page block peeking from the top and fore-edge */}
            <mesh position={[0, b.h - 0.0025, -0.004]}>
              <boxGeometry args={[b.w - 0.006, 0.006, 0.15]} />
              <meshStandardMaterial color="#f1eadb" roughness={0.95} />
            </mesh>
            {/* spine bands */}
            {[0.18, 0.82].map((t) => (
              <mesh key={t} position={[0, b.h * t, 0.0802]}>
                <planeGeometry args={[b.w * 0.8, 0.006]} />
                <meshStandardMaterial color="#c9a45c" metalness={0.8} roughness={0.35} />
              </mesh>
            ))}
            <mesh position={[0, b.h * 0.5, 0.0802]}>
              <planeGeometry args={[b.w * 0.35, b.h * 0.3]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.18} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Shelf() {
  const night = useTheme() === "dark";
  const y = 2.05;
  const wood = useMemo(() => {
    const t = woodTexture("#d8b07a", 19).clone();
    t.repeat.set(2.5, 0.35);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.needsUpdate = true;
    return t;
  }, []);
  return (
    <group position={[-0.1, y, -2.08]}>
      <RoundedBox args={[1.9, 0.04, 0.24]} radius={0.008} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color={WOOD} map={wood} bumpMap={wood} bumpScale={0.6} roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, -0.026, 0.08]}>
        <boxGeometry args={[1.82, 0.01, 0.02]} />
        <meshStandardMaterial color="#fff2c9" emissive="#ffc85a" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <pointLight position={[0, -0.15, 0.2]} color="#ffc061" intensity={night ? 3.2 : 1.4} distance={2.2} decay={1.5} />
      {/* powder-coated steel L-brackets with screws */}
      {[-0.75, 0.75].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <RoundedBox args={[0.025, 0.006, 0.2]} radius={0.002} position={[0, -0.023, -0.01]}>
            <meshStandardMaterial color="#1b1b1f" metalness={0.5} roughness={0.45} />
          </RoundedBox>
          <RoundedBox args={[0.025, 0.16, 0.006]} radius={0.002} position={[0, -0.1, -0.11]}>
            <meshStandardMaterial color="#1b1b1f" metalness={0.5} roughness={0.45} />
          </RoundedBox>
          {[-0.06, -0.15].map((sy) => (
            <mesh key={sy} position={[0, sy, -0.106]} rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.005, 0.005, 0.003, 12]} />
              <meshStandardMaterial color="#8d8f96" metalness={1} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}
      <ShelfBooks position={[-0.02, 0.02, 0]} />
      <CatFigurine position={[-0.3, 0.02, 0]} scale={1.15} rotation={[0, 0.2, 0]} />
      <Plant position={[-0.75, 0.02, 0]} scale={0.8} leaves={14} seed={11} spread={1.3} leafSize={[0.04, 0.12]} />
      <Plant position={[0.72, 0.02, 0]} scale={0.6} leaves={10} seed={5} potColor="#1f1f23" />
      <group position={[0.5, 0.02, 0]}>
        {[0, 1, 2].map((i) => (
          <group key={i} position={[0, 0.018 + i * 0.036, 0]} rotation={[0, i * 0.12 - 0.1, 0]}>
            <RoundedBox args={[0.2, 0.034, 0.15]} radius={0.003} smoothness={2} castShadow>
              <meshPhysicalMaterial color={["#e7e5e4", "#292524", "#d6a461"][i]} roughness={0.6} clearcoat={0.2} />
            </RoundedBox>
          </group>
        ))}
      </group>
    </group>
  );
}

function Note({ size, color }: { size: [number, number]; color: string }) {
  // Paper with a slight curl at the bottom corners.
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(size[0], size[1], 8, 8);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) / size[0] + 0.5, y = 0.5 - p.getY(i) / size[1];
      p.setZ(i, Math.pow(Math.max(0, y - 0.7) / 0.3, 2) * 0.014 * (0.4 + Math.abs(x - 0.5) * 1.2));
    }
    g.computeVertexNormals();
    return g;
  }, [size]);
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.92} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Pin({ color, position }: { color: string; position: [number, number, number] }) {
  return (
    <group position={position} rotation-x={Math.PI / 2}>
      <mesh position={[0, 0.004, 0]}>
        <cylinderGeometry args={[0.011, 0.011, 0.005, 20]} />
        <meshPhysicalMaterial color={color} roughness={0.25} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0.012, 0]}>
        <cylinderGeometry args={[0.006, 0.008, 0.012, 16]} />
        <meshPhysicalMaterial color={color} roughness={0.25} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0.021, 0]}>
        <sphereGeometry args={[0.009, 16, 10]} />
        <meshPhysicalMaterial color={color} roughness={0.25} clearcoat={1} />
      </mesh>
      <mesh position={[0, -0.002, 0]}>
        <cylinderGeometry args={[0.0012, 0.0012, 0.008, 6]} />
        <meshStandardMaterial color="#c9ccd2" metalness={1} roughness={0.25} />
      </mesh>
    </group>
  );
}

function Pegboard() {
  const cork = useMemo(() => {
    const t = corkTexture().clone();
    t.repeat.set(1.8, 1.4);
    t.needsUpdate = true;
    return t;
  }, []);
  const frameWood = woodTexture("#b98a55", 31);
  const notes: { p: [number, number]; r: number; s: [number, number]; c: string; pin: string }[] = [
    { p: [-0.22, 0.12], r: 0.05, s: [0.2, 0.22], c: "#fbf8f1", pin: "#ef4444" },
    { p: [0.08, 0.15], r: -0.04, s: [0.17, 0.17], c: "#fde68a", pin: "#111827" },
    { p: [0.25, -0.12], r: 0.06, s: [0.18, 0.2], c: "#fbf8f1", pin: "#f59e0b" },
    { p: [-0.12, -0.17], r: -0.03, s: [0.22, 0.16], c: "#dbeafe", pin: "#10b981" },
  ];
  const W = 0.92, H = 0.72, F = 0.03;
  return (
    <group position={[1.6, 1.55, -2.185]}>
      {/* cork panel */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[W - F, H - F, 0.018]} />
        <meshStandardMaterial color="#e6d3bd" map={cork} bumpMap={cork} bumpScale={1.2} roughness={0.95} />
      </mesh>
      {/* wooden frame */}
      {[
        [0, H / 2 - F / 2, W, F],
        [0, -H / 2 + F / 2, W, F],
        [W / 2 - F / 2, 0, F, H - 2 * F],
        [-W / 2 + F / 2, 0, F, H - 2 * F],
      ].map(([x, y, w, h], i) => (
        <RoundedBox key={i} args={[w, h, 0.03]} radius={0.006} smoothness={3} position={[x, y, 0.004]} castShadow>
          <meshStandardMaterial color="#c99a62" map={frameWood} roughness={0.55} />
        </RoundedBox>
      ))}
      {notes.map((n, i) => (
        <group key={i} position={[n.p[0], n.p[1], 0.011]} rotation={[0, 0, n.r]}>
          <Note size={n.s} color={n.c} />
          {[0, 1, 2].map((l) => (
            <mesh key={l} position={[-n.s[0] * 0.1, n.s[1] * 0.15 - l * 0.035, 0.0035]}>
              <planeGeometry args={[n.s[0] * (0.6 - l * 0.12), 0.006]} />
              <meshBasicMaterial color="#8f8a80" transparent opacity={0.7} />
            </mesh>
          ))}
          <Pin color={n.pin} position={[0, n.s[1] / 2 - 0.018, 0.002]} />
        </group>
      ))}
      {/* polaroid */}
      <group position={[0.3, 0.17, 0.012]} rotation-z={0.09}>
        <Note size={[0.13, 0.155]} color="#fdfcf8" />
        <mesh position={[0, 0.012, 0.0035]}>
          <planeGeometry args={[0.11, 0.105]} />
          <meshStandardMaterial color="#7fa7c9" roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.005, 0.004]}>
          <circleGeometry args={[0.025, 20]} />
          <meshStandardMaterial color="#f6c76a" roughness={0.4} />
        </mesh>
        <Pin color="#3b82f6" position={[0, 0.06, 0.002]} />
      </group>
    </group>
  );
}

function WallArt() {
  return (
    <group>
      <RoundedBox args={[0.6, 0.72, 0.03]} radius={0.006}>
        <meshStandardMaterial color="#fafaf9" roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0, 0.016]}>
        <planeGeometry args={[0.48, 0.6]} />
        <meshStandardMaterial color="#f1efea" />
      </mesh>
      <mesh position={[-0.05, 0.04, 0.018]}>
        <planeGeometry args={[0.22, 0.34]} />
        <meshStandardMaterial color="#3f3f46" />
      </mesh>
      <mesh position={[0.07, -0.06, 0.019]}>
        <planeGeometry args={[0.18, 0.26]} />
        <meshStandardMaterial color="#a8a29e" />
      </mesh>
    </group>
  );
}

function PCTower({ position }: { position: [number, number, number] }) {
  const brushed = brushedTexture(8);
  return (
    <group position={position}>
      {/* steel shell */}
      <RoundedBox args={[0.22, 0.44, 0.46]} radius={0.01} smoothness={4} position={[0, 0.24, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#1c1c20" roughness={0.45} metalness={0.55} roughnessMap={brushed} />
      </RoundedBox>
      {/* tempered-glass side panel with dark tint */}
      <RoundedBox args={[0.004, 0.38, 0.4]} radius={0.002} position={[0.111, 0.25, 0]}>
        <meshPhysicalMaterial color="#0d0e12" roughness={0.05} metalness={0.1} clearcoat={1} clearcoatRoughness={0.04} transmission={0} />
      </RoundedBox>
      {/* glimpse of internals behind the glass */}
      <mesh position={[0.104, 0.3, -0.02]} rotation-y={Math.PI / 2}>
        <circleGeometry args={[0.05, 24]} />
        <meshStandardMaterial color="#2b2d35" emissive="#ffb340" emissiveIntensity={0.25} />
      </mesh>
      {/* front mesh intake panel */}
      <RoundedBox args={[0.2, 0.4, 0.008]} radius={0.003} position={[0, 0.25, 0.231]}>
        <meshStandardMaterial color="#141417" roughness={0.85} metalness={0.2} />
      </RoundedBox>
      <Instances limit={18} frames={1}>
        <boxGeometry args={[0.13, 0.006, 0.001]} />
        <meshStandardMaterial color="#26262b" roughness={0.6} />
        {Array.from({ length: 18 }, (_, i) => (
          <Instance key={i} position={[-0.02, 0.08 + i * 0.019, 0.2355]} />
        ))}
      </Instances>
      {/* light strip */}
      <mesh position={[0.08, 0.25, 0.236]}>
        <boxGeometry args={[0.008, 0.34, 0.002]} />
        <meshStandardMaterial color="#ffd27a" emissive="#ffb340" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      {/* top I/O + power button */}
      <mesh position={[0.05, 0.4605, 0.18]}>
        <cylinderGeometry args={[0.012, 0.012, 0.003, 24]} />
        <meshStandardMaterial color="#2a2a30" metalness={0.8} roughness={0.25} />
      </mesh>
      {[-0.02, -0.045].map((x) => (
        <mesh key={x} position={[x, 0.4605, 0.18]}>
          <boxGeometry args={[0.014, 0.002, 0.006]} />
          <meshStandardMaterial color="#050506" />
        </mesh>
      ))}
      {/* top exhaust vent */}
      <mesh position={[0, 0.461, -0.05]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.16, 0.26]} />
        <meshStandardMaterial color="#0e0e11" roughness={0.9} />
      </mesh>
      {/* feet */}
      {[[-0.08, -0.18], [0.08, -0.18], [-0.08, 0.18], [0.08, 0.18]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.01, z]}>
          <cylinderGeometry args={[0.018, 0.02, 0.02, 16]} />
          <meshStandardMaterial color="#0c0c0e" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Rug() {
  const map = rugTexture();
  return (
    <group position={[-0.1, 0, -0.6]}>
      {/* soft pile body with rounded edges */}
      <RoundedBox args={[2.0, 0.014, 1.55]} radius={0.006} smoothness={3} position={[0, 0.007, 0]} receiveShadow>
        <meshStandardMaterial color="#b97a2a" roughness={1} />
      </RoundedBox>
      {/* textured pile surface */}
      <mesh position={[0, 0.0142, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[1.99, 1.54]} />
        <meshPhysicalMaterial
          color="#ffffff"
          map={map}
          bumpMap={map}
          bumpScale={1.5}
          roughness={1}
          sheen={0.6}
          sheenRoughness={0.6}
          sheenColor="#ffe2b0"
        />
      </mesh>
      {/* fringe on the short ends */}
      {[-1, 1].map((side) => (
        <Instances key={side} limit={80} frames={1}>
          <boxGeometry args={[0.004, 0.003, 0.05]} />
          <meshStandardMaterial color="#efe0c4" roughness={1} />
          {Array.from({ length: 70 }, (_, i) => (
            <Instance key={i} position={[-0.97 + i * 0.0281, 0.002, side * (0.775 + 0.022)]} rotation-y={Math.sin(i * 1.7) * 0.25} />
          ))}
        </Instances>
      ))}
    </group>
  );
}

export function Room() {
  const floor = useMemo(() => {
    const t = floorTexture().clone();
    t.repeat.set(2.6, 2.6);
    t.needsUpdate = true;
    return t;
  }, []);
  return (
    <group>
      <RoundedBox
        args={[5.4, 0.16, 4.2]}
        radius={0.05}
        smoothness={4}
        position={[0, -0.08, -0.15]}
        receiveShadow
        userData={{ noCastShadow: true }}
      >
        <meshStandardMaterial color="#e3d6c4" roughness={0.9} />
      </RoundedBox>
      {/* light oak floorboards with a soft satin finish */}
      <mesh position={[0, 0.0005, -0.15]} rotation-x={-Math.PI / 2} receiveShadow userData={{ noCastShadow: true }}>
        <planeGeometry args={[5.3, 4.1]} />
        <meshPhysicalMaterial
          color="#f6ece0"
          map={floor}
          bumpMap={floor}
          bumpScale={0.4}
          roughness={0.55}
          clearcoat={0.35}
          clearcoatRoughness={0.4}
        />
      </mesh>

      <Rug />

      <FadingWall position={[0, 1.5, -2.22]} rotation={[0, 0, 0]} size={[5.4, 3]} normal={[0, 0, 1]}>
        <Shelf />
        <Pegboard />
      </FadingWall>
      <FadingWall
        position={[-2.69, 1.5, -0.85]}
        rotation={[0, Math.PI / 2, 0]}
        size={[2.75, 3]}
        normal={[1, 0, 0]}
      >
        <group position={[-2.67, 1.7, -1.1]} rotation={[0, Math.PI / 2, 0]}>
          <WallArt />
        </group>
        <group position={[-2.675, 1.65, -0.05]} rotation={[0, Math.PI / 2, 0]}>
          <Window width={0.85} height={0.95} />
        </group>
      </FadingWall>
      <PCTower position={[1.68, 0, -1.5]} />

      <Plant
        position={[-2.15, 0, -1.75]}
        scale={1.9}
        leaves={24}
        leafSize={[0.04, 0.14]}
        height={0.26}
        seed={21}
        potRadius={0.1}
        potHeight={0.2}
      />
      <Plant
        position={[2.2, 0, -1.85]}
        scale={1.8}
        leaves={22}
        leafSize={[0.04, 0.14]}
        height={0.24}
        seed={42}
        potRadius={0.1}
        potHeight={0.2}
      />
      <Plant position={[-2.2, 0, 0.9]} scale={1.6} leaves={14} seed={9} />
      <Plant position={[2.25, 0, 1.1]} scale={1.4} leaves={12} seed={17} potColor="#1f1f23" />
    </group>
  );
}
