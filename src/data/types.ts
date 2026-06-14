// ── Career-model types ───────────────────────────────────────────────
// The seeded transition model is the product. Nodes carry role meta;
// edges carry the odds (probability) + typical timing of a move.

export type Mode = "candidate" | "employer";

export interface CareerNode {
  id: string;
  /** tier / column — distance from the starting point */
  t: number;
  label: string;
  /** pay band (candidate) or trajectory-fit string (employer) */
  pay: string;
  /** the single skill that unlocks this node */
  skill: string;
  desc: string;
  // ── layout, filled at runtime by layout() ──
  x?: number;
  y?: number;
  z?: number;
}

export interface CareerEdge {
  /** from node id */
  f: string;
  /** to node id */
  t: string;
  /** probability of the move, 0..1 — THIS is what colour encodes */
  p: number;
  /** typical timing, human-readable */
  y: string;
}

export interface Persona {
  name: string;
  sub: string;
  /** id of the starting node */
  start: string;
  nodes: CareerNode[];
  edges: CareerEdge[];
}

export interface ModeData {
  accent: string;
  personas: Record<string, Persona>;
}

export type CareerData = Record<Mode, ModeData>;

export interface Pillar {
  n: string;
  h: string;
  p: string;
}
