import { useState, type KeyboardEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { canonicalTag } from '../lib/tags'
import { sfx } from '../lib/sound'

/** Pick canonical tags from chips, or type your own; typed tags fold into the taxonomy ("ML" becomes "AI & ML"). */
export function TagPicker({ label, hint, value, onChange, options, kind, max = 12 }: {
  label: string; hint?: string; value: string[]; onChange: (v: string[]) => void; options: string[]; kind: 'interest' | 'goal'; max?: number
}) {
  const [text, setText] = useState('')
  const [all, setAll] = useState(false)
  const add = (raw: string) => {
    const t = canonicalTag(raw, kind)
    if (!t || value.includes(t) || value.length >= max) return
    sfx.tick()
    onChange([...value, t])
  }
  const remove = (t: string) => onChange(value.filter((x) => x !== t))
  const key = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(text); setText('') }
    else if (e.key === 'Backspace' && !text && value.length) remove(value[value.length - 1])
  }
  const suggestions = options.filter((o) => !value.includes(o))
  const shown = all ? suggestions : suggestions.slice(0, 8)
  return (
    <fieldset className="space-y-2">
      <legend className="label">{label}</legend>
      {hint && <p className="-mt-1 text-xs text-mute">{hint}</p>}
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-2xl border border-[#2d2440] bg-surface p-2 focus-within:border-accent">
        {value.map((t) => (
          <span key={t} className="chip flex items-center gap-1 !py-1.5 pl-3 pr-2">{t}
            <button type="button" aria-label={`Remove ${t}`} className="rounded-full p-0.5 hover:bg-white/10" onClick={() => remove(t)}><X size={12} /></button>
          </span>
        ))}
        <input className="min-w-28 flex-1 bg-transparent px-2 py-1.5 text-sm outline-none" value={text} placeholder={value.length ? 'Add another…' : 'Type and press Enter'} aria-label={`Add ${label}`}
          onChange={(e) => setText(e.target.value)} onKeyDown={key} onBlur={() => { if (text.trim()) { add(text); setText('') } }} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {shown.map((o) => (
          <button key={o} type="button" onClick={() => add(o)} className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs text-mute transition hover:border-accent/60 hover:text-ink active:scale-95"><Plus size={12} />{o}</button>
        ))}
        {suggestions.length > 8 && <button type="button" onClick={() => setAll(!all)} className="px-2 py-1.5 text-xs text-lav underline">{all ? 'Show fewer' : `More (${suggestions.length - 8})`}</button>}
      </div>
    </fieldset>
  )
}
