import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useWorkspace } from '../workspace'
import { parseTags } from '../lib/graph'
import { TEMPLATES, TEMPLATE_KEYS, type MyProfileInput } from '../types'
import { rollPersona } from '../lib/persona'
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
  const [skills, setSkills] = useState(me?.tags.skills.join(', ') ?? '')
  const [interests, setInterests] = useState(me?.tags.interests.join(', ') ?? '')
  const [goals, setGoals] = useState(me?.tags.goals.join(', ') ?? '')
  const [tpl, setTpl] = useState(me?.persona.template ?? 'billionaire')
  const [persona, setPersona] = useState(me?.persona ?? rollPersona('billionaire'))
  const [settings, setSettings] = useState(me?.settings ?? { discoverable: true, showInGraph: true })

  const pick = (k: string) => { setTpl(k); setPersona(rollPersona(k, persona.hue)) }
  const canNext = step === 1 ? real.name.trim() && real.role.trim() && parseTags(interests).length > 0 : step === 0 ? persona.name.trim() && persona.title.trim() && persona.company.trim() : true

  async function finish() {
    if (busy) return
    setBusy(true); setErr('')
    try {
      if (real.linkedin && !/^https?:\/\/([\w-]+\.)?linkedin\.com\//i.test(real.linkedin)) throw new Error('LinkedIn URL must start with https://linkedin.com/')
      const input: MyProfileInput = { real, tags: { skills: parseTags(skills), interests: parseTags(interests), goals: parseTags(goals) }, settings, persona }
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
            <p className="text-sm text-mute">Your real details stay private. Others only see them if you both approve a reveal.</p>
            <F label="Your name"><input className="field" value={real.name} maxLength={80} onChange={(e) => setReal({ ...real, name: e.target.value })} /></F>
            <F label="Role or education"><input className="field" value={real.role} maxLength={120} placeholder="e.g. CS student at UofT" onChange={(e) => setReal({ ...real, role: e.target.value })} /></F>
            <F label="Short bio"><textarea className="field" rows={2} maxLength={500} value={real.bio} onChange={(e) => setReal({ ...real, bio: e.target.value })} /></F>
            <F label="Skills (comma separated)"><input className="field" value={skills} placeholder="Design, React, Finance" onChange={(e) => setSkills(e.target.value)} /></F>
            <F label="Professional interests (comma separated)"><input className="field" value={interests} placeholder="AI, Climate, Gaming" onChange={(e) => setInterests(e.target.value)} /></F>
            <F label="Networking goals (comma separated)"><input className="field" value={goals} placeholder="Find cofounder, Mentorship" onChange={(e) => setGoals(e.target.value)} /></F>
            <F label="LinkedIn URL (optional, only shown after a mutual reveal)"><input className="field" inputMode="url" value={real.linkedin} onChange={(e) => setReal({ ...real, linkedin: e.target.value })} /></F>
          </>}
          {step === 0 && <>
            <div className="flex flex-wrap items-center gap-2">{TEMPLATE_KEYS.map((k) => <button key={k} onClick={() => pick(k)} aria-pressed={tpl === k} className={`rounded-full px-4 py-2 text-sm transition ${tpl === k ? 'bg-accent text-white shadow-[var(--glow)]' : 'bg-elevated text-mute hover:text-ink'}`}>{TEMPLATES[k].label}</button>)}
              <button type="button" onClick={() => setPersona(rollPersona(tpl))} className="ml-auto flex items-center gap-2 rounded-full bg-elevated px-4 py-2 text-sm text-lav hover:text-ink"><Dices size={16} />Re-roll</button></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <F label="Fictional name"><input className="field" maxLength={60} value={persona.name} onChange={(e) => setPersona({ ...persona, name: e.target.value })} /></F>
              <F label="Fictional title"><input className="field" maxLength={80} value={persona.title} onChange={(e) => setPersona({ ...persona, title: e.target.value })} /></F>
              <F label="Fictional company"><input className="field" maxLength={80} value={persona.company} onChange={(e) => setPersona({ ...persona, company: e.target.value })} /></F>
              <F label="Fictional valuation"><input className="field" maxLength={30} value={persona.valuation} onChange={(e) => setPersona({ ...persona, valuation: e.target.value })} /></F>
            </div>
            <F label="Fictional bio"><textarea className="field" rows={2} maxLength={280} value={persona.bio} onChange={(e) => setPersona({ ...persona, bio: e.target.value })} /></F>
            <F label={`Aura colour`}><input type="range" min={0} max={360} value={persona.hue} onChange={(e) => setPersona({ ...persona, hue: +e.target.value })} className="w-full accent-accent" /></F>
            <p className="text-xs text-mute">Please don’t impersonate real people. Everything here is shown as fictional, never as verified.</p>
            <div className="h-72"><PersonaCard persona={persona} /></div>
          </>}
          {step === 2 && <>
            <Toggle label="Show me in Discover" hint="Others can swipe on your persona. Required to be matched." on={settings.discoverable} set={(v) => setSettings({ ...settings, discoverable: v })} />
            <Toggle label="Show me on friends-of-friends maps" hint="Lets connections of your connections see your persona in their network graph." on={settings.showInGraph} set={(v) => setSettings({ ...settings, showInGraph: v })} />
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
