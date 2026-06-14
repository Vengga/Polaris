import type { CareerData, Pillar } from "./types";

// ════════════════════════════════════════════════════════════════════
// POLARIS — seeded transition model (verbatim from the source prototype)
// Realistic APAC roles, RM salary bands, two-sided trajectory engine.
// "Point it at Talentbank's 15 years of placement data and it goes live."
// ════════════════════════════════════════════════════════════════════

export const COLORS = {
  void: "#0A0E1A",
  deep: "#060912",
  panel: "#0E1424",
  polaris: "#FFD66B", // high-probability move / North Star
  indigo: "#5B7CFA", // uncertain move
  violet: "#A78BFA", // employer accent
  teal: "#5EEAD4",
  ink: "#EAEEFB",
  muted: "#8B95B0",
  faint: "#5A6280",
} as const;

/** colour ramp endpoints used to encode reach-probability on every node */
export const COOL = COLORS.indigo; // low probability
// warm endpoint = the active accent (polaris / violet)

export const DATA: CareerData = {
  candidate: {
    accent: COLORS.polaris,
    personas: {
      aisha: {
        name: "Aisha",
        sub: "Fresh CS grad · Universiti Malaya",
        start: "sw",
        nodes: [
          { id: "sw", t: 0, label: "Software Engineer (Grad)", pay: "3.5k – 4.5k", skill: "Ship one real product end-to-end", desc: "Your launchpad. Most paths fan out from here within the first two years." },
          { id: "fe", t: 1, label: "Frontend Engineer", pay: "5k – 7k", skill: "Component architecture + design sense", desc: "High-demand, fast feedback. A common, reachable first specialisation." },
          { id: "be", t: 1, label: "Backend Engineer", pay: "5.5k – 7.5k", skill: "Distributed systems fundamentals", desc: "Opens the deepest infrastructure ladders later." },
          { id: "da", t: 1, label: "Data Analyst", pay: "4.5k – 6.5k", skill: "SQL + a clear analytics story", desc: "A side-door into the fastest-growing data track." },
          { id: "sfe", t: 2, label: "Senior Frontend", pay: "9k – 13k", skill: "Lead a feature team", desc: "Where frontend specialists consolidate seniority." },
          { id: "ds", t: 2, label: "Data Scientist", pay: "8k – 13k", skill: "ML in production, not notebooks", desc: "The high-leverage data destination." },
          { id: "plt", t: 2, label: "Platform / DevOps", pay: "10k – 15k", skill: "Own reliability + infra-as-code", desc: "Scarce, well-paid, sticky." },
          { id: "pm", t: 3, label: "Product Manager", pay: "10k – 16k", skill: "Translate users into roadmap", desc: "The cross-over into product leadership." },
          { id: "lead", t: 3, label: "Engineering Lead", pay: "14k – 22k", skill: "Grow people, not just code", desc: "The management fork — fewer take it, it compounds fast." },
        ],
        edges: [
          { f: "sw", t: "fe", p: 0.34, y: "1–2 yrs" }, { f: "sw", t: "be", p: 0.31, y: "1–2 yrs" }, { f: "sw", t: "da", p: 0.18, y: "< 1 yr" },
          { f: "fe", t: "sfe", p: 0.55, y: "2–3 yrs" }, { f: "fe", t: "pm", p: 0.16, y: "2–3 yrs" },
          { f: "be", t: "plt", p: 0.4, y: "2 yrs" }, { f: "be", t: "lead", p: 0.24, y: "3–4 yrs" },
          { f: "da", t: "ds", p: 0.45, y: "2–3 yrs" },
          { f: "sfe", t: "lead", p: 0.3, y: "3 yrs" }, { f: "plt", t: "lead", p: 0.22, y: "3 yrs" },
        ],
      },
      weijie: {
        name: "Wei Jie",
        sub: "Marketing exec · 3 yrs in",
        start: "me",
        nodes: [
          { id: "me", t: 0, label: "Marketing Executive", pay: "4k – 5.5k", skill: "Own a channel end-to-end", desc: "Three years in, the branches start to diverge sharply." },
          { id: "gm", t: 1, label: "Growth Marketer", pay: "6k – 9k", skill: "Run experiments on real funnels", desc: "The data-driven pivot — highest momentum." },
          { id: "bm", t: 1, label: "Brand Manager", pay: "6.5k – 9.5k", skill: "Own a P&L narrative", desc: "The classic upward path inside marketing." },
          { id: "cs", t: 1, label: "Content Strategist", pay: "5.5k – 8k", skill: "Systematise voice + SEO", desc: "Reachable, flexible, remote-friendly." },
          { id: "pmm", t: 2, label: "Product Marketing", pay: "9k – 14k", skill: "Sit between product + GTM", desc: "Where growth and brand converge — well paid." },
          { id: "hg", t: 2, label: "Head of Growth", pay: "13k – 20k", skill: "Own the whole acquisition engine", desc: "The leadership destination for growth marketers." },
          { id: "cmo", t: 3, label: "Marketing Director", pay: "18k – 30k", skill: "Lead a function, set strategy", desc: "The executive fork." },
        ],
        edges: [
          { f: "me", t: "gm", p: 0.3, y: "1–2 yrs" }, { f: "me", t: "bm", p: 0.28, y: "1–2 yrs" }, { f: "me", t: "cs", p: 0.22, y: "< 1 yr" },
          { f: "gm", t: "pmm", p: 0.42, y: "2 yrs" }, { f: "gm", t: "hg", p: 0.3, y: "2–3 yrs" },
          { f: "bm", t: "cmo", p: 0.26, y: "3–4 yrs" }, { f: "cs", t: "pmm", p: 0.25, y: "2 yrs" },
          { f: "pmm", t: "cmo", p: 0.3, y: "3 yrs" }, { f: "hg", t: "cmo", p: 0.28, y: "2–3 yrs" },
        ],
      },
      priya: {
        name: "Priya",
        sub: "Mech engineer · wants a pivot",
        start: "mech",
        nodes: [
          { id: "mech", t: 0, label: "Mechanical Engineer", pay: "4k – 6k", skill: "Name the transferable core: systems thinking", desc: "A pivot looks risky from inside. The galaxy shows the bridges." },
          { id: "pe", t: 1, label: "Product / Hardware", pay: "6k – 9k", skill: "Pair engineering with user empathy", desc: "The natural adjacent step — keep the domain, change the seat." },
          { id: "de", t: 1, label: "Data Engineer", pay: "7k – 11k", skill: "Code + pipelines (your maths transfers)", desc: "A real, common bridge out of traditional engineering." },
          { id: "ops", t: 1, label: "Operations Analyst", pay: "5.5k – 8k", skill: "Quantify a messy process", desc: "Lowest-friction pivot, opens management later." },
          { id: "tpm", t: 2, label: "Technical PM", pay: "10k – 16k", skill: "Bridge engineering + business", desc: "Where engineers who like people land." },
          { id: "ds2", t: 2, label: "Data Scientist", pay: "9k – 14k", skill: "Statistics into decisions", desc: "The high-ceiling data destination." },
          { id: "opm", t: 2, label: "Operations Manager", pay: "9k – 14k", skill: "Run teams + numbers", desc: "The management track from ops." },
          { id: "dir", t: 3, label: "Director of Engineering", pay: "18k – 30k", skill: "Lead at the org level", desc: "Long arc, but every branch can reach it." },
        ],
        edges: [
          { f: "mech", t: "pe", p: 0.33, y: "1–2 yrs" }, { f: "mech", t: "de", p: 0.2, y: "1–2 yrs" }, { f: "mech", t: "ops", p: 0.27, y: "< 1 yr" },
          { f: "pe", t: "tpm", p: 0.4, y: "2 yrs" }, { f: "de", t: "ds2", p: 0.44, y: "2 yrs" },
          { f: "ops", t: "opm", p: 0.38, y: "2–3 yrs" }, { f: "tpm", t: "dir", p: 0.26, y: "3–4 yrs" },
          { f: "opm", t: "dir", p: 0.22, y: "3–4 yrs" },
        ],
      },
    },
  },
  employer: {
    accent: COLORS.violet,
    personas: {
      sfe: {
        name: "Senior Frontend role",
        sub: "Find who’s trending toward it",
        start: "role",
        nodes: [
          { id: "role", t: 2, label: "★ Senior Frontend (open)", pay: "9k – 13k", skill: "—", desc: "Your open role. The galaxy clusters candidates by how closely their trajectory matches people who thrived here before." },
          { id: "c1", t: 1, label: "Frontend Engineer", pay: "fit: very high", skill: "Same arc as your last 3 great hires", desc: "Ship velocity + design sense + 2 yrs frontend. Trajectory shape ≈ your top performers." },
          { id: "c2", t: 1, label: "Product Engineer", pay: "fit: high", skill: "Cross-over momentum", desc: "Strong frontend with product instinct — a keyword filter would miss them." },
          { id: "c3", t: 1, label: "Fullstack Engineer", pay: "fit: high", skill: "Breadth, leaning frontend", desc: "Heading toward specialisation. Catch them now." },
          { id: "r1", t: 0, label: "Radar · CS grad", pay: "~2 yrs out", skill: "Likely to reach the role by 2027", desc: "Early-career, steep slope. Talent radar flags them before competitors do." },
          { id: "r2", t: 0, label: "Radar · Bootcamp grad", pay: "~2 yrs out", skill: "Fast climber, frontend-bound", desc: "Non-traditional path, strong trajectory. Worth a warm intro now." },
          { id: "r3", t: 0, label: "Radar · Self-taught", pay: "~18 mo out", skill: "High momentum portfolio", desc: "Building in public. Radar surfaces what a CV screen hides." },
        ],
        edges: [
          { f: "c1", t: "role", p: 0.92, y: "ready now" }, { f: "c2", t: "role", p: 0.84, y: "ready now" }, { f: "c3", t: "role", p: 0.79, y: "3–6 mo" },
          { f: "r1", t: "c1", p: 0.5, y: "~2 yrs" }, { f: "r2", t: "c2", p: 0.45, y: "~2 yrs" }, { f: "r3", t: "c1", p: 0.4, y: "~18 mo" },
        ],
      },
      ds: {
        name: "Data Scientist role",
        sub: "Find who’s trending toward it",
        start: "role",
        nodes: [
          { id: "role", t: 2, label: "★ Data Scientist (open)", pay: "8k – 13k", skill: "—", desc: "Your open role. Candidates clustered by trajectory similarity to your best data hires." },
          { id: "c1", t: 1, label: "Data Analyst", pay: "fit: very high", skill: "Analyst → DS arc, proven", desc: "The single most reliable feeder. Strong upward momentum." },
          { id: "c2", t: 1, label: "Data Engineer", pay: "fit: high", skill: "Pipelines + curiosity", desc: "Engineering depth, statistics-bound. Often overlooked by keyword screens." },
          { id: "c3", t: 1, label: "Research Grad", pay: "fit: high", skill: "Stats-heavy, needs prod exposure", desc: "High ceiling once production ML clicks." },
          { id: "r1", t: 0, label: "Radar · Maths grad", pay: "~2 yrs out", skill: "Steep slope toward DS", desc: "Talent radar flags strong fundamentals early." },
          { id: "r2", t: 0, label: "Radar · Analyst (jr)", pay: "~18 mo out", skill: "Climbing fast", desc: "Catch before the market does." },
          { id: "r3", t: 0, label: "Radar · Mech eng pivot", pay: "~2 yrs out", skill: "Transferable maths, high intent", desc: "A pivot a CV filter would never surface — trajectory reveals it." },
        ],
        edges: [
          { f: "c1", t: "role", p: 0.9, y: "ready now" }, { f: "c2", t: "role", p: 0.82, y: "2–4 mo" }, { f: "c3", t: "role", p: 0.76, y: "3–6 mo" },
          { f: "r1", t: "c1", p: 0.5, y: "~2 yrs" }, { f: "r2", t: "c1", p: 0.45, y: "~18 mo" }, { f: "r3", t: "c2", p: 0.4, y: "~2 yrs" },
        ],
      },
    },
  },
};

export const PILLARS: Pillar[] = [
  { n: "01", h: "Discovery", p: "The right match at the right time — roles and people found by trajectory, not keyword overlap." },
  { n: "02", h: "Growth", p: "The skill before you need it. Polaris surfaces the move that unlocks the most future paths." },
  { n: "03", h: "Progression", p: "The move informed, not guessed. Likely routes, real odds, the right moment to jump." },
  { n: "04", h: "Feedback", p: "The loop that builds trust — applications, interviews and outcomes, visible on both sides." },
];
