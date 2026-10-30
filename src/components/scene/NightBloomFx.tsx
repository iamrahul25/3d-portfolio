"use client";

import { Bloom, EffectComposer } from "@react-three/postprocessing";

// Threshold sits above 1.0: screens are unlit, non-tone-mapped and capped at 1.0, so only
// HDR emissives (lamp bulb, shelf strip, PC light) bloom and screen text stays sharp.
export default function NightBloomFx() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.7} luminanceThreshold={1.05} luminanceSmoothing={0.2} radius={0.7} />
    </EffectComposer>
  );
}
