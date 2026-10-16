"use client";

export function CatFigurine({
  position,
  rotation = [0, 0, 0],
  scale = 1,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  const fur = <meshStandardMaterial color="#1a1a1f" roughness={0.35} metalness={0.1} />;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0.07, 0]} scale={[0.065, 0.08, 0.06]}>
        <sphereGeometry args={[1, 24, 16]} />
        {fur}
      </mesh>
      <mesh position={[0, 0.17, 0.01]}>
        <sphereGeometry args={[0.05, 24, 16]} />
        {fur}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.028, 0.215, 0.005]} rotation={[0, 0, -s * 0.35]}>
          <coneGeometry args={[0.018, 0.04, 4]} />
          {fur}
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`e${s}`} position={[s * 0.019, 0.178, 0.054]} scale={[1, 1.25, 0.5]}>
          <sphereGeometry args={[0.009, 12, 8]} />
          <meshStandardMaterial color="#facc15" emissive="#f59e0b" emissiveIntensity={0.6} />
        </mesh>
      ))}
      <mesh position={[0.05, 0.03, -0.04]} rotation={[Math.PI / 2, 0, 0.5]}>
        <torusGeometry args={[0.045, 0.011, 8, 16, Math.PI]} />
        {fur}
      </mesh>
    </group>
  );
}
