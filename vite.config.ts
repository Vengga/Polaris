import { defineConfig } from "vite";

// Static build for Netlify / Vercel / GH Pages.
// base:'./' keeps asset paths relative so it works under any sub-path (e.g. GH Pages project sites).
export default defineConfig({
  base: "./",
  build: {
    target: "es2020",
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // split the heavy three.js (+ addons) into its own cacheable chunk
        manualChunks: {
          three: ["three", "three/addons/postprocessing/EffectComposer.js"],
          motion: ["gsap", "gsap/ScrollTrigger", "lenis"],
        },
      },
    },
  },
});
