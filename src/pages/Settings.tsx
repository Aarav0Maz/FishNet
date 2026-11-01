import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, LogOut, Pencil, Users } from 'lucide-react'
import { useWorkspace } from '../workspace'
import { SoundToggle } from '../components/SoundToggle'
import { InviteButton } from '../components/InviteButton'
import { normalizeParty, validParty } from '../lib/party'
import { supabase } from '../data/supabase'
import { useAuth } from '../auth'
import type { Settings as S } from '../types'

export default function Settings() {
  const { source, me, setMe, base } = useWorkspace()
  const { session } = useAuth()
  const nav = useNavigate()
  const [party, setParty] = useState(me?.settings.party ?? '')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  if (!me) return null

  async function save(patch: Partial<S>, okText: string) {
    if (busy || !me) return
    setBusy(true); setMsg(null)
    try {
      const { id: _id, ...rest } = me
      setMe(await source.saveMe({ ...rest, settings: { ...me.settings, ...patch } }))
      setMsg({ ok: true, text: okText })
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : 'Could not save' }) }
    finally { setBusy(false) }
  }

  const partyOk = validParty(party)
  return (
    <div className="mx-auto max-w-xl space-y-6 px-5 py-6 pb-10">
      <h1 className="display text-3xl">Settings</h1>
      {msg && <p role="status" className={`rounded-2xl px-4 py-3 text-sm ${msg.ok ? 'bg-accent/15 text-lav' : 'bg-pinky/10 text-pinky'}`}>{msg.text}</p>}

      <Section title="Your character">
        <p className="text-sm text-mute">Playing as <span className="text-ink">{me.persona.name}</span>, {me.persona.title}.</p>
        <button className="btn btn-ghost w-full" onClick={() => nav(`${base}/onboarding`)}><Pencil size={16} />Edit persona and details</button>
      </Section>

      <Section title="Party">
        <p className="text-sm text-mute">Set a party code and you will only meet people with the same code, for an event or a community. Leave it empty to meet everyone.</p>
        {source.kind === 'demo' && <p className="rounded-xl bg-pinky/10 px-3 py-2 text-xs text-pinky">Demo mode shows the whole simulated world. Party filtering works in the live app.</p>}
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="party">Party code</label>
          <input id="party" className="field" placeholder="e.g. larphacks" value={party} maxLength={24} onChange={(e) => setParty(normalizeParty(e.target.value))} aria-invalid={!partyOk} />
          <button className="btn btn-primary shrink-0" disabled={busy || !partyOk || party === (me.settings.party ?? '')} onClick={() => save({ party }, party ? `You are in the "${party}" party.` : 'Party cleared. You will meet everyone.')}>Save</button>
        </div>
        {!partyOk && <p className="text-xs text-pinky">Use 2 to 24 letters, numbers or dashes.</p>}
        {me.settings.party && <p className="flex items-center gap-2 text-sm text-lav"><Users size={15} />Current party: {me.settings.party}</p>}
        <InviteButton className="btn btn-ghost w-full" label={me.settings.party ? `Invite friends to "${me.settings.party}"` : 'Invite your party'} />
      </Section>

      <Section title="Privacy">
        <Switch label="Show me in Encounters" hint="Others can swipe on your persona. Required to be matched." on={me.settings.discoverable} disabled={busy} set={(v) => save({ discoverable: v }, v ? 'You are visible in Encounters.' : 'You are hidden from Encounters.')} />
        <Switch label="Show me on friends-of-friends maps" hint="Lets connections of your connections see your persona in their network." on={me.settings.showInGraph} disabled={busy} set={(v) => save({ showInGraph: v }, v ? 'You appear on extended maps.' : 'You are hidden from extended maps.')} />
        <p className="text-xs text-mute">Your real name, role, bio and LinkedIn are only shared after you and a connection both choose to reveal.</p>
      </Section>

      <Section title="Sound"><SoundToggle /></Section>

      <Section title="Account">
        {source.kind === 'live' && session?.user.email && <p className="text-sm text-mute">Signed in as <span className="text-ink">{session.user.email}</span></p>}
        <button className="btn btn-ghost w-full" onClick={async () => { if (supabase && source.kind === 'live') await supabase.auth.signOut(); nav('/') }}><LogOut size={16} />{source.kind === 'demo' ? 'Exit demo' : 'Log out'}</button>
      </Section>
    </div>
  )
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3 rounded-3xl bg-surface p-5"><h2 className="label !mb-0">{title}</h2>{children}</section>
)
const Switch = ({ label, hint, on, set, disabled }: { label: string; hint: string; on: boolean; set: (v: boolean) => void; disabled?: boolean }) => (
  <button type="button" role="switch" aria-checked={on} disabled={disabled} onClick={() => set(!on)} className="flex w-full items-center justify-between gap-4 rounded-2xl bg-elevated p-4 text-left disabled:opacity-60">
    <span><span className="block text-sm">{label}</span><span className="text-xs text-mute">{hint}</span></span>
    <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? 'bg-accent' : 'bg-bg'}`}>{on && <Check size={12} className="absolute left-2 top-2 text-white" />}<span className={`absolute top-1 size-5 rounded-full bg-white transition-all ${on ? 'left-6' : 'left-1'}`} /></span>
  </button>
)
