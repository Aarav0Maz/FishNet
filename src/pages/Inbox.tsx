import { useEffect } from 'react'
import { useWorkspace } from '../workspace'
import type { Notice, NoticeKind } from '../types'
import { useRevealedNames } from '../lib/useRevealedNames'

const text: Record<NoticeKind, (n: string) => string> = {
  match: (n) => `You matched with ${n}`,
  intro_request: (n) => `${n} asked for an introduction`,
  intro_forwarded: (n) => `${n} accepted and is forwarding your request`,
  intro_accepted: (n) => `Introduction approved by ${n}`,
  intro_declined: (n) => `${n} declined an introduction`,
  reveal_request: (n) => `${n} wants a reality reveal`,
  reveal_approved: (n) => `Reality reveal with ${n} is confirmed`,
}

export default function Inbox() {
  const { source, notices, refreshNotices } = useWorkspace()
  const real = useRevealedNames()
  useEffect(() => { void refreshNotices() }, [refreshNotices])
  useEffect(() => {
    if (!notices.some((n) => !n.read)) return
    const t = setTimeout(() => { void source.markNoticesRead().then(refreshNotices) }, 1500)
    return () => clearTimeout(t)
  }, [notices, source, refreshNotices])
  return (
    <div className="mx-auto max-w-xl px-5 py-6">
      <h1 className="display mb-6 text-3xl">Alerts</h1>
      {notices.length === 0 && <p className="py-12 text-center text-mute">Nothing yet. Matches, introductions and reveals show up here.</p>}
      <ul className="space-y-2">
        {notices.map((n: Notice) => (
          <li key={n.id} className={`flex items-center gap-3 rounded-2xl p-4 ${n.read ? 'bg-surface' : 'bg-elevated'}`}>
            {!n.read && <span className="size-2 shrink-0 rounded-full bg-accent" aria-label="unread" />}
            <span className="flex-1 text-sm">{text[n.kind]?.(real(n.name)) ?? n.kind}{n.simulated && <span className="ml-2 text-xs text-pinky">(simulated)</span>}</span>
            <time className="text-xs text-mute" dateTime={n.createdAt}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
          </li>
        ))}
      </ul>
    </div>
  )
}
