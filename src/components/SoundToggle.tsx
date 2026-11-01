import { useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { setSound, soundEnabled } from '../lib/sound'

export function SoundToggle({ compact = false }: { compact?: boolean }) {
  const [on, setOn] = useState(soundEnabled())
  const toggle = () => { setSound(!on); setOn(!on) }
  const Icon = on ? Volume2 : VolumeX
  return compact ? (
    <button data-silent aria-pressed={on} aria-label={on ? 'Sound on' : 'Sound off'} onClick={toggle} className={`grid size-10 place-items-center rounded-full border border-white/10 bg-surface/90 backdrop-blur transition active:scale-90 ${on ? 'text-lav' : 'text-mute'}`}><Icon size={18} /></button>
  ) : (
    <button data-silent aria-pressed={on} onClick={toggle} className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm text-mute transition hover:bg-elevated/60 hover:text-ink"><Icon size={16} />Sound {on ? 'on' : 'off'}</button>
  )
}
