# 🌌 Cosmic Knowledge Explorer — Build Spec

**Type:** Architecture doc + phased implementation plan for an agentic coding session
**Audience:** Claude Code (primary), Santosh (owner/reviewer)
**Status:** Proposed

## 0. How to use this file

Drop this file at the project root as `CLAUDE.md` (or keep it as `COSMIC-EXPLORER-SPEC.md` and add one line to your `CLAUDE.md` pointing at it). Claude Code will then load it automatically at the start of every session in this repo.

This is a big, cinematic build. Do **not** try to one-shot it. Work through Section 14 phase by phase — each phase has a Definition of Done. Commit after each phase passes its DoD before moving to the next. If you (Claude Code) are asked to "start Phase N," re-read Sections 6–13 for the pieces that phase touches before writing code.

---

## 1. Context & Goals

A personal portfolio/learning site that replaces the traditional homepage with a navigable galaxy. Four "planets" — AI, Web Development, DSA, and Cybersecurity — each represent a subject Santosh is building depth in. The site's job is to make exploring those subjects feel like an event, not a scroll.

**Primary goal:** a small number of genuinely polished, performant experiences (one galaxy shell + one planet, executed extremely well) beats four half-finished worlds. Depth over breadth — this shapes the phase order in Section 14.

**Secondary goal:** the codebase should be a legitimate demonstration of frontend engineering skill (state architecture, performance discipline, accessibility), not just a visual demo — this is portfolio work.

---

## 2. Requirements

### 2.1 Functional requirements

- **Galaxy view:** animated starfield, central sun, 4 orbiting planets with independent orbit speed/radius/inclination.
- **Ambient interactivity:** planets respond to hover (glow pulse, slight rotation speed-up, orbiting satellites speed up), cursor-driven parallax shifts the camera subtly, tooltips introduce each planet on hover.
- **Cinematic navigation:** clicking a planet triggers a camera fly-through into that planet's world; a return action flies back out to the galaxy.
- **Planet worlds:** each is a distinct environment (own palette, lighting, particles, layout) presenting subject content — concept cards, roadmaps/timelines, code snippets, visualizations, per the per-planet specs in Section 8.
- **Discovery mechanics:** quiz satellites, fact asteroid belts, achievement comets, and space-station navigation hubs, scattered through both the galaxy and individual worlds (Section 9).
- **Progress persistence:** quiz results and unlocked achievements persist across sessions (local, no backend in v1).
- **Audio (optional, off by default):** ambient loop per world + light SFX on interaction, behind an explicit unmute control.

### 2.2 Non-functional requirements

- Target **60fps** on a mid-range 2022+ laptop GPU; **degrade gracefully** (not crash) on integrated graphics and mid-range mobile.
- Time to first meaningful paint (galaxy visible, even before full star count loads) under ~2.5s on a decent connection.
- Fully usable — all content reachable — with JavaScript-driven motion disabled (`prefers-reduced-motion`) and on devices without WebGL2.
- Keyboard-navigable: every planet, discovery, and world must be reachable without a mouse.
- No backend required for v1; static hosting (Vercel) is the deployment target.

### 2.3 Explicit non-goals (v1)

- No user accounts, no multiplayer/shared state, no CMS — content is authored in code/data files.
- No mobile-native app.
- No real-time collaboration or leaderboards.
- Don't attempt all 4 planets at full fidelity before one is proven end-to-end (see Section 14).

---

## 3. Tech Stack & Versions

| Layer | Choice | Notes |
|---|---|---|
| Framework | React 19 + Vite | `npm create vite@latest -- --template react-ts` |
| 3D rendering | Three.js via **@react-three/fiber v9** | v9 pairs with React 19 — do not mix with fiber v8 |
| 3D helpers | **@react-three/drei v10** | camera controls, `<Points>`, `<Html>`, `<AdaptiveDpr>`, `<PerformanceMonitor>`, `<Preload>` |
| Camera choreography | **GSAP** (core + `ScrollTrigger`, all bonus plugins) | GSAP is 100% free as of the Webflow acquisition — install straight from the public `gsap` npm package, no license tokens needed |
| UI transitions / micro-interactions | **Framer Motion** | DOM layer only — GSAP owns the 3D camera, Framer Motion owns HTML panels |
| Styling | **Tailwind CSS v4** | CSS-first config via `@tailwindcss/vite`, no `tailwind.config.js` needed — tokens live in `@theme` |
| State | **Zustand** (+ `persist` middleware) | nav state, hover state, discovery/quiz progress |
| Smooth scroll (optional) | **Lenis** (`npm install lenis`, formerly `@studio-freight/lenis`) | only if any world uses scroll-driven sections |
| Illustrations (optional) | **Lottie** (`lottie-react`) | for lightweight 2D flourishes inside panels, not for the 3D scene |
| Language | TypeScript throughout | data schemas in Section 6.5 are TS interfaces |

