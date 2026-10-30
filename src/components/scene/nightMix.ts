// Shared 0 (day) → 1 (night) blend, eased once per frame by <Lights> in Scene.tsx.
// Scene parts read it in their own useFrame so everything fades in lockstep.
export const nightMix = { value: 0 };
