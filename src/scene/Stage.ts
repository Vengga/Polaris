import * as THREE from "three";
import type { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { Starfield } from "./Starfield";
import { Galaxy } from "./Galaxy";
import { Dispersion } from "./Dispersion";
import { buildComposer } from "./post";
import type { Capabilities } from "../core/capabilities";

export interface CamState {
  px: number; py: number; pz: number; // camera position
  lx: number; ly: number; lz: number; // look-at target
}

// Owns the renderer, scene graph and the single render loop. Two camera
// regimes: STORY (scroll writes `cam`) and EXPLORE (pointer drag-orbits).
export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly galaxy: Galaxy;
  readonly starfield: Starfield;
  readonly dispersion: Dispersion | null;

  /** scroll timeline writes camera framing here (story mode) */
  readonly cam: CamState = { px: 0, py: 1.5, pz: 62, lx: 0, ly: 0, lz: 0 };

  private composer: EffectComposer | null = null;
  private caps: Capabilities;
  private clock = new THREE.Clock();
  private t = 0;

  // explore-mode orbit state
  private interactive = false;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private idle = 0;
  private exploreZoom = 34;

  onNodeClick: (id: string) => void = () => {};
  onHoverChange: (id: string | null) => void = () => {};
  /** called at the end of every rendered frame (used for HTML label projection) */
  onFrame: () => void = () => {};

  private ray = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private hovered: string | null = null;

  constructor(private canvas: HTMLCanvasElement, caps: Capabilities) {
    this.caps = caps;
    // may throw on a hostile environment — caller wraps in try/catch
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(caps.pixelRatio);
    this.scene.fog = new THREE.FogExp2(0x060912, 0.016);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
    this.camera.position.set(this.cam.px, this.cam.py, this.cam.pz);

    this.starfield = new Starfield(caps.pixelRatio);
    this.scene.add(this.starfield.group);

    this.galaxy = new Galaxy(caps.pixelRatio);
    this.scene.add(this.galaxy.group);

    // The hero particle word only runs where it stays legible — on phones the
    // HTML headline carries "next" instead, keeping the hero uncluttered.
    this.dispersion =
      caps.highPower && !caps.isMobile
        ? new Dispersion(caps.pixelRatio, "#FFD66B")
        : null;
    if (this.dispersion) this.scene.add(this.dispersion.points);

    this.resize();
    window.addEventListener("resize", this.resize);

    if (caps.highPower) {
      const { composer } = buildComposer(
        this.renderer, this.scene, this.camera,
        canvas.clientWidth, canvas.clientHeight
      );
      this.composer = composer;
    }

    this.bindPointer();
    this.renderer.setAnimationLoop(this.frame);
  }

  // ── interaction ────────────────────────────────────────────────────
  private bindPointer() {
    this.canvas.addEventListener("pointerdown", (e) => {
      if (!this.interactive) return;
      this.dragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.idle = 0;
    });
    window.addEventListener("pointerup", () => (this.dragging = false));
    window.addEventListener("pointermove", (e) => {
      if (!this.interactive) return;
      if (this.dragging) {
        const dx = (e.clientX - this.lastX) / 200;
        const dy = (e.clientY - this.lastY) / 260;
        this.galaxy.group.rotation.y += dx;
        this.galaxy.group.rotation.x = THREE.MathUtils.clamp(
          this.galaxy.group.rotation.x + dy, -0.7, 0.7
        );
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        this.idle = 0;
      } else {
        this.hover(e);
      }
    });
    this.canvas.addEventListener(
      "wheel",
      (e) => {
        if (!this.interactive) return;
        e.preventDefault();
        this.exploreZoom = THREE.MathUtils.clamp(this.exploreZoom + e.deltaY * 0.02, 16, 60);
      },
      { passive: false }
    );
    this.canvas.addEventListener("click", (e) => {
      if (!this.interactive || this.dragging) return;
      this.setNDC(e);
      this.ray.setFromCamera(this.ndc, this.camera);
      const hit = this.ray.intersectObjects(this.galaxy.nodeMeshes)[0];
      if (hit) this.onNodeClick((hit.object as THREE.Mesh).userData.id);
    });
  }

  private setNDC(e: PointerEvent | MouseEvent) {
    const r = this.canvas.getBoundingClientRect();
    this.ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }

  private hover(e: PointerEvent) {
    this.setNDC(e);
    this.ray.setFromCamera(this.ndc, this.camera);
    const hit = this.ray.intersectObjects(this.galaxy.nodeMeshes)[0];
    const id = hit ? (hit.object as THREE.Mesh).userData.id : null;
    if (id !== this.hovered) {
      this.hovered = id;
      this.canvas.style.cursor = id ? "pointer" : "grab";
      this.onHoverChange(id);
    }
  }

  enterExplore() {
    this.interactive = true;
    this.canvas.style.cursor = "grab";
    // frame the whole galaxy head-on
    this.exploreZoom = this.caps.isMobile ? 46 : 36;
    if (this.dispersion) this.dispersion.points.visible = false; // hide hero dust
  }
  exitExplore() {
    this.interactive = false;
    this.canvas.style.cursor = "default";
    if (this.dispersion) this.dispersion.points.visible = true;
  }
  get isInteractive() {
    return this.interactive;
  }

  // ── projection for HTML labels ─────────────────────────────────────
  projectNode(id: string): { x: number; y: number; visible: boolean } | null {
    const local = this.galaxy.getNodePosition(id);
    if (!local) return null;
    this.galaxy.group.updateMatrixWorld();
    const v = local.applyMatrix4(this.galaxy.group.matrixWorld).project(this.camera);
    return {
      x: (v.x * 0.5 + 0.5) * this.canvas.clientWidth,
      y: (-v.y * 0.5 + 0.5) * this.canvas.clientHeight,
      visible: v.z < 1,
    };
  }

  // ── loop ───────────────────────────────────────────────────────────
  private frame = () => {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (!this.caps.reducedMotion) this.t += dt;

    this.starfield.update(this.t, this.caps.reducedMotion ? 0 : this.t);
    this.galaxy.update(this.t);
    this.dispersion?.update(this.t);

    // gentle auto-orbit when idle (reads as the galaxy slowly turning)
    if (!this.caps.reducedMotion) {
      this.idle += dt;
      if (!this.dragging && this.idle > 0.8) this.galaxy.group.rotation.y += 0.0009;
    }

    if (this.interactive) {
      // explore: fixed framing, user spins the galaxy
      this.camera.position.set(0, 2, this.exploreZoom);
      this.camera.lookAt(0, 0, 0);
    } else {
      // story: scroll wrote `cam`
      this.camera.position.set(this.cam.px, this.cam.py, this.cam.pz);
      this.camera.lookAt(this.cam.lx, this.cam.ly, this.cam.lz);
    }

    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);

    this.onFrame();
  };

  private resize = () => {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.composer?.setSize(w, h);
  };

  dispose() {
    this.renderer.setAnimationLoop(null);
    window.removeEventListener("resize", this.resize);
    this.renderer.dispose();
  }
}