---

## 4. Setup Commands

```bash
npm create vite@latest cosmic-knowledge-explorer -- --template react-ts
cd cosmic-knowledge-explorer

# 3D + animation + state
npm install three @react-three/fiber @react-three/drei gsap framer-motion zustand

# styling (Tailwind v4 — Vite-native plugin, no init/config step)
npm install tailwindcss @tailwindcss/vite

# optional
npm install lenis lottie-react

npm install -D @types/three
```

`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

`src/styles/tokens.css` (imported once in `main.tsx`) — this is where Section 7's design tokens live, using Tailwind v4's `@theme` directive:
```css
@import "tailwindcss";

@theme {
  --color-void: #05070c;
  --color-starlight: #f5f3ee;
  --color-sun-core: #ffd37e;
  --color-sun-edge: #ff7a45;
  --font-display: "Orbitron", sans-serif;
  --font-body: "Space Grotesk", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  /* per-planet tokens appended here as --color-ai-base, --color-ai-glow, etc. — see Section 7.2 */
}
```

---

## 5. High-Level Architecture

### 5.1 Runtime diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                            <App />                                 │
│  ┌────────────────────────┐      ┌─────────────────────────────┐  │
│  │   R3F <Canvas>          │      │   DOM UI Layer                │  │
│  │   mounted once,         │      │   (Framer Motion)             │  │
│  │   never remounts        │      │                               │  │
│  │                         │      │  - Tooltips                   │  │
│  │  <GalaxyScene>          │      │  - Glassmorphism panels        │  │
│  │    <Starfield/>         │      │  - Wayfinder Ring (HUD)        │  │
│  │    <Sun/>                │     │  - Planet-world content        │  │
│  │    <Planet× 4/>         │◄─────┼──► reads/writes                │  │
│  │  <PlanetWorld/> (lazy)  │      │                               │  │
│  │  <CameraRig/> ◄─────────┼──────┤  GSAP timeline drives          │  │
│  │                         │      │  camera position + fov         │  │
│  └────────────┬────────────┘      └──────────────┬────────────────┘  │
│               │                                    │                  │
│               └───────────► Zustand store ◄────────┘                  │
│                    (navMode, hoveredPlanet, activePlanet,             │
│                     discoveries, quizProgress, reducedMotion)         │
└──────────────────────────────────────────────────────────────────────┘
```

Key rule: **the `<Canvas>` mounts exactly once**, at the `App` root. Planet worlds are groups toggled by state inside the same canvas, not separate routed pages — this is what makes the "fly through space" transition possible instead of a jarring page reload. See ADR-3.

### 5.2 Folder structure

