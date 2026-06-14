import * as THREE from "three";
import type { Mode, Persona } from "../data/types";
import { COOL } from "../data/career-model";
import { layout, computeReach, pathTo } from "../data/engine";
import { glowVert, glowFrag } from "./shaders/glow";

const EDGE_DIM = new THREE.Color(0x32406a);

// The career galaxy: nodes, light-trail edges, glow halos, travellers.
// One group the App orbits / frames; geometry is shared where it pays off.
export class Galaxy {
  readonly group = new THREE.Group();
  private nodeGroup = new THREE.Group();
  private edgeGroup = new THREE.Group();
  private travGroup = new THREE.Group();

  private sphereGeo = new THREE.SphereGeometry(1, 24, 24);
  private haloMat: THREE.ShaderMaterial;
  private travMat: THREE.ShaderMaterial;

  /** raycast targets — one mesh per node, sharing geometry */
  nodeMeshes: THREE.Mesh[] = [];
  P: Persona | null = null;
  mode: Mode = "candidate";
  accent = "#FFD66B";
  reachP: Record<string, number> = {};
  parent: Record<string, string> = {};

  private order: string[] = []; // node id order for halo attribute writes
  private pulse: Float32Array = new Float32Array(0);
  private haloGeo: THREE.BufferGeometry | null = null;

  private travCurve: THREE.Vector3[] | null = null;
  private travPoints: THREE.Points | null = null;

  selected: string | null = null;
  northStar: string | null = null;

  constructor(pixelRatio: number) {
    this.group.add(this.edgeGroup, this.nodeGroup, this.travGroup);
    this.haloMat = this.makeGlowMat(pixelRatio);
    this.travMat = this.makeGlowMat(pixelRatio);
  }

