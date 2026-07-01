import { useEffect } from 'react'
import { PLANETS } from './data/planets'
import { useGalaxyStore } from './store/useGalaxyStore'

/**
 * Phase 0 placeholder. Proves fonts + design tokens + Tailwind v4 + the store are
 * all wired. The persistent <Canvas> and galaxy shell arrive in Phase 1.
 */
function App() {
  const setReducedMotion = useGalaxyStore((s) => s.setReducedMotion)

  // Seed reduced-motion from the platform preference (fuller hook lands in Phase 6).
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [setReducedMotion])

  return (
    <main className="flex h-full flex-col items-center justify-center gap-8 bg-void px-6 text-center text-starlight">
      <p className="font-mono text-xs tracking-[0.4em] text-starlight/50 uppercase">
        Phase 0 · Scaffold
      </p>

      <h1 className="font-display text-4xl font-black tracking-[0.15em] uppercase sm:text-6xl">
        Cosmic Knowledge Explorer
      </h1>

      <p className="max-w-md font-body text-base text-starlight/70">
        A navigable galaxy of the subjects Santosh is building depth in. The stars are
        still warming up.
      </p>

      <ul className="flex flex-wrap justify-center gap-3 font-mono text-xs">
        {PLANETS.map((planet) => (
          <li
            key={planet.id}
            className="rounded-full border px-4 py-1.5"
            style={{ borderColor: planet.colors.glow, color: planet.colors.accent }}
          >
            {planet.name}
          </li>
        ))}
      </ul>
    </main>
  )
}

export default App
