import { DATA } from "../data/career-model";
import type { Mode } from "../data/types";
import type { Stage } from "../scene/Stage";

const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const strip = (s: string) => s.replace("★ ", "").replace("✦ ", "");

// Wires the interactive (explore) galaxy: chips, detail panel, North Star,
// candidate/employer toggle. Mirrors the source prototype's behaviour.
export class GalaxyUI {
  mode: Mode = "candidate";
  personaKey: string;
  /** fired after every (re)build so the host can rebuild HTML node labels */
  onBuild: () => void = () => {};

  private panel = $("panel");
  private nsbar = $("nsbar");

  constructor(private stage: Stage) {
    this.personaKey = Object.keys(DATA.candidate.personas)[0];

    this.stage.onNodeClick = (id) => this.openNode(id);

    $("closePanel").onclick = () => this.closePanel();
    $("clearns").onclick = () => this.clearNorth();

    document.querySelectorAll<HTMLButtonElement>("#modeToggle button").forEach((btn) => {
      btn.onclick = () => this.setMode(btn.dataset.mode as Mode, btn);
    });

    this.renderChips();
  }

  /** (re)build the galaxy for the current mode + persona and sync accent. */
  build() {
    const md = DATA[this.mode];
    const P = md.personas[this.personaKey];
    document.documentElement.style.setProperty("--accent", md.accent);
    if (this.stage.dispersion) this.stage.dispersion.color = md.accent;
    this.stage.galaxy.build(P, this.mode, md.accent);
    this.closePanel();
    this.clearNorth();
    this.onBuild();
  }

  private setMode(mode: Mode, btn: HTMLButtonElement) {
    document.querySelectorAll("#modeToggle button").forEach((b) => b.classList.remove("on"));
    btn.classList.add("on");
    this.mode = mode;
    this.personaKey = Object.keys(DATA[mode].personas)[0];
    this.renderChips();
    this.build();
    $("dockLabel").textContent =
      mode === "employer"
        ? "Open a role · who’s trending toward it ↓"
        : "Switch profile · drag the galaxy · click a star";
  }

  selectPersona(key: string) {
    this.personaKey = key;
    this.renderChips();
    this.build();
  }

  private renderChips() {
    const el = $("chips");
    el.innerHTML = "";
    const ps = DATA[this.mode].personas;
    Object.keys(ps).forEach((k) => {
      const p = ps[k];
      const b = document.createElement("button");
      b.className = "chip" + (k === this.personaKey ? " on" : "");
      b.type = "button";
      b.innerHTML = `<b>${p.name}</b><span>${p.sub}</span>`;
      b.onclick = () => this.selectPersona(k);
      el.appendChild(b);
    });
  }

