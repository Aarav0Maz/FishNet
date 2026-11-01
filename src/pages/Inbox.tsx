import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useWorkspace } from '../workspace'
import { Mascot } from '../components/Mascot'
import type { Notice, NoticeKind } from '../types'
import { useRevealedNames } from '../lib/useRevealedNames'

const where: Record<NoticeKind, { to: string; label: string }> = {
  match: { to: 'matches', label: 'See match' },
  message: { to: 'matches', label: 'Open chat' },
  intro_request: { to: 'intros', label: 'Respond' },
  intro_forwarded: { to: 'intros', label: 'View intro' },
  intro_accepted: { to: 'matches', label: 'Say hello' },
  intro_declined: { to: 'intros', label: 'View intro' },
  intro_expired: { to: 'intros', label: 'View intro' },
  reveal_request: { to: 'matches', label: 'Reveal back' },
  reveal_approved: { to: 'matches', label: 'See them' },
  digest: { to: 'discover', label: 'Start swiping' },
}

const text: Record<NoticeKind, (n: string) => string> = {
  match: (n) => `You matched with ${n}`,
  intro_request: (n) => `${n} asked for an introduction`,
  intro_forwarded: (n) => `${n} accepted and is forwarding your request`,
  intro_accepted: (n) => `Introduction approved by ${n}`,
  intro_declined: (n) => `${n} declined an introduction`,
  reveal_request: (n) => `${n} wants a reality reveal`,
  reveal_approved: (n) => `Reality reveal with ${n} is confirmed`,
  message: (n) => `${n} sent you a message`,
  digest: (n) => `${n} ${n === '1' ? 'person matches' : 'people match'} your interests. Go swipe!`,
  intro_expired: (n) => `Your introduction via ${n} expired with no answer`,
}

export default function Inbox() {
  const { source, notices, refreshNotices, base } = useWorkspace()
  const nav = useNavigate()
  const real = useRevealedNames()
  useEffect(() => { void refreshNotices() }, [refreshNotices])
  useEffect(() => {
    if (!notices.some((n) => !n.read)) return
    const t = setTimeout(() => { void source.markNoticesRead().then(refreshNotices) }, 1500)
    return () => clearTimeout(t)
  }, [notices, source, refreshNotices])
  /** Takes the user to where the alert needs them. Messages open the chat when the sender can be identified unambiguously. */
  async function open(n: Notice) {
    const dest = where[n.kind] ?? { to: 'matches', label: '' }
    if (n.kind === 'message' || n.kind === 'intro_accepted') {
      try {
        const hits = (await source.connections()).filter((c) => c.persona.name === n.name)
        if (hits.length === 1) return nav(`${base}/chat/${hits[0].otherId}`)
      } catch { /* fall through to the list */ }
    }
    nav(`${base}/${dest.to}`)
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-6">
      <h1 className="display mb-6 text-3xl">Alerts</h1>
      {notices.length === 0 && <div className="grid justify-items-center gap-3 py-14 text-center"><Mascot size={104} mood="sleepy" /><p className="display text-2xl">All quiet</p><p className="max-w-xs text-sm text-mute">Matches, messages, introductions and reveals show up here.</p></div>}
      <ul className="space-y-2">
        {notices.map((n: Notice) => (
          <li key={n.id}>
            <button onClick={() => void open(n)} className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left transition active:scale-[.99] ${n.read ? 'bg-surface hover:bg-elevated/70' : 'bg-elevated hover:bg-[#2b2140]'}`}>
              {!n.read && <span className="size-2 shrink-0 rounded-full bg-accent" aria-label="unread" />}
              <span className="min-w-0 flex-1">
                <span className="block text-sm">{text[n.kind]?.(real(n.name)) ?? n.kind}{n.simulated && <span className="ml-2 text-xs text-pinky">(simulated)</span>}</span>
                <span className="mt-0.5 flex items-center gap-1 text-xs text-lav">{where[n.kind]?.label ?? 'Open'}<ChevronRight size={12} /></span>
              </span>
              <time className="shrink-0 text-xs text-mute" dateTime={n.createdAt}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
