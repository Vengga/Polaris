// ── Capability detection ─────────────────────────────────────────────
// Decides how much of the experience to run. The site must NEVER show a
// blank canvas or crash, so every heavy feature is gated through here.

export interface Capabilities {
  webgl: boolean;
  /** run bloom + dispersion + auto-orbit? false on weak devices / reduced-motion */
  highPower: boolean;
  reducedMotion: boolean;
  isMobile: boolean;
  pixelRatio: number;
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl2") || c.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

export function detectCapabilities(): Capabilities {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const isMobile = window.matchMedia("(max-width: 820px)").matches;

  // deviceMemory is non-standard but a useful low-power signal where present
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const weakMemory = typeof mem === "number" && mem <= 4;
  const fewCores =
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 4;

  const webgl = hasWebGL();
  const highPower = webgl && !reducedMotion && !weakMemory && !(isMobile && fewCores);

  return {
    webgl,
    highPower,
    reducedMotion,
    isMobile,
    // cap pixel ratio at 2 (1.5 on phones) — a non-negotiable perf rule
    pixelRatio: Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2),
  };
}
