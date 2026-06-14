import type { Mode, Persona } from "./types";

// ── The trajectory engine ────────────────────────────────────────────
// Pure functions: given a persona, lay nodes out in 3D, compute the
// reach-probability of every node, and recover the most-probable route.

const TIER_GAP = 8; // horizontal spacing between tiers
const ROW_GAP = 4.4; // vertical spacing within a tier

/** Position every node deterministically by tier (column) + index (row). */
export function layout(nodes: Persona["nodes"]): void {
  const byT: Record<number, Persona["nodes"]> = {};
  nodes.forEach((n) => {
    (byT[n.t] = byT[n.t] || []).push(n);
  });
  const tiers = Object.keys(byT).map(Number).sort((a, b) => a - b);
  tiers.forEach((t) => {
    const arr = byT[t];
    const n = arr.length;
    arr.forEach((nd, i) => {
      nd.x = (t - (tiers.length - 1) / 2) * TIER_GAP;
      nd.y = (i - (n - 1) / 2) * ROW_GAP + (t % 2 ? 0.6 : -0.6);
      nd.z = (i % 2 ? 1 : -1) * (1.4 + t * 0.7);
    });
  });
}

export interface ReachResult {
  /** node id → best reach probability 0..1 */
  reachP: Record<string, number>;
  /** node id → predecessor on the most-probable path */
  parent: Record<string, string>;
}

/**
 * Candidate mode: probability you reach each node from the start, taking the
 * single most-probable route (a longest-path / max-product over the DAG).
 * Employer mode: each candidate's "match strength" = strongest link toward
 * the open role (read the same engine from the other end).
 */
export function computeReach(P: Persona, mode: Mode): ReachResult {
  const reachP: Record<string, number> = {};
  const parent: Record<string, string> = {};

  if (mode === "candidate") {
    reachP[P.start] = 1;
    P.nodes.forEach((nd) => {
      if (!(nd.id in reachP)) reachP[nd.id] = 0;
    });
    // relax edges in tier order so predecessors settle before successors
    const edges = [...P.edges].sort((a, b) => {
      const ta = P.nodes.find((n) => n.id === a.f)!.t;
      const tb = P.nodes.find((n) => n.id === b.f)!.t;
      return ta - tb;
    });
    edges.forEach((e) => {
      const cand = (reachP[e.f] || 0) * e.p;
      if (cand > (reachP[e.t] || 0)) {
        reachP[e.t] = cand;
        parent[e.t] = e.f;
      }
    });
  } else {
    P.nodes.forEach((nd) => {
      if (nd.id === P.start) {
        reachP[nd.id] = 1;
        return;
      }
      const outs = P.edges.filter((e) => e.f === nd.id);
      reachP[nd.id] = outs.length ? Math.max(...outs.map((e) => e.p)) : 0;
    });
  }
  return { reachP, parent };
}

/** Recover the most-probable route to a goal node, start → goal. */
export function pathTo(goalId: string, parent: Record<string, string>): string[] {
  const path: string[] = [];
  let cur: string | undefined = goalId;
  while (cur !== undefined) {
    path.unshift(cur);
    cur = parent[cur];
  }
  return path;
}