```
cosmic-knowledge-explorer/
├── public/
│   ├── audio/                      # ambient loops + SFX, one subfolder per world
│   └── fonts/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── styles/
│   │   ├── tokens.css              # @theme design tokens
│   │   └── globals.css
│   ├── store/
│   │   └── useGalaxyStore.ts       # Zustand: nav, discoveries, progress
│   ├── data/
│   │   ├── planets.ts              # PlanetMeta[] — id, palette, orbit params
│   │   ├── ai-planet.content.ts
│   │   ├── webdev-planet.content.ts
│   │   ├── dsa-planet.content.ts
│   │   └── cybersecurity-planet.content.ts
│   ├── scene/
│   │   ├── GalaxyCanvas.tsx        # the single persistent <Canvas>
│   │   ├── GalaxyScene.tsx
│   │   ├── Starfield.tsx           # instanced Points, not individual meshes
│   │   ├── Sun.tsx
│   │   ├── Planet.tsx              # generic, palette-driven, reused ×4
│   │   ├── OrbitRing.tsx
│   │   ├── Satellite.tsx
│   │   ├── NebulaClouds.tsx
│   │   ├── MeteorShower.tsx
│   │   ├── CameraRig.tsx           # GSAP-driven camera state machine
│   │   └── planets/
│   │       ├── AIWorld.tsx
│   │       ├── WebDevWorld.tsx
│   │       ├── DSAWorld.tsx
│   │       └── CybersecurityWorld.tsx
│   ├── ui/
│   │   ├── WayfinderRing.tsx       # signature HUD element (Section 7.1)
│   │   ├── GlassPanel.tsx
│   │   ├── Tooltip.tsx
│   │   ├── PlanetHUD.tsx           # per-world frame, reads world tokens
│   │   ├── QuizSatellite.tsx
│   │   ├── FactAsteroid.tsx
│   │   ├── AchievementComet.tsx
│   │   ├── SpaceStationHub.tsx
│   │   └── SkyMapFallback.tsx      # non-3D fallback, Section 11
│   ├── hooks/
│   │   ├── useParallax.ts
│   │   ├── useReducedMotion.ts
│   │   └── useAudioLayer.ts
│   └── lib/
│       ├── gsapCamera.ts
│       └── perf.ts
├── tailwind.config.ts              # not needed in v4 — omit unless doing advanced overrides
└── vite.config.ts
```

### 5.3 Camera & scene choreography (the hard part)

This is the highest-risk technical piece — get the pattern right once, reuse it everywhere.

- `CameraRig.tsx` owns a `navMode` state machine: `idle-galaxy | transitioning | world-focused`.
- On planet click: read the target planet's world-space position, build a **GSAP timeline** that tweens a plain JS object (`{ x, y, z, fov }`), and inside `useFrame`, lerp the actual `camera.position`/`camera.fov` toward that object every frame. Do **not** put the tween target in React state — that would re-render on every tick. GSAP mutates a ref-held object; R3F reads it in `useFrame`.
- Disable any `OrbitControls`/`CameraControls` for the duration of `transitioning` — re-enable (or swap to a world-specific control scheme) once `world-focused`.
- The "fly back out" is the mirror timeline, not a hard cut, unless `prefers-reduced-motion` is set (Section 11), in which case cut instantly with an opacity crossfade instead.
- Each planet world is a lazy-loaded group (`React.lazy` + `Suspense`) mounted only when its planet is the `activePlanet` — this keeps four worlds' worth of geometry/textures out of the initial bundle (Section 10).

### 5.4 State management

Zustand store, single source of truth for navigation + progress:

```ts
interface GalaxyStore {
  navMode: 'idle-galaxy' | 'transitioning' | 'world-focused'
  hoveredPlanetId: PlanetId | null
  activePlanetId: PlanetId | null
  reducedMotion: boolean

  discoveries: Record<string, boolean>       // fact/achievement id -> unlocked
  quizProgress: Record<string, QuizAttempt>  // quiz id -> last attempt

  enterPlanet: (id: PlanetId) => void
  exitToGalaxy: () => void
  unlockDiscovery: (id: string) => void
  recordQuizAttempt: (id: string, attempt: QuizAttempt) => void
}
```

Persist only `discoveries` and `quizProgress` to `localStorage` via Zustand's `persist` middleware — navigation/camera state should never survive a reload (a refreshed page should always land back in the galaxy).

### 5.5 Content data model

```ts
type PlanetId = 'ai' | 'webdev' | 'dsa' | 'cybersecurity'

interface PlanetMeta {
  id: PlanetId
  name: string
  tagline: string
  colors: { base: string; glow: string; accent: string; highlight: string }
  orbit: { radiusAU: number; periodSeconds: number; inclinationDeg: number }
}

interface ConceptCard {
  id: string
  title: string
  summary: string          // 1–2 sentences, plain language
  icon?: string
}

interface QuizItem {
  id: string
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}
interface QuizAttempt { selectedIndex: number; correct: boolean; attemptedAt: string }

interface FactAsteroid { id: string; fact: string }

interface Achievement {
  id: string
  title: string
  description: string
  unlockCondition: string   // human-readable; evaluated in store logic, e.g. "complete 3 quizzes on this planet"
}

interface PlanetContent {
  meta: PlanetMeta
  concepts: ConceptCard[]
  quizzes: QuizItem[]
  facts: FactAsteroid[]
  achievements: Achievement[]
}
```

