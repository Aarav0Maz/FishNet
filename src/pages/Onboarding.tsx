import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useWorkspace } from '../workspace'
import { canonicalTags, GOAL_OPTIONS, INTEREST_OPTIONS } from '../lib/tags'
import { TagPicker } from '../components/TagPicker'
import { TEMPLATES, TEMPLATE_KEYS, type MyProfileInput } from '../types'
import { rollPersona } from '../lib/persona'
import { invitedParty, normalizeParty, validParty } from '../lib/party'
import { Dices } from 'lucide-react'
import { Mascot } from '../components/Mascot'
import { PersonaCard } from '../components/PersonaCard'

const steps = ['Persona', 'You', 'Privacy'] as const

export default function Onboarding() {
  const { source, base, setMe, me } = useWorkspace()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [real, setReal] = useState(me?.real ?? { name: '', role: '', bio: '', linkedin: '' })
  const [skills, setSkills] = useState<string[]>(me?.tags.skills ?? [])
  const [interests, setInterests] = useState<string[]>(me?.tags.interests ?? [])
  const [goals, setGoals] = useState<string[]>(me?.tags.goals ?? [])
  const [tpl, setTpl] = useState(me?.persona.template ?? 'billionaire')
  const [persona, setPersona] = useState(me?.persona ?? rollPersona('billionaire'))
  const [settings, setSettings] = useState(me?.settings ?? { discoverable: true, showInGraph: true, party: invitedParty() })

  const pick = (k: string) => { setTpl(k); setPersona(rollPersona(k, persona.hue)) }
  const canNext = step === 1 ? real.name.trim() && interests.length > 0 : step === 0 ? persona.name.trim() && persona.title.trim() && persona.company.trim() : true

  async function finish() {
    if (busy) return
    setBusy(true); setErr('')
    try {
      if (!validParty(settings.party)) throw new Error('Party code must be 2 to 24 letters, numbers or dashes')
      if (real.linkedin && !/^https?:\/\/([\w-]+\.)?linkedin\.com\//i.test(real.linkedin)) throw new Error('LinkedIn URL must start with https://linkedin.com/')
      const input: MyProfileInput = { real, tags: { skills: canonicalTags(skills), interests: canonicalTags(interests), goals: canonicalTags(goals, 'goal') }, settings, persona }
      setMe(await source.saveMe(input))
      nav(`${base}/discover`, { replace: true })
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not save'); setBusy(false) }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      {source.kind === 'demo' && <p className="mb-4 rounded-full bg-pinky/15 px-4 py-2 text-center text-xs text-pinky">DEMO MODE · nothing you enter here is saved</p>}
      <div className="mb-8 flex items-center gap-4"><Mascot size={64} mood={step === 0 ? 'shades' : 'smug'} />
        <div><p className="text-xs uppercase tracking-widest text-mute">Step {step + 1} of 3 · {steps[step]}</p>
          <h1 className="display text-3xl">{['Who do you want to be?', 'Who are you, really?', 'You are in control'][step]}</h1></div></div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: .25 }} className="space-y-4">
          {step === 1 && <>
            <p className="text-sm text-mute">Your real details stay private. Others only see them if you both choose to reveal.</p>
            <F label="Your name"><input className="field" value={real.name} maxLength={80} onChange={(e) => setReal({ ...real, name: e.target.value })} /></F>
            <F label="Role or education (optional)"><input className="field" value={real.role} maxLength={120} placeholder="e.g. CS student at UofT" onChange={(e) => setReal({ ...real, role: e.target.value })} /></F>
            <F label="Short bio"><textarea className="field" rows={2} maxLength={500} value={real.bio} onChange={(e) => setReal({ ...real, bio: e.target.value })} /></F>
            <TagPicker label="Interests (pick at least one)" hint="Matching is based on these. Similar words are merged for you." kind="interest" options={INTEREST_OPTIONS} value={interests} onChange={setInterests} />
            <TagPicker label="Skills" kind="interest" options={INTEREST_OPTIONS} value={skills} onChange={setSkills} />
            <TagPicker label="Networking goals" kind="goal" options={GOAL_OPTIONS} value={goals} onChange={setGoals} />
            <F label="LinkedIn URL (optional, only shown after a mutual reveal)"><input className="field" inputMode="url" value={real.linkedin} onChange={(e) => setReal({ ...real, linkedin: e.target.value })} /></F>
          </>}
          {step === 0 && <>
            <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none]" role="radiogroup" aria-label="Persona template">
              {TEMPLATE_KEYS.map((k) => <button key={k} role="radio" aria-checked={tpl === k} onClick={() => pick(k)} className={`shrink-0 rounded-full px-4 py-2.5 text-sm transition active:scale-95 ${tpl === k ? 'bg-accent text-white shadow-[var(--glow)]' : 'bg-elevated text-mute hover:text-ink'}`}>{TEMPLATES[k].label}</button>)}
            </div>
            <motion.div key={persona.name + persona.company} initial={{ opacity: 0, y: 10, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }} className="h-72">
              <PersonaCard persona={persona} />
            </motion.div>
            <button type="button" onClick={() => setPersona(rollPersona(tpl, persona.hue))} className="btn btn-ghost w-full"><Dices size={18} />Re-roll persona</button>
            <details className="group rounded-2xl bg-surface">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm text-mute marker:hidden"><span>Customize details</span><span className="text-lav transition group-open:rotate-180">⌄</span></summary>
              <div className="space-y-3 px-4 pb-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <F label="Fictional name"><input className="field" maxLength={60} value={persona.name} onChange={(e) => setPersona({ ...persona, name: e.target.value })} /></F>
                  <F label="Fictional title"><input className="field" maxLength={80} value={persona.title} onChange={(e) => setPersona({ ...persona, title: e.target.value })} /></F>
                  <F label="Fictional company"><input className="field" maxLength={80} value={persona.company} onChange={(e) => setPersona({ ...persona, company: e.target.value })} /></F>
                  <F label="Fictional valuation"><input className="field" maxLength={30} value={persona.valuation} onChange={(e) => setPersona({ ...persona, valuation: e.target.value })} /></F>
                </div>
                <F label="Fictional bio"><textarea className="field" rows={2} maxLength={280} value={persona.bio} onChange={(e) => setPersona({ ...persona, bio: e.target.value })} /></F>
                <F label="Aura colour"><input type="range" min={0} max={360} value={persona.hue} onChange={(e) => setPersona({ ...persona, hue: +e.target.value })} className="w-full accent-accent" /></F>
              </div>
            </details>
            <p className="text-xs text-mute">Please don’t impersonate real people. Everything here is shown as fictional, never as verified.</p>
          </>}
          {step === 2 && <>
            <Toggle label="Show me in Discover" hint="Others can swipe on your persona. Required to be matched." on={settings.discoverable} set={(v) => setSettings({ ...settings, discoverable: v })} />
            <Toggle label="Show me on friends-of-friends maps" hint="Lets connections of your connections see your persona in their network graph." on={settings.showInGraph} set={(v) => setSettings({ ...settings, showInGraph: v })} />
            <F label="Party code (optional)"><input className="field" placeholder="e.g. larphacks" maxLength={24} value={settings.party} onChange={(e) => setSettings({ ...settings, party: normalizeParty(e.target.value) })} /></F>
            <p className="text-xs text-mute">Only meet people with the same code, for an event or community. Leave empty to meet everyone.</p>
            <p className="text-sm text-mute">Your real name, role, bio and LinkedIn are never shown unless you and a connection both approve a reveal.</p>
          </>}
        </motion.div>
      </AnimatePresence>
      {err && <p role="alert" className="mt-4 text-sm text-pinky">{err}</p>}
      <div className="mt-8 flex justify-between">
        <button className="btn btn-ghost" onClick={() => setStep(step - 1)} disabled={step === 0 || busy}>Back</button>
        {step < 2 ? <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>Continue</button>
          : <button className="btn btn-primary" disabled={busy} onClick={finish}>{busy ? 'Saving…' : 'Dive in'}</button>}
      </div>
    </div>
  )
}

const F = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><span className="label">{label}</span>{children}</label>
const Toggle = ({ label, hint, on, set }: { label: string; hint: string; on: boolean; set: (v: boolean) => void }) => (
  <button type="button" role="switch" aria-checked={on} onClick={() => set(!on)} className="flex w-full items-center justify-between gap-4 rounded-2xl bg-surface p-4 text-left">
    <span><span className="block">{label}</span><span className="text-xs text-mute">{hint}</span></span>
    <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? 'bg-accent' : 'bg-elevated'}`}><span className={`absolute top-1 size-5 rounded-full bg-white transition-all ${on ? 'left-6' : 'left-1'}`} /></span>
  </button>
)
