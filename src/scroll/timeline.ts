import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";
import type { Stage } from "../scene/Stage";

gsap.registerPlugin(ScrollTrigger);

// The gold North-Star route we fly in beat 4 (Aisha's galaxy, built at boot).
const STORY_PATH = ["sw", "be", "lead"];

interface ScrollOpts {
  reducedMotion: boolean;
}

// ════════════════════════════════════════════════════════════════════
// ONE continuous journey. A single scrubbed timeline drives the camera
// (stage.cam) and the hero dispersion through 7 beats; per-beat copy and
// waypoint cards reveal with their own triggers. Camera framing values are
// authored in world units; see Stage for how `cam` is applied each frame.
// ════════════════════════════════════════════════════════════════════
export function setupScroll(stage: Stage, lenis: Lenis | null, opts: ScrollOpts) {
  const g = stage.galaxy;
  const disp = stage.dispersion;

  // ── reveal copy for every beat as it scrolls in ──
  document.querySelectorAll<HTMLElement>(".beat").forEach((beat) => {
    const copy = beat.querySelector<HTMLElement>(".beat-copy");
    if (!copy) return;
    ScrollTrigger.create({
      trigger: beat,
      start: "top 70%",
      end: "bottom 30%",
      onEnter: () => copy.classList.add("in"),
      onEnterBack: () => copy.classList.add("in"),
    });
  });

  // ── hide the scroll cue after the first beat ──
  ScrollTrigger.create({
    trigger: '[data-beat="problem"]',
    start: "top 80%",
    onEnter: () => gsap.to("#scrollcue", { opacity: 0, duration: 0.4 }),
    onLeaveBack: () => gsap.to("#scrollcue", { opacity: 1, duration: 0.4 }),
  });

  // ── employer-side tint during the "two sides" beat ──
  ScrollTrigger.create({
    trigger: '[data-beat="twosides"]',
    start: "top 60%",
    end: "bottom 40%",
    toggleClass: { targets: "body", className: "employer-tint" },
  });

  if (opts.reducedMotion) {
    // Static, still-beautiful framing — no scrubbed camera. Park the camera
    // where the whole galaxy reads well and assemble the dispersion once.
    Object.assign(stage.cam, { px: 0, py: 3, pz: 40, lx: 0, ly: 0, lz: 0 });
    if (disp) {
      disp.progress = 1;
      disp.morph = 0;
    }
    g.highlightPath("lead");
    buildWaypoints(stage);
    document.querySelectorAll(".waypoint").forEach((w) => w.classList.add("in"));
    return;
  }

  // intro: the headline particles assemble out of dust on load
  if (disp) gsap.fromTo(disp, { progress: 0 }, { progress: 1, duration: 2.6, ease: "power2.out" });

  // ── master scrubbed camera timeline ──
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "#story",
      start: "top top",
      end: "bottom bottom",
      scrub: 1, // 1s catch-up = smooth, not jittery
    },
  });

  // BEAT 1→2 · push from open starfield toward the lone node; headline
  // particles morph from the word into a single dim node blob.
  tl.to(stage.cam, { px: 0, py: 1, pz: 24, lx: 0, ly: 1, lz: 0, ease: "power1.inOut", duration: 1 });
  if (disp) tl.to(disp, { morph: 1, duration: 1 }, "<");

  // BEAT 2→3 · pull back; the dispersion scatters away and the full galaxy
  // blooms into frame.
  tl.to(stage.cam, { px: -2, py: 4, pz: 44, lx: 0, ly: 0, lz: 0, ease: "power2.inOut", duration: 1 });
  if (disp) tl.to(disp, { progress: 0, duration: 0.6 }, "<");

  // BEAT 4 · fly the gold North-Star route. Light it up, then travel the
  // camera node-to-node while waypoint cards reveal in sequence.
  tl.call(() => g.highlightPath("lead"));
  STORY_PATH.forEach((id) => {
    const p = g.getNodePosition(id);
    if (!p) return;
    tl.to(stage.cam, {
      px: p.x + 7,
      py: p.y + 3,
      pz: p.z + 20,
      lx: p.x,
      ly: p.y,
      lz: p.z,
      ease: "power1.inOut",
      duration: 0.8,
    });
  });

  // BEAT 5 · two sides — rotate to read the galaxy from the employer end.
  tl.to(stage.cam, { px: 0, py: 2, pz: 46, lx: 0, ly: 0, lz: 0, ease: "power2.inOut", duration: 1 });
  tl.to(g.group.rotation, { y: Math.PI, ease: "power2.inOut", duration: 1 }, "<");

  // BEAT 6 · the four loops — a small nudge, route still lit.
  tl.to(stage.cam, { px: 3, py: 3, pz: 42, lx: 0, ly: 0, lz: 0, ease: "power1.inOut", duration: 1 });
  tl.to(g.group.rotation, { y: Math.PI * 2, ease: "power1.inOut", duration: 1 }, "<");

  // BEAT 7 · close — drift back out into open space.
  tl.to(stage.cam, { px: 0, py: 2, pz: 60, lx: 0, ly: 0, lz: 0, ease: "power2.inOut", duration: 1 });

  // waypoint cards, revealed across the (tall) path beat
  buildWaypoints(stage);

  // keep ScrollTrigger in lock-step with Lenis' inertial scroll
  if (lenis) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  ScrollTrigger.refresh();
}

// Build a glass waypoint card per node on the route, each revealing as the
// camera reaches its third of the path beat.
function buildWaypoints(stage: Stage) {
  const wrap = document.getElementById("waypoints");
  const g = stage.galaxy;
  if (!wrap || !g.P) return;
  wrap.innerHTML = "";

  STORY_PATH.forEach((id, i) => {
    const nd = g.P!.nodes.find((n) => n.id === id);
    if (!nd) return;
    const odds = Math.round((g.reachP[id] || 0) * 100);
    const inc = g.P!.edges.find((e) => e.t === id && e.f === g.parent[id]);
    const time = id === g.P!.start ? "now" : inc ? inc.y : "—";

    const card = document.createElement("div");
    card.className = "waypoint";
    card.innerHTML = `
      <div class="wp-step">Waypoint ${i + 1} / ${STORY_PATH.length}</div>
      <h3>${nd.label.replace("★ ", "").replace("✦ ", "")}</h3>
      <div class="wp-stats">
        <div><div class="k">Reach odds</div><div class="v">${id === g.P!.start ? "start" : odds + "%"}</div></div>
        <div><div class="k">Typical time</div><div class="v">${time}</div></div>
        <div><div class="k">Pay · RM/mo</div><div class="v">${nd.pay}</div></div>
      </div>
      <p class="wp-skill"><b>Unlock:</b> ${nd.skill}</p>`;
    wrap.appendChild(card);
  });

  // one trigger per third of the path beat → swap the active card
  const cards = wrap.querySelectorAll<HTMLElement>(".waypoint");
  const beat = document.querySelector<HTMLElement>('[data-beat="path"]')!;
  cards.forEach((card, i) => {
    ScrollTrigger.create({
      trigger: beat,
      start: `${8 + i * 30}% center`,
      end: `${8 + (i + 1) * 30}% center`,
      onToggle: (self) => {
        cards.forEach((c) => c.classList.remove("in"));
        if (self.isActive) card.classList.add("in");
      },
    });
  });
}