All four `*.content.ts` files export a `PlanetContent` object. **Placeholder content is fine for early phases** — real roadmap/quiz copy is Santosh's job to fill in once the template is proven (Section 15).

---

## 6. Planets — one-line functional spec

| Planet | Emoji | Unique interactive element required |
|---|---|---|
| AI | 🔵 | Neural-network node/edge animation that "fires" on interaction; interactive AI timeline |
| Web Development | 🟢 | Animated stack diagram + live-feeling code snippet blocks; project showcase cards |
| DSA | 🔴 | At least one real algorithm visualization (e.g. sorting bars or graph traversal) with adjustable speed |
| Cybersecurity | 🟣 | A mock security dashboard readout (rotating radar/scan motif) + one encryption concept made visual |

Full palette/surface/particle spec for each is in Section 7.2.

---

## 7. Design System

Design direction per `frontend-design` conventions: pin the palette down per-world rather than reusing one generic "dark + neon accent" theme for all four planets — each world should be identifiable from a single screenshot with no label.

### 7.1 Galaxy shell (shared shell + signature element)

| Token | Value | Role |
|---|---|---|
| `--color-void` | `#05070C` | background — a deep space **charcoal-blue**, not flat black |
| `--color-starlight` | `#F5F3EE` | star particles, primary text — warm off-white, not pure white |
| `--color-sun-core` → `--color-sun-edge` | `#FFD37E` → `#FF7A45` | central star gradient |
| Nebula wash | each planet's `glow` color at ~6% opacity, drifting | foreshadows a planet's identity before the user reaches it |

**Typography** — three faces, each with one job, none overused:
- **Orbitron** (display) — planet names and major HUD labels only, all-caps, wide tracking. Used sparingly; this is a HUD accent face, not a body face.
- **Space Grotesk** (body/UI) — nav, descriptions, buttons, tooltip copy.
- **JetBrains Mono** (data) — stats, coordinates, timestamps, code snippets, complexity notation (`O(n log n)`).

**Signature element — "The Wayfinder Ring":** a thin animated HUD reticle that follows the cursor across the galaxy, reading out the nearest planet's name and a fabricated "distance" in a monospace readout. It's simultaneously the parallax indicator and the HUD motif the brief asks for. On entering a planet, it doesn't disappear — it morphs (via Framer Motion `layoutId`) into that world's HUD frame border, so the whole navigation system reads as one continuous instrument rather than four unrelated UIs. This is the one thing this build should be remembered for — keep everything else quiet around it.

### 7.2 Per-planet tokens

| Planet | base | glow | accent | highlight | Surface concept | Particle signature |
|---|---|---|---|---|---|---|
| 🔵 AI | `#0B1B33` | `#2F6FED` | `#7FE7E0` | `#FFB37A` | Lattice of glowing nodes/edges over the sphere | Signal pulses traveling along the lattice; warm amber flash on "activation" |
| 🟢 Web Dev | `#07231C` | `#34D399` | `#C6F135` | `#FF8B5E` | Circuit-board / motherboard surface texture | Scrolling light-trails like code compiling; orbiting satellites labeled with stack icons |
| 🔴 DSA | `#2A0A0A` | `#FF5A4E` | `#FFD166` | `#6B8CAE` | Crystalline/geode facets; algorithm state rendered as literal terrain | Lit pathways across the surface tracing a live traversal |
| 🟣 Cybersecurity | `#14071F` | `#9D4EDD` | `#00F0FF` | `#FF3864` | Faceted geodesic "firewall shell" overlay | Radar-style sweep; data-packet particles ricocheting off shield facets |

Each row is deliberately not a simple hue rotation of the others — surface concept and particle signature differ structurally, not just in color.

---

## 8. Planet Worlds — Content Deep Dive

Build these in the order given in Section 14, not top-to-bottom here.

### 8.1 AI Planet 🔵
- Neural-network animation: nodes pulse and "fire" along edges on hover/click, using the amber `highlight` token for the fire moment.
- ML roadmap rendered as a HUD-style timeline (mono font for stage labels).
- Floating `ConceptCard`s (glassmorphism panels) for core ideas — keep copy to 1–2 plain-language sentences each, no jargon dump.
- Discovery: a quiz satellite testing a roadmap stage just covered.

