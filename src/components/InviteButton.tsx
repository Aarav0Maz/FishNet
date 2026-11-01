import { useRef, useState } from 'react'
import { Check, Share2 } from 'lucide-react'
import { useWorkspace } from '../workspace'
import { sfx } from '../lib/sound'

/** Copies an invite link (phones use the native share sheet). If copying is blocked, the link is shown to copy by hand. */
export function InviteButton({ className = 'btn btn-ghost', label = 'Invite your party' }: { className?: string; label?: string }) {
  const { me } = useWorkspace()
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle')
  const field = useRef<HTMLInputElement>(null)
  const party = me?.settings.party
  const url = party ? `${window.location.origin}/?party=${encodeURIComponent(party)}` : window.location.origin
  const text = `I'm ${me ? `${me.persona.name}, ${me.persona.title}` : 'a fictional founder'} on FishNet. Come find out who you'd be.`

  async function copy(value: string): Promise<boolean> {
    try { await navigator.clipboard.writeText(value); return true } catch { /* fall back below */ }
    try {
      const ta = document.createElement('textarea')
      ta.value = value; ta.style.position = 'fixed'; ta.style.opacity = '0'
      document.body.appendChild(ta); ta.select()
      const ok = document.execCommand('copy'); ta.remove(); return ok
    } catch { return false }
  }

  async function invite() {
    if (window.matchMedia('(pointer: coarse)').matches && navigator.share) {
      try { await navigator.share({ title: 'FishNet', text, url }); return } catch (e) { if (e instanceof DOMException && e.name === 'AbortError') return }
    }
    if (await copy(`${text} ${url}`)) { setState('copied'); sfx.on(); setTimeout(() => setState('idle'), 2400) }
    else { setState('manual'); setTimeout(() => field.current?.select(), 50) }
  }

  return (
    <>
      <button className={className} onClick={invite}>{state === 'copied' ? <><Check size={16} />Link copied</> : <><Share2 size={16} />{label}</>}</button>
      {state === 'manual' && <input ref={field} readOnly aria-label="Invite link" className="field mt-2 text-sm" value={`${text} ${url}`} onFocus={(e) => e.currentTarget.select()} />}
    </>
  )
}
