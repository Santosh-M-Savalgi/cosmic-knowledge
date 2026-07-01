import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PlanetId, QuizAttempt } from '../data/types'

export type NavMode = 'idle-galaxy' | 'transitioning' | 'world-focused'

// Single source of truth for navigation intent + content progress (spec Section 5.4).
// NOTE: no camera/position data lives here — that stays in refs/GSAP (ADR-2/5.3).
export interface GalaxyStore {
  // --- navigation (never persisted; a refresh always lands back in the galaxy) ---
  navMode: NavMode
  hoveredPlanetId: PlanetId | null
  activePlanetId: PlanetId | null
  reducedMotion: boolean

  // --- progress (persisted to localStorage) ---
  discoveries: Record<string, boolean> // fact/achievement id -> unlocked
  quizProgress: Record<string, QuizAttempt> // quiz id -> last attempt

  // --- actions ---
  setHoveredPlanet: (id: PlanetId | null) => void
  setReducedMotion: (value: boolean) => void
  enterPlanet: (id: PlanetId) => void
  exitToGalaxy: () => void
  unlockDiscovery: (id: string) => void
  recordQuizAttempt: (id: string, attempt: QuizAttempt) => void
}

export const useGalaxyStore = create<GalaxyStore>()(
  persist(
    (set) => ({
      navMode: 'idle-galaxy',
      hoveredPlanetId: null,
      activePlanetId: null,
      reducedMotion: false,

      discoveries: {},
      quizProgress: {},

      setHoveredPlanet: (id) => set({ hoveredPlanetId: id }),

      setReducedMotion: (value) => set({ reducedMotion: value }),

      // Camera choreography (CameraRig) will react to navMode; here we only set intent.
      enterPlanet: (id) =>
        set({ activePlanetId: id, navMode: 'transitioning', hoveredPlanetId: null }),

      exitToGalaxy: () => set({ navMode: 'transitioning', activePlanetId: null }),

      unlockDiscovery: (id) =>
        set((state) => ({ discoveries: { ...state.discoveries, [id]: true } })),

      recordQuizAttempt: (id, attempt) =>
        set((state) => ({ quizProgress: { ...state.quizProgress, [id]: attempt } })),
    }),
    {
      name: 'cosmic-progress',
      // Persist ONLY the progress slice — navigation/camera state must not survive reload.
      partialize: (state) => ({
        discoveries: state.discoveries,
        quizProgress: state.quizProgress,
      }),
    },
  ),
)