### 8.2 Web Development Planet 🟢
- Animated stack diagram (e.g. layered rings: frontend → API → data), each layer labeled in mono font.
- Project showcase cards pulling from Santosh's real repos (e.g. AAA, Product Intelligence System) — treat this as the "portfolio" moment of the whole site.
- A code snippet block styled like an actual editor pane (mono font, faint syntax highlight via Tailwind), not a screenshot.
- Discovery: fact asteroid belt with quick stack trivia.

### 8.3 DSA Planet 🔴
- One real, adjustable-speed algorithm visualization — sorting bars or a graph traversal are both good candidates; pick one for the reference build, add the other in a later pass.
- Complexity comparison panel (`O(1)` → `O(n²)`) rendered as a mono-font HUD table, not a static image.
- Coding-challenge card linking out (or a lightweight in-page challenge) — keep scope small for v1.
- Discovery: a comet revealing an "algorithm mastered" achievement after a visualization is run to completion.

### 8.4 Cybersecurity Planet 🟣
- Mock security dashboard: a few live-feeling readouts (fake but plausible — "threats blocked," "packets scanned") ticking upward, radar-sweep motif using the `accent` cyan.
- Network visualization: nodes with connection lines, one node shown mid-"intrusion" using the `highlight` red.
- One encryption concept made visual — e.g. plaintext scrambling into ciphertext on hover, reversible on a second hover.
- Discovery: a space-station hub framed as a "security briefing room" that also serves as the cross-planet nav hub (see 9.4).

### 8.5 Shared template (build once, reuse ×4)

Every planet world composes the same shell so Phase 4 (Section 14) is a content swap, not a rebuild:

```
<PlanetWorld palette={planetMeta.colors}>
  <PlanetHUD />                 <!-- frame morphed from Wayfinder Ring -->
  <ConceptCardField cards={content.concepts} />
  <SignatureVisualization />    <!-- the one thing unique per planet, Section 8.1–8.4 -->
  <DiscoveryLayer facts={..} quizzes={..} achievements={..} />
  <ExitToGalaxyButton />
</PlanetWorld>
```

---

## 9. Discovery Mechanics

| Element | Where it lives | Behavior |
|---|---|---|
| **Quiz satellites** | Orbiting a planet (world view) or a specific concept card | Click opens a glass panel with a `QuizItem`; answer recorded via `recordQuizAttempt`; correct answers can unlock an `Achievement` |
| **Fact asteroid belts** | Ring around a planet, galaxy or world view | Hover reveals a short fact tooltip; visiting one marks it in `discoveries` (no quiz gate) |
| **Achievement comets** | Streak across the galaxy periodically, or appear in-world on unlock | Clicking an unlocked comet opens an achievement toast/panel; comets for locked achievements are visible but inert |
| **Space stations** | Fixed points in the galaxy, one doubling as the Cybersecurity hub (8.4) | Act as navigation hubs — a station shows a mini-map of all 4 planets + progress summary, useful as a keyboard-accessible alternative to clicking planets directly (Section 11) |

Keep the reward loop honest: unlocking should require an actual action (answered a quiz, visited a fact, viewed a visualization to completion) — no achievements for merely loading the page.

---

## 10. Performance & Scale Strategy

- **Starfield:** render as a single `THREE.Points`/drei `<Points>` + `<PointMaterial>` draw call for thousands of stars — never one mesh per star.
- **Repeated small objects** (asteroid belt chunks, satellites): `InstancedMesh`, not individual meshes.
- **Code-split per planet:** `React.lazy` each `*World.tsx` — a planet's geometry/textures/audio should not be in the initial bundle.
- **Prefer procedural materials/shaders over textures** for planet surfaces where possible; if textures are used, keep them compressed and small — this is a portfolio site, not a game, and shouldn't ship megabytes of imagery.
- **Adaptive quality:** wrap the scene in drei's `<PerformanceMonitor>`/`<AdaptiveDpr>` to drop pixel ratio and particle counts automatically under sustained low FPS. Cap `devicePixelRatio` at 2 regardless.
- **Keep React state out of the render loop:** `useFrame` should mutate refs/materials directly; don't call `setState` every frame (this is the single most common R3F perf bug).
- **Audio:** lazy-load per-world ambient tracks only when that world mounts; never autoplay (browser policy + good manners).

---

## 11. Accessibility & Fallbacks

