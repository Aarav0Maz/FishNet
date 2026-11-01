import { useState } from 'react'
import { Check, Share2 } from 'lucide-react'
import { useWorkspace } from '../workspace'
import { sfx } from '../lib/sound'

/** Copies (or natively shares) an invite link. Nothing is sent to anyone and no data is collected. */
export function InviteButton({ className = 'btn btn-ghost', label = 'Invite your party' }: { className?: string; label?: string }) {
  const { me } = useWorkspace()
  const [done, setDone] = useState(false)
  async function invite() {
    const party = me?.settings.party
    const url = party ? `${window.location.origin}/?party=${encodeURIComponent(party)}` : window.location.origin
    const text = `I'm ${me ? `${me.persona.name}, ${me.persona.title}` : 'a fictional founder'} on FishNet. Come find out who you'd be.`
    try {
      if (navigator.share) await navigator.share({ title: 'FishNet', text, url })
      else { await navigator.clipboard.writeText(`${text} ${url}`); setDone(true); sfx.on(); setTimeout(() => setDone(false), 2200) }
    } catch { /* user dismissed the share sheet */ }
  }
  return <button className={className} onClick={invite}>{done ? <><Check size={16} />Link copied</> : <><Share2 size={16} />{label}</>}</button>
}
