// Starfield — a drifting field of soft, twinkling points.
// Per-vertex size + seed; size-attenuated; additive soft disc in the fragment.

export const starfieldVert = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vTwinkle;

  void main() {
    // slow per-star brightness wobble
    vTwinkle = 0.6 + 0.4 * sin(uTime * 0.8 + aSeed * 6.2831);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

export const starfieldFrag = /* glsl */ `
  uniform vec3 uColor;
  varying float vTwinkle;

  void main() {
    // soft radial disc, fades to 0 at the edge — no hard square points
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    gl_FragColor = vec4(uColor, a * vTwinkle);
  }
`;