  // ── detail panel ────────────────────────────────────────────────────
  openNode(id: string) {
    const g = this.stage.galaxy;
    const P = g.P;
    if (!P) return;
    const nd = P.nodes.find((n) => n.id === id);
    if (!nd) return;
    g.setSelected(id);

    const isStart = id === P.start;
    const emp = this.mode === "employer";
    const pr = Math.round((g.reachP[id] || 0) * 100);

    $("pTier").textContent = isStart
      ? "YOUR STARTING POINT"
      : emp
      ? "CANDIDATE / RADAR"
      : `TIER ${nd.t}`;
    $("pTitle").textContent = strip(nd.label);
    $("pDesc").textContent = nd.desc;

    $("pProbK").textContent = emp ? (isStart ? "Open role" : "Match strength") : "Reach odds";
    $("pProb").innerHTML = isStart
      ? emp
        ? "<small>target</small>"
        : "<small>start</small>"
      : pr + "%";
    ($("pMeter") as HTMLElement).style.width = (isStart ? 100 : pr) + "%";

    $("pTimeK").textContent = emp ? "Availability" : "Typical time";
    let tt = "—";
    if (emp) {
      if (!isStart) {
        const out = P.edges.find((e) => e.f === id);
        tt = out ? out.y : "—";
      }
    } else {
      const inc = P.edges.find((e) => e.t === id && e.f === g.parent[id]);
      if (inc) tt = inc.y;
      if (isStart) tt = "now";
    }
    $("pTime").textContent = tt;

    $("pPayK").textContent = emp ? "Trajectory fit" : "Pay range · RM / month";
    $("pPay").textContent = nd.pay;

    // unlocking skill
    const uw = $("unlockWrap");
    const uK = emp ? "Why they’re a match" : isStart ? "Do this first" : "Skill that unlocks this";
    const uP = emp
      ? "The trajectory signal that puts them in front of a keyword filter."
      : isStart
      ? "The move that opens the most branches from here."
      : "Build this and the odds above move in your favour.";
    uw.innerHTML =
      nd.skill && nd.skill !== "—"
        ? `<div class="unlock"><div class="k">${uK}</div><div class="v">${nd.skill}</div><p>${uP}</p></div>`
        : "";

    // outgoing moves
    const out = P.edges.filter((e) => e.f === id);
    const mw = $("movesWrap");
    if (out.length) {
      mw.innerHTML =
        '<div class="p-sec-h">' +
        (emp ? "Feeds into" : "Where this leads") +
        "</div>" +
        out
          .sort((a, b) => b.p - a.p)
          .map((e) => {
            const tn = P.nodes.find((n) => n.id === e.t)!;
            return `<div class="move" data-go="${e.t}"><span class="mn">${strip(
              tn.label
            )}</span><span class="mp">${Math.round(e.p * 100)}%</span></div>`;
          })
          .join("");
      mw.querySelectorAll<HTMLElement>(".move").forEach(
        (m) => (m.onclick = () => this.openNode(m.dataset.go!))
      );
    } else {
      mw.innerHTML =
        '<div class="p-sec-h">' + (emp ? "Ready for your role" : "A destination") + "</div>";
    }

    // north-star button
    const nb = $<HTMLButtonElement>("northBtn");
    if (isStart || emp) {
      nb.style.display = "none";
    } else {
      nb.style.display = "flex";
      if (g.northStar === id) {
        nb.classList.add("active");
        nb.innerHTML = "✦ This is your North Star";
      } else {
        nb.classList.remove("active");
        nb.innerHTML = "✦ Set as my North Star";
      }
      nb.onclick = () => this.setNorth(id);
    }

    this.panel.classList.add("open");
    this.panel.setAttribute("aria-hidden", "false");
  }

  private closePanel() {
    this.panel.classList.remove("open");
    this.panel.setAttribute("aria-hidden", "true");
    this.stage.galaxy.setSelected(null);
  }

  private setNorth(id: string) {
    const g = this.stage.galaxy;
    if (g.northStar === id) {
      this.clearNorth();
      this.openNode(id);
      return;
    }
    g.setNorthStar(id);
    g.highlightPath(id);
    const P = g.P!;
    const nd = P.nodes.find((n) => n.id === id)!;
    // recover path labels for the banner
    const path: string[] = [];
    let cur: string | undefined = id;
    while (cur !== undefined) {
      path.unshift(cur);
      cur = g.parent[cur];
    }
    const nextId = path[1];
    const nextNode = nextId ? P.nodes.find((n) => n.id === nextId) : null;
    const odds = Math.round((g.reachP[id] || 0) * 100);
    $("nsText").innerHTML =
      `North Star set: <b>${strip(nd.label)}</b> · most probable route is <span class="mono">${odds}%</span> reachable.` +
      (nextNode
        ? ` Your next move: <b>${strip(nextNode.label)}</b> — unlock it with <b>${nextNode.skill}</b>.`
        : "");
    this.nsbar.classList.add("show");
    this.openNode(id);
  }

  private clearNorth() {
    this.stage.galaxy.setNorthStar(null);
    this.stage.galaxy.highlightPath(null);
    this.nsbar.classList.remove("show");
  }
}
