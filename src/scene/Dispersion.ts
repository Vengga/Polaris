import * as THREE from "three";
import { dispersionVert, dispersionFrag } from "./shaders/dispersion";

// Hero particle dispersion: text → points. The headline "next" resolves out
// of dust (beat 1), then morphs into a lone node blob (beat 2).
export class Dispersion {
  readonly points: THREE.Points;
  private mat: THREE.ShaderMaterial;

  constructor(pixelRatio: number, color: string) {
    const { targets } = sampleText("next", 240);
    const n = targets.length / 3;

    const scatter = new Float32Array(n * 3);
    const node = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      // scattered start — a loose cloud
      scatter[i * 3] = (Math.random() - 0.5) * 60;
      scatter[i * 3 + 1] = (Math.random() - 0.5) * 40;
      scatter[i * 3 + 2] = (Math.random() - 0.5) * 50 - 10;
      // lone-node blob target — a small fuzzy sphere at the origin
      const r = 1.2 + Math.random() * 1.4;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      node[i * 3] = r * Math.sin(ph) * Math.cos(th);
      node[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      node[i * 3 + 2] = r * Math.cos(ph);
      seed[i] = Math.random();
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(targets, 3));
    g.setAttribute("aScatter", new THREE.BufferAttribute(scatter, 3));
    g.setAttribute("aNode", new THREE.BufferAttribute(node, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));

    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uMorph: { value: 0 },
        uTime: { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uSize: { value: 1.3 },
        uColor: { value: new THREE.Color(color) },
      },
      vertexShader: dispersionVert,
      fragmentShader: dispersionFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.position.set(0, 1.5, 0);
  }

  set progress(v: number) {
    this.mat.uniforms.uProgress.value = v;
  }
  set morph(v: number) {
    this.mat.uniforms.uMorph.value = v;
  }
  set color(hex: string) {
    (this.mat.uniforms.uColor.value as THREE.Color).set(hex);
  }
  update(t: number) {
    this.mat.uniforms.uTime.value = t;
  }
}

// Rasterise text on a 2D canvas, then sample lit pixels into a centred point
// cloud on the z=0 plane. `density` ≈ samples across the text width.
function sampleText(text: string, density: number): { targets: Float32Array } {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 320;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "italic 280px 'Instrument Serif', Georgia, serif";
  ctx.fillText(text, c.width / 2, c.height / 2);

  const img = ctx.getImageData(0, 0, c.width, c.height).data;
  const step = Math.max(1, Math.floor(c.width / density));
  const pts: number[] = [];
  const worldW = 18; // world units across the headline
  const scale = worldW / c.width;
  for (let y = 0; y < c.height; y += step) {
    for (let x = 0; x < c.width; x += step) {
      const a = img[(y * c.width + x) * 4 + 3];
      if (a > 128) {
        // jitter a little so the type doesn't look like a rigid grid
        const jx = (Math.random() - 0.5) * step * scale;
        const jy = (Math.random() - 0.5) * step * scale;
        pts.push(
          (x - c.width / 2) * scale + jx,
          -(y - c.height / 2) * scale + jy,
          (Math.random() - 0.5) * 0.6
        );
      }
    }
  }
  return { targets: new Float32Array(pts) };
}
