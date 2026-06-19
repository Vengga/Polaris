# Polaris — Career Navigation OS

> Know what's next. Polaris turns career movement into a navigable map — showing the moves you could realistically make from where you stand today, each with the odds, the timing, and the salary attached.

**🔭 Live demo:** https://vengga.github.io/Polaris/
*Best viewed on a desktop in Chrome or Edge — the visualization uses WebGL.*

---

## Contents

- [Overview](#overview)
- [Why it exists](#why-it-exists)
- [Features](#features)
- [How the engine works](#how-the-engine-works)
- [The data model](#the-data-model)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Using the app](#using-the-app)
- [Status & scope](#status--scope)
- [Roadmap](#roadmap)

---

## Overview

Most career tools match job titles by keyword: you type a role, you get a list. Polaris takes a different approach. It models the labour market as a **directed graph of roles connected by real transitions**, then lets a person navigate it like a map — seeing not just *where they could go*, but *how likely each move is, how long it typically takes, and what it pays*.

The same underlying graph serves two audiences from opposite directions:

- **Candidates** look forward — *where can I go from here, and what is my single best next move?*
- **Employers** look inward — *whose career trajectory is already pointing toward the role I need to fill?*

One engine, two queries. That is what makes Polaris an operating system for careers rather than a single feature.

## Why it exists

For most people, career decisions are made with almost no signal — on rumour, on whoever they happened to work next to, on guesswork. Yet the information needed to make those decisions well already exists: it is locked inside the career histories of the millions of people who came before. Polaris is an attempt to turn that latent signal into something a person can actually see and act on.

## Features

**Candidate view — Career Path Navigator**

- Realistic next moves from any starting role, ranked by probability rather than keyword overlap.
- A *North Star* mode: pick a goal role and the most-probable route to it lights up across the map.
- For any goal, the single highest-impact next move is surfaced, along with the skill that unlocks it.
- Honest salary ranges (RM/month) on every role, so decisions are grounded in market reality.

**Employer view — Smart Talent Matching**

- Candidates ranked by how closely their trajectory points toward an open role — matching on direction and momentum, not buzzwords.
- A talent radar of early-career profiles likely to grow into a role within roughly two years, surfaced before a conventional CV filter would catch them.

**Experience**

- An interactive 3D galaxy where each role is a star and each transition a light-trail; node colour and size encode the computed probability.
- A scroll-choreographed narrative intro that walks a first-time visitor from the problem to the working map.

## How the engine works

Polaris represents careers as a **directed acyclic graph (DAG)**:

- **Nodes** are roles. Each carries a tier (career stage), a salary band, and a *gating skill* — the capability that most unlocks movement out of it.
- **Edges** are transitions between roles. Each carries a conditional probability (how often people in the source role move to the target) and a typical duration.

From a chosen **start node**, the engine runs a **max-product traversal** over the graph: relaxing edges in tier order, it maximises the product of edge probabilities along all paths to each node and stores a back-pointer to the best predecessor. This produces two things at once — a **reach-probability score** for every role, and the **most-probable path** to reach it. The approach is analogous to a Viterbi pass over a transition graph.

**North Star pathfinding.** When a user designates a goal role, the engine backtracks the stored path and returns the goal's overall reachability, the immediate next transition on the most-probable route, and the gating skill on that next node — i.e. the move that most increases the probability of reaching the goal, with the odds attached.

**Employer inversion.** The same graph is queried in reverse. For a target role, candidate profiles are scored by their outgoing transition probability toward it (a trajectory-match score), and earlier-tier nodes form the talent radar of profiles likely to reach a feeder role soon.

**Visualization as readout.** The 3D map is a direct rendering of the model: a node's colour (interpolated indigo to gold) and its size both encode its computed reach probability, so what the user sees *is* the engine's output, not decoration layered on top.

## The data model

The prototype runs on a **seeded transition model** — realistic role sequences and RM salary bands, hand-specified to demonstrate the engine end to end. Crucially, the engine and the data are **decoupled**: the graph definition (roles, edges, probabilities, salary bands) is an input layer, not hard-coded into the logic. Swapping the seed for a real placement dataset produces empirically grounded probabilities with no change to the engine or the interface. The engine is the deliverable; real placement history is what makes its numbers accurate.

## Tech stack

| Area | Tools |
|------|-------|
| Language | TypeScript |
| 3D / graphics | Three.js, WebGL, GLSL |
| Animation / scroll | GSAP (ScrollTrigger), Lenis |
| Build / tooling | Vite, npm |
| Deployment | GitHub Pages (static build, via GitHub Actions) |
| Core techniques | Directed acyclic graph, max-product / Viterbi-style pathfinding, data-driven visualization |

## Getting started

**Prerequisites:** Node.js (LTS) and npm.

```bash
# clone
git clone https://github.com/Vengga/Polaris.git
cd Polaris

# install dependencies
npm install

# run the dev server (hot reload)
npm run dev

# produce a static production build in /dist
npm run build

# preview the production build locally
npm run preview
```

Deployment is automated: the workflow in `.github/workflows` builds the project and publishes it to GitHub Pages on push to `main`.

## Project structure

```
.github/workflows/   CI workflow that builds and deploys to GitHub Pages
scripts/             build / deploy helper scripts
src/                 application source — 3D scene, scroll timelines, data model, UI
index.html           Vite entry point
vite.config.ts       Vite build configuration
tsconfig.json        TypeScript configuration
package.json         dependencies and npm scripts
```

## Using the app

1. **Scroll** through the intro to see the concept assemble, then enter the interactive map.
2. **Toggle** between *For Candidates* and *For Employers* at the top — the dataset and accent colour change with the audience.
3. **Pick a profile** (candidate) or **an open role** (employer) to load that graph.
4. **Drag** to orbit the map and **scroll** to zoom.
5. **Click any node** to open its detail panel — reach odds, typical time, salary band, and gating skill.
6. **Set a North Star** from the panel to compute and highlight the most-probable route to that role.

All figures shown are from the seeded demonstration model.

## Status & scope

This is a Stage-1 prototype: no backend, no authentication, no persistent datastore — the seeded model is intentional, and the architecture is deliberately built so the engine can later sit behind an API against real data. The candidate explorer and the employer view both run on the shared engine.

## Roadmap

- Replace the seeded graph with a real placement dataset to produce empirical probabilities.
- Complete the two-sided feedback loop (applications to interviews to outcomes).
- Move the transition engine behind an API against a persistent datastore.
- Expand to a third audience (universities) using the same engine.

---

*Built as a self-directed project. Originally prototyped for the Talentbank Tech Hackathon 2026 (First Cohort).*