- Respect `prefers-reduced-motion`: replace cinematic camera flythroughs with an instant cut + fade; freeze ambient particle drift to a low-motion or static state.
- **Non-3D fallback is mandatory, not a nice-to-have.** On devices without WebGL2, or below a capability/viewport threshold, render `SkyMapFallback.tsx` — a static CSS/SVG grid of the four planets, fully keyboard/screen-reader navigable, with the same content reachable through ordinary links/panels. The site must be fully usable with zero WebGL.
- Keyboard path: every planet must be reachable via Tab/Enter even though the primary interaction is a 3D click target — use invisible focusable buttons overlaid on planet positions, and let the Space Station hub (9) double as a text-based nav menu.
- Glass panels need a scrim/backdrop-blur strong enough to keep text at an acceptable contrast ratio against glowing backgrounds — check this per planet palette, not just once globally.
- Audio is decorative only — never required for comprehension; provide an explicit, persistent mute/unmute control.
- Discovery-unlock toasts should use an ARIA live region so screen-reader users get the same "you found something" moment.

---

## 12. Architecture Decisions

### ADR-1: React Three Fiber + Drei vs. vanilla Three.js
**Status:** Accepted
**Context:** Need declarative scene composition that integrates cleanly with React state (Zustand) and component-based content (4 distinct worlds).
**Decision:** Use R3F v9 + Drei v10.
**Options considered:**
| | Complexity | Ecosystem fit | Team familiarity |
|---|---|---|---|
| R3F + Drei | Medium | Excellent — composes with React/Zustand naturally | Matches existing React/Vite stack |
| Vanilla Three.js | Higher (manual scene graph + React bridge) | Requires hand-rolled imperative/declarative bridge | More boilerplate for four distinct worlds |
**Consequences:** Easier to reuse `<Planet>` across four palette-driven instances; some drei abstractions lag behind bleeding-edge React releases — pin versions (Section 3) rather than tracking `latest` blindly.

### ADR-2: GSAP for camera choreography vs. Framer Motion 3D / drei CameraControls alone
**Status:** Accepted
**Context:** Need frame-accurate, timeline-sequenced camera moves (fly-in, hold, fly-out) independent of React's render cycle.
**Decision:** GSAP timeline tweens a plain object; R3F's `useFrame` reads it each tick (Section 5.3). Framer Motion is scoped to DOM/UI only.
**Options considered:**
| | Timeline control | React-render coupling | Best for |
|---|---|---|---|
| GSAP | Excellent — purpose-built for sequenced tweens/easing | None (mutates outside React) | Camera flythroughs |
| Framer Motion (DOM) | Good for UI, not built for 3D camera rigs | Tied to component render | Panels, tooltips, HUD morphs |
| drei `CameraControls` alone | Good for user-driven orbit/pan, not scripted cinematics | — | Free-look inside a world, not the fly-in itself |
**Consequences:** Two animation libraries in the stack is a deliberate split of responsibility, not redundancy — keep it that way; don't let GSAP creep into DOM transitions or Framer Motion into the 3D scene.

### ADR-3: Single persistent Canvas vs. per-planet remounted Canvas/route
**Status:** Accepted
**Context:** The brief's core promise is a continuous cinematic flight from galaxy to planet — a route change that remounts a new `<Canvas>` would hard-cut and lose all continuity.
**Decision:** One `<Canvas>` mounted at `App` root for the app's lifetime; planet worlds are lazy-loaded groups toggled by `navMode`/`activePlanetId`, not separate routes.
**Consequences:** No React Router page-per-planet model — navigation lives in Zustand, not the URL, unless deep-linking is added later (Section 15). Simplifies the camera continuity problem at the cost of losing "free" browser back-button/URL-sharing behavior; revisit if deep-linking becomes a requirement.

### ADR-4: Zustand vs. React Context/Redux for cross-cutting state
**Status:** Accepted
**Context:** Navigation state, hover state, and discovery/quiz progress need to be read/written from both the 3D scene layer and the DOM UI layer without prop-drilling.
**Decision:** Zustand, with `persist` middleware scoped to only the progress slice (Section 5.4).
**Options considered:**
| | Boilerplate | Perf in a `useFrame`-heavy tree | Persistence |
|---|---|---|---|
| Zustand | Minimal | Selective subscriptions avoid over-rendering | Built-in `persist` middleware |
| React Context | Low, but re-renders whole subtree on change | Risky next to a 3D scene with per-frame updates | Manual |
| Redux | Higher | Fine, but heavier setup for this scope | Needs extra middleware |
**Consequences:** Store must stay disciplined — no camera/position data in Zustand (that lives in refs/GSAP per ADR-2/5.3), only navigation intent and content-progress state.