  private makeGlowMat(pixelRatio: number) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: pixelRatio },
      },
      vertexShader: glowVert,
      fragmentShader: glowFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }

  private clear() {
    // Dispose only per-build resources. NB: node spheres share this.sphereGeo
    // and halos/travellers share haloMat/travMat — those must NOT be disposed.
    this.nodeGroup.children.forEach((c) => {
      if (c instanceof THREE.Mesh) (c.material as THREE.Material).dispose(); // unique material, shared geo
      else if (c instanceof THREE.Points) c.geometry.dispose(); // unique halo geo, shared mat
    });
    this.edgeGroup.children.forEach((c) => {
      const l = c as THREE.Line;
      l.geometry.dispose();
      (l.material as THREE.Material).dispose();
    });
    this.travGroup.children.forEach((c) => (c as THREE.Points).geometry.dispose());

    [this.nodeGroup, this.edgeGroup, this.travGroup].forEach((g) => {
      while (g.children.length) g.remove(g.children[0]);
    });
    this.nodeMeshes = [];
    this.travCurve = null;
    this.travPoints = null;
    this.haloGeo = null;
  }

  build(P: Persona, mode: Mode, accent: string) {
    this.clear();
    this.P = P;
    this.mode = mode;
    this.accent = accent;
    layout(P.nodes);
    const { reachP, parent } = computeReach(P, mode);
    this.reachP = reachP;
    this.parent = parent;
    const maxReach = Math.max(...Object.values(reachP), 0.01);

    // ── edges (light trails) ──
    P.edges.forEach((e) => {
      const a = P.nodes.find((n) => n.id === e.f)!;
      const b = P.nodes.find((n) => n.id === e.t)!;
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(a.x, a.y, a.z),
        new THREE.Vector3(b.x, b.y, b.z),
      ]);
      const mat = new THREE.LineBasicMaterial({
        color: EDGE_DIM.clone(),
        transparent: true,
        opacity: 0.4,
      });
      const line = new THREE.Line(geo, mat);
      line.userData = { f: e.f, t: e.t };
      this.edgeGroup.add(line);
    });

    // ── node cores + halo attributes ──
    this.order = [];
    const haloPos: number[] = [];
    const haloColor: number[] = [];
    const haloSize: number[] = [];
    const haloSeed: number[] = [];

    P.nodes.forEach((nd) => {
      const isStart = nd.id === P.start;
      const r = (reachP[nd.id] || 0) / maxReach;
      const col = isStart
        ? new THREE.Color(accent)
        : new THREE.Color(COOL).lerp(new THREE.Color(accent), Math.pow(r, 0.6));
      const size = isStart ? 1.3 : 0.62 + r * 0.5;

      const sph = new THREE.Mesh(
        this.sphereGeo,
        new THREE.MeshBasicMaterial({ color: col })
      );
      sph.scale.setScalar(size);
      sph.position.set(nd.x!, nd.y!, nd.z!);
      sph.userData = { id: nd.id, base: size };
      this.nodeGroup.add(sph);
      this.nodeMeshes.push(sph);

      this.order.push(nd.id);
      haloPos.push(nd.x!, nd.y!, nd.z!);
      haloColor.push(col.r, col.g, col.b);
      haloSize.push(size * (isStart ? 17 : 11));
      haloSeed.push(Math.random());
    });

    // ── halos: single Points, one draw call ──
    const hg = new THREE.BufferGeometry();
    hg.setAttribute("position", new THREE.Float32BufferAttribute(haloPos, 3));
    hg.setAttribute("aColor", new THREE.Float32BufferAttribute(haloColor, 3));
    hg.setAttribute("aSize", new THREE.Float32BufferAttribute(haloSize, 1));
    hg.setAttribute("aSeed", new THREE.Float32BufferAttribute(haloSeed, 1));
    this.pulse = new Float32Array(this.order.length);
    hg.setAttribute("aPulse", new THREE.BufferAttribute(this.pulse, 1));
    this.haloGeo = hg;
    this.nodeGroup.add(new THREE.Points(hg, this.haloMat));

    this.highlightPath(null);
  }

  // ── most-probable route highlight + travellers ──
  highlightPath(goalId: string | null) {
    const path = goalId ? pathTo(goalId, this.parent) : [];
    const set = new Set<string>();
    for (let i = 0; i < path.length - 1; i++) set.add(path[i] + ">" + path[i + 1]);

    this.edgeGroup.children.forEach((l: THREE.Object3D) => {
      const line = l as THREE.Line;
      const key = line.userData.f + ">" + line.userData.t;
      const on = set.has(key);
      const m = line.material as THREE.LineBasicMaterial;
      m.color.set(on ? this.accent : EDGE_DIM.getHex());
      m.opacity = on ? 0.95 : 0.3;
    });

    // travellers ride the highlighted polyline
    while (this.travGroup.children.length) this.travGroup.remove(this.travGroup.children[0]);
    this.travPoints = null;
    this.travCurve = null;
    if (path.length > 1 && this.P) {
      this.travCurve = path.map((id) => {
        const n = this.P!.nodes.find((x) => x.id === id)!;
        return new THREE.Vector3(n.x, n.y, n.z);
      });
      const N = 7;
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
      const col = new THREE.Color(this.accent);
      const c = new Float32Array(N * 3);
      const s = new Float32Array(N);
      const sd = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b;
        s[i] = 6; sd[i] = Math.random();
      }
      g.setAttribute("aColor", new THREE.BufferAttribute(c, 3));
      g.setAttribute("aSize", new THREE.BufferAttribute(s, 1));
      g.setAttribute("aSeed", new THREE.BufferAttribute(sd, 1));
      g.setAttribute("aPulse", new THREE.BufferAttribute(new Float32Array(N).fill(1), 1));
      this.travPoints = new THREE.Points(g, this.travMat);
      this.travGroup.add(this.travPoints);
    }
    this.refreshPulse();
  }

  getNodePosition(id: string): THREE.Vector3 | null {
    const n = this.P?.nodes.find((x) => x.id === id);
    return n ? new THREE.Vector3(n.x, n.y, n.z) : null;
  }

  setSelected(id: string | null) {
    this.selected = id;
    this.refreshPulse();
  }
  setNorthStar(id: string | null) {
    this.northStar = id;
    this.refreshPulse();
  }

  private refreshPulse() {
    if (!this.haloGeo) return;
    this.order.forEach((id, i) => {
      this.pulse[i] = id === this.selected || id === this.northStar ? 1 : 0;
    });
    (this.haloGeo.getAttribute("aPulse") as THREE.BufferAttribute).needsUpdate = true;
    // brighten selected core
    this.nodeMeshes.forEach((m) => {
      const sel = m.userData.id === this.selected || m.userData.id === this.northStar;
      m.scale.setScalar(m.userData.base * (sel ? 1.18 : 1));
    });
  }

  private sample(t: number): THREE.Vector3 {
    if (!this.travCurve) return new THREE.Vector3();
    const seg = this.travCurve.length - 1;
    const ft = t * seg;
    const i = Math.min(Math.floor(ft), seg - 1);
    const f = ft - i;
    return this.travCurve[i].clone().lerp(this.travCurve[i + 1], f);
  }

  update(t: number) {
    this.haloMat.uniforms.uTime.value = t;
    this.travMat.uniforms.uTime.value = t;
    if (this.travPoints && this.travCurve) {
      const pos = this.travPoints.geometry.getAttribute("position") as THREE.BufferAttribute;
      const N = pos.count;
      for (let i = 0; i < N; i++) {
        const tt = (t * 0.12 + i / N) % 1;
        const p = this.sample(tt);
        pos.setXYZ(i, p.x, p.y, p.z);
      }
      pos.needsUpdate = true;
    }
  }
}
