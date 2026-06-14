import * as THREE from "three";
import { starfieldVert, starfieldFrag } from "./shaders/starfield";

// Two parallax shells of stars so the void has depth as the camera moves.
export class Starfield {
  readonly group = new THREE.Group();
  private materials: THREE.ShaderMaterial[] = [];

  constructor(pixelRatio: number) {
    this.group.add(this.makeShell(1600, 170, 1.1, 0.5, "#bfd0ff", pixelRatio));
    this.group.add(this.makeShell(600, 100, 1.9, 1.0, "#ffffff", pixelRatio));
  }

  private makeShell(
    count: number,
    spread: number,
    sizeMax: number,
    sizeMin: number,
    color: string,
    pixelRatio: number
  ): THREE.Points {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
      size[i] = sizeMin + Math.random() * (sizeMax - sizeMin);
      seed[i] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uColor: { value: new THREE.Color(color) },
      },
      vertexShader: starfieldVert,
      fragmentShader: starfieldFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.materials.push(mat);
    return new THREE.Points(g, mat);
  }

  update(t: number, drift: number) {
    this.materials.forEach((m) => (m.uniforms.uTime.value = t));
    // counter-rotating shells = parallax
    this.group.children[0].rotation.y = drift * 0.04;
    this.group.children[1].rotation.y = -drift * 0.025;
  }
}