---

## 13. Trade-off Summary

| Decision | What it buys | What it costs |
|---|---|---|
| Single persistent Canvas | Seamless cinematic transitions | No native routed URLs per planet (v1) |
| GSAP for camera / Framer Motion for UI | Right tool for each job, frame-accurate camera | Two animation libraries to keep disciplined about scope |
| Build one planet fully before the other three | A proven, reusable template; lower risk of four unfinished worlds | Slower to show "all four planets" in early demos |
| Mandatory non-3D fallback | Site is usable on any device, accessible by default | Extra surface to build and keep in sync with the 3D content |
| Placeholder content in early phases | Unblocks architecture/engineering work immediately | Real educational copy is a separate, later pass (Section 15) |

---

## 14. Implementation Phases

Each phase should be independently demoable and committed before moving on.

**Phase 0 — Scaffold**
Vite + React + TS project, Tailwind v4 wired via `@tailwindcss/vite`, folder structure from 5.2, fonts loaded (Orbitron, Space Grotesk, JetBrains Mono), design tokens in `tokens.css`, Zustand store skeleton.
*DoD:* blank page renders with fonts/tokens available; `npm run dev` clean.

**Phase 1 — Galaxy shell (no interaction yet)**
Instanced starfield, sun, 4 orbiting planets in their correct palettes, orbit animation, mouse-parallax camera drift (`useParallax`).
*DoD:* loads at a stable 60fps on a mid-range laptop; planets visibly orbit; parallax responds to cursor.

**Phase 2 — Interaction layer**
Hover states (tooltip, glow pulse, satellite speed-up), click → `CameraRig` transitions to a placeholder "targeting" zoom even before a real world exists, exit-to-galaxy reverses it.
*DoD:* clicking any planet produces a smooth cinematic fly-in/out; no jank when spamming clicks mid-transition.

**Phase 3 — Reference world (AI Planet)**
Build the full shared template (8.5) against AI Planet content: HUD frame morph from the Wayfinder Ring, concept cards, the neural-network signature visualization, one quiz satellite wired to `useGalaxyStore`.
*DoD:* AI Planet is a complete, polished experience end-to-end — this is the pattern the other three will copy.

**Phase 4 — Replicate for remaining planets**
Web Dev, DSA, Cybersecurity worlds, swapping only content + tokens + signature visualization per Section 8.

**Phase 5 — Discovery layer completion**
Fact asteroid belts, achievement comets, space-station hub (cross-planet mini-map + progress summary), `localStorage` persistence.

**Phase 6 — Polish & guardrails**
Nebula clouds, meteor showers, audio layer (off by default), `SkyMapFallback` for no-WebGL2/reduced-motion, keyboard-nav pass, contrast check per planet, `PerformanceMonitor`/adaptive DPR wiring, Lighthouse pass.

**Phase 7 — Deploy**
Production build, deploy to Vercel, README with setup + architecture summary (can lift straight from this file).

---

## 15. Risks & Open Questions

- **Content is placeholder in this spec.** Roadmap items, quiz questions, facts, and achievement copy for all four planets still need real authoring — treat Phase 3/4 content as a first draft, not final.
- **Scope vs. solo-build timeline:** this is a large cinematic build for one person. If time is tight, shipping Phases 0–3 (galaxy + one fully realized planet) as a portfolio piece is a legitimate, strong stopping point — better than four thin worlds.
- **Deep-linking:** ADR-3 trades away per-planet URLs. Revisit if Santosh wants to share a direct link to, say, the DSA world.
- **Sound design scope creep:** keep audio minimal and optional in v1; it's the easiest place for this project to balloon.
- **Browser support:** WebGL2 is required for the primary experience — Section 11's fallback is what keeps this from being a hard requirement for visitors.

---

### Quick prompts for Claude Code sessions

- `"Start Phase 0 from the spec."`
- `"Now build Phase 3 — the AI Planet reference template. Follow the shared template in Section 8.5 exactly so Phase 4 is a content swap."`
- `"Run a Phase 6 accessibility pass against Section 11 before we deploy."`
