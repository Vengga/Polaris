// Node-glow shader — one draw call for every node's soft aura.
// Per-vertex colour / size / seed; the active/selected node pulses brighter
// via aPulse written from the CPU. Additive so auras bloom into each other.

export const glowVert = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aSeed;
  attribute float aPulse;   // 0..1 extra intensity (selected / north-star)
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vPulse;

  void main() {
    vColor = aColor;
    float breathe = 1.0 + 0.06 * sin(uTime * 2.0 + aSeed * 6.2831);
    vPulse = aPulse;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float grow = (1.0 + aPulse * 0.5) * breathe;
    gl_PointSize = aSize * grow * uPixelRatio * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

export const glowFrag = /* glsl */ `
  varying vec3 vColor;
  varying float vPulse;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    // bright core falling off to a soft halo
    float core = smoothstep(1.0, 0.0, d);
    float halo = pow(core, 2.2);
    float a = halo * (0.55 + vPulse * 0.45);
    gl_FragColor = vec4(vColor * (1.0 + vPulse * 0.6), a);
  }
`;
