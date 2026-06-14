import "./style.css";
import Lenis from "lenis";
import { detectCapabilities } from "./core/capabilities";
import { Stage } from "./scene/Stage";
import { GalaxyUI } from "./ui/controller";
import { setupScroll } from "./scroll/timeline";
import { PILLARS } from "./data/career-model";

// ── data-driven static DOM (pillars) ──
const pillarsEl = document.getElementById("pillars")!;
pillarsEl.innerHTML = PILLARS.map(
  (p) => `<div class="pillar"><div class="num">${p.n}</div><h3>${p.h}</h3><p>${p.p}</p></div>`
).join("");

const caps = detectCapabilities();
const canvas = document.getElementById("gl") as HTMLCanvasElement;

// ── boot the 3D stage, or fall back to a still-beautiful 2D galaxy ──
let stage: Stage | null = null;
try {
  if (!caps.webgl) throw new Error("WebGL unavailable");
  stage = new Stage(canvas, caps);
} catch (err) {
  console.warn("[Polaris] WebGL init failed — using 2D fallback.", err);
  enableFallback();
}

if (stage) {
  const s = stage;
  const ui = new GalaxyUI(s);

  // ── HTML node labels (shown in explore mode only) ──
  const labelsEl = document.getElementById("labels")!;
  const labelDivs = new Map<string, HTMLDivElement>();

  const buildLabels = () => {
    labelsEl.innerHTML = "";
    labelDivs.clear();
    const P = s.galaxy.P;
    if (!P) return;
    P.nodes.forEach((nd) => {
      const isStart = nd.id === P.start;
      const div = document.createElement("div");
      div.className = "nlabel" + (isStart ? " start" : "");
      const pp = isStart
        ? ""
        : `<span class="pp">${Math.round((s.galaxy.reachP[nd.id] || 0) * 100)}%</span>`;
      div.innerHTML = (isStart ? "✦ " : "") + nd.label.replace("★ ", "") + pp;
      labelsEl.appendChild(div);
      labelDivs.set(nd.id, div);
    });
  };

  const updateLabels = () => {
    labelDivs.forEach((div, id) => {
      const pr = s.projectNode(id);
      if (!pr || !pr.visible) {
        div.style.opacity = "0";
        return;
      }
      div.style.left = pr.x + "px";
      div.style.top = pr.y + "px";
      const focus = id === s.galaxy.selected || id === s.galaxy.northStar;
      div.style.opacity = focus ? "1" : "0.78";
    });
  };

  ui.onBuild = buildLabels;
  ui.build(); // default: Aisha's candidate galaxy (so the story has a map to fly)

  s.onFrame = () => {
    if (s.isInteractive) updateLabels();
    else labelDivs.forEach((d) => (d.style.opacity = "0"));
  };

  // ── smooth inertial scroll (skipped under reduced-motion) ──
  const lenis = caps.reducedMotion
    ? null
    : new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 0.9, autoRaf: false });

  setupScroll(s, lenis, { reducedMotion: caps.reducedMotion });
  (window as unknown as { __lenis: Lenis | null }).__lenis = lenis; // deep-link / debug

  // ── explore mode: pause the story, hand control to drag-orbit ──
  const explore = document.getElementById("explore")!;
  const enterExplore = () => {
    explore.classList.add("active");
    explore.setAttribute("aria-hidden", "false");
    document.body.classList.add("exploring");
    document.getElementById("dockLabel")!.textContent =
      ui.mode === "employer"
        ? "Open a role · who’s trending toward it ↓"
        : "Switch profile · drag the galaxy · click a star";
    s.enterExplore();
    lenis?.stop();
  };
  const exitExplore = () => {
    explore.classList.remove("active");
    explore.setAttribute("aria-hidden", "true");
    document.body.classList.remove("exploring");
    s.exitExplore();
    lenis?.start();
  };

  document.getElementById("exploreBtn")!.addEventListener("click", enterExplore);
  document.getElementById("exploreBtn2")!.addEventListener("click", enterExplore);
  // deep-link straight into the interactive galaxy (e.g. polaris.app/#explore)
  if (location.hash === "#explore") setTimeout(enterExplore, 300);
  document.getElementById("exitExplore")!.addEventListener("click", exitExplore);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && s.isInteractive) exitExplore();
  });
}

// ── 2D fallback: never a blank canvas, never a crash ──
function enableFallback() {
  document.body.classList.add("fallback");
  const stars = document.createElement("div");
  stars.className = "fallback-stars";
  document.body.prepend(stars);
  // reveal all story copy + waypoints since there's no ScrollTrigger
  document.querySelectorAll(".beat-copy").forEach((c) => c.classList.add("in"));
  document.querySelectorAll(".waypoint").forEach((w) => w.classList.add("in"));
  // explore depends on WebGL — hide its entry points
  document.querySelectorAll(".explore-cta").forEach((b) => ((b as HTMLElement).style.display = "none"));
}
