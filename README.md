# Polaris — Career OS

A scroll-choreographed 3D **career galaxy** you fly through. Every star is a real
role; every light-trail is a transition people from your starting point have actually
made — weighted by how often, how fast, and for how much. **Colour encodes
probability** (cool indigo = uncertain → warm gold = your North Star). Built for the
Talentbank First Cohort as a Stage-1 prototype.

> The engine is the product. It runs on a **seeded transition model** with realistic
> APAC roles and RM salary bands — point it at Talentbank's 15 years of placement data
> and the odds become live.

## Experience

- **The story (scroll):** one continuous cinematic journey — the headline resolves out
  of dispersed particles, the problem collapses to a lone node, the galaxy blooms, the
  camera flies the most-probable gold route, the galaxy re-reads from the employer side,
  the four loops, then a drift back into open space.
- **The galaxy (explore):** click **✦ Explore the galaxy** (or `#explore`) to take the
  controls — drag to orbit, scroll to zoom, click a star to read its odds / timing / pay
  band / unlocking skill, and **Set as North Star** to light the most probable route and
  send travellers along it. Toggle **candidate ⇄ employer** to swap the dataset and accent.

## Tech

Vite · TypeScript · three.js (EffectComposer + UnrealBloom) · GSAP + ScrollTrigger ·
Lenis (smooth scroll) · custom GLSL (starfield twinkle, node glow, hero dispersion).
Plain CSS for the glassmorphic UI — no UI framework.

## Run it

```bash
npm install      # install dependencies
npm run dev      # local dev server (HMR) → http://localhost:5173
npm run build    # type-check + static production build → dist/
npm run preview  # preview the production build locally
```

## Deploy (static — `dist/`)

The build is fully static and uses relative asset paths (`base: "./"`), so it drops onto
any host:

- **Netlify** — drag the `dist/` folder onto the Netlify drop zone, or set build command
  `npm run build` and publish directory `dist`.
- **Vercel** — import the repo; framework preset **Vite**, output dir `dist`. Or
  `vercel deploy --prod` after `npm run build`.
- **GitHub Pages** — push `dist/` to a `gh-pages` branch (e.g. `npx gh-pages -d dist`).
  Relative paths mean it works under a project sub-path with no extra config.

## Performance & resilience

- Pixel ratio capped at 2 (1.5 on phones); one render loop; shared geometry; halos and
  travellers each draw in a single `Points` call.
- **Low-power path:** under `prefers-reduced-motion`, weak `deviceMemory`, or low core
  counts, bloom + particle dispersion + scrubbed camera are disabled and the galaxy is
  parked in a static, still-beautiful framing.
- **Never blank, never crashes:** WebGL init is wrapped in `try/catch` with a graceful
  2D star-field fallback that still renders the full story copy.

## Project layout

```
src/
  data/        career-model.ts (seeded data), engine.ts (reach/layout/path), types.ts
  scene/       Stage.ts (renderer + loop), Galaxy.ts, Starfield.ts, Dispersion.ts,
               post.ts (bloom), shaders/ (starfield · glow · dispersion GLSL)
  scroll/      timeline.ts — the GSAP/ScrollTrigger 7-beat choreography (commented)
  ui/          controller.ts — chips, detail panel, North Star, candidate/employer toggle
  core/        capabilities.ts — WebGL / low-power / reduced-motion detection
  main.ts      entry — wiring, labels, explore mode, fallback
```

`scripts/shoot.mjs` is a dev-only CDP screenshot helper (not part of the build).

## Scope (honest framing)

Prototype: no auth, no API, no database. The seeded model is intentional and is framed as
such in the copy. The point is the **navigation and the trajectory engine**, ready to be
pointed at real data.
