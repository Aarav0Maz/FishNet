import { TEMPLATES, type Persona } from '../types'

const FIRST = ['Maxwell', 'Sloane', 'Jordan', 'Nova', 'Ilya', 'Beatrix', 'Cassius', 'Aurelia', 'Zephyr', 'Marguerite', 'Thaddeus', 'Seraphina', 'Rocco', 'Vivienne', 'Leopold', 'Octavia', 'Kai', 'Persephone', 'Evander', 'Calliope']
const LAST = ['Vantage', 'Ashcroft', 'Pike', 'Lindqvist', 'Brightwater', 'Holloway', 'Ironwood', 'Strand', 'Quill', 'Marchetti', 'Sterling', 'Crane', 'Archer', 'Locke', 'Wren', 'Dunn', 'Frost', 'Kane', 'Moss', 'Vale']
const CO_A = ['Apex', 'Lumina', 'Hyperscale', 'Vantage', 'Quillverse', 'Aperture', 'Obsidian', 'Zenith', 'Nimbus', 'Paragon', 'Solstice', 'Monarch']
const CO_B = ['Holdings', 'Dynamics', 'Capital', 'Labs', 'Ventures', 'Systems', 'Minds', 'Industries', 'Synergy', 'Collective']
const VAL: Record<string, string[]> = {
  billionaire: ['$4.2B', '$7.8B', '$12B', '$3.1B'], vc: ['$900M AUM', '$2.2B AUM', '$450M AUM'], exec: ['$12B', '$20B', '$8B'],
  visionary: ['$300M', '$75M', '$1.1B'], ai: ['$2.8B', '$1.7B', '$5B'], investor: ['$1.5B AUM', '$600M AUM', '$950M AUM'],
}
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

/** Rolls a fresh fictional persona for a template. Names are invented combinations, not real people. */
export function rollPersona(template: string, hue = 255 + Math.floor(Math.random() * 90)): Persona {
  const t = TEMPLATES[template] ?? TEMPLATES.billionaire
  return {
    template,
    name: `${template === 'ai' ? 'Dr. ' : ''}${pick(FIRST)} ${pick(LAST)}`,
    title: t.title,
    company: `${pick(CO_A)} ${pick(CO_B)}`,
    bio: t.bio,
    valuation: pick(VAL[template] ?? VAL.billionaire),
    hue,
  }
}
