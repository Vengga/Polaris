import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

// UnrealBloom gives the galaxy its glow. Built lazily and only on the
// high-power path — the low-power fallback renders the scene directly.
export function buildComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  w: number,
  h: number
): { composer: EffectComposer; bloom: UnrealBloomPass } {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(w, h),
    0.62, // strength — restrained, so glow reads as light not haze
    0.6, // radius
    0.34 // threshold — only the brightest cores bloom
  );
  composer.addPass(bloom);
  return { composer, bloom };
}
