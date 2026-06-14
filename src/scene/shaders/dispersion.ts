// Hero particle-dispersion shader — the ONE signature effect.
// Each point owns a scattered position (aScatter) and an assembled target
// (position). uProgress 0..1 mixes scatter→assemble with a per-point delay
// so the headline/word resolves out of drifting dust, and scatters back.

export const dispersionVert = /* glsl */ `
  attribute vec3 aScatter;
  attribute vec3 aNode;      // alternate assembled target: the "lone node" blob
  attribute float aSeed;
  uniform float uProgress;   // 0 = scattered, 1 = assembled
  uniform float uMorph;      // 0 = headline target, 1 = lone-node target
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;
  varying float vAlpha;

  // staggered ease so points snap into place at slightly different times
  float ease(float t){ return t*t*(3.0-2.0*t); }

  void main() {
    float delay = aSeed * 0.4;
    float p = clamp((uProgress - delay) / (1.0 - delay), 0.0, 1.0);
    p = ease(p);

    vec3 target = mix(position, aNode, uMorph);

    // gentle drift while scattered, settling as it assembles
    vec3 drift = vec3(
      sin(uTime * 0.5 + aSeed * 30.0),
      cos(uTime * 0.4 + aSeed * 22.0),
      sin(uTime * 0.6 + aSeed * 11.0)
    ) * (1.0 - p) * 1.4;

    vec3 pos = mix(aScatter, target, p) + drift;

    vAlpha = mix(0.18, 1.0, p);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * uPixelRatio * (300.0 / -mv.z) * (0.6 + p * 0.4);
    gl_Position = projectionMatrix * mv;
  }
`;

export const dispersionFrag = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, a * vAlpha);
  }
`;
