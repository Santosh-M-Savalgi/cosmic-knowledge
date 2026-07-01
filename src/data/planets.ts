import type { PlanetMeta } from './types'

// The four worlds. Palettes are locked to spec Section 7.2; orbit params are
// chosen distinct per planet (independent radius/speed/inclination, spec 2.1)
// and can be tuned in Phase 1 once the galaxy shell is on screen.
export const PLANETS: PlanetMeta[] = [
  {
    id: 'ai',
    name: 'AI',
    tagline: 'Neural nets, models, and the road to intelligence.',
    colors: { base: '#0B1B33', glow: '#2F6FED', accent: '#7FE7E0', highlight: '#FFB37A' },
    orbit: { radiusAU: 6, periodSeconds: 48, inclinationDeg: 4 },
  },
  {
    id: 'webdev',
    name: 'Web Development',
    tagline: 'From the stack to the ship — building for the browser.',
    colors: { base: '#07231C', glow: '#34D399', accent: '#C6F135', highlight: '#FF8B5E' },
    orbit: { radiusAU: 9, periodSeconds: 72, inclinationDeg: -7 },
  },
  {
    id: 'dsa',
    name: 'DSA',
    tagline: 'Data structures, algorithms, and the shape of complexity.',
    colors: { base: '#2A0A0A', glow: '#FF5A4E', accent: '#FFD166', highlight: '#6B8CAE' },
    orbit: { radiusAU: 12, periodSeconds: 96, inclinationDeg: 11 },
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    tagline: 'Threats, defenses, and the art of keeping secrets.',
    colors: { base: '#14071F', glow: '#9D4EDD', accent: '#00F0FF', highlight: '#FF3864' },
    orbit: { radiusAU: 15, periodSeconds: 128, inclinationDeg: -3 },
  },
]

export const PLANETS_BY_ID = Object.fromEntries(
  PLANETS.map((p) => [p.id, p]),
) as Record<PlanetMeta['id'], PlanetMeta>
