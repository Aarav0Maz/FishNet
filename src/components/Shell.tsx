import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { Bell, Compass, Handshake, Network, Send, LogOut, Pencil } from 'lucide-react'
import { useWorkspace } from '../workspace'
import { SoundToggle } from './SoundToggle'
import { InviteButton } from './InviteButton'
import { supabase } from '../data/supabase'

export function Shell() {
  const { base, source, unread, me } = useWorkspace()
  const nav = useNavigate()
  const { pathname } = useLocation()
  const reduce = useReducedMotion()
  const hint = ({ discover: 'Swipe right (→) to match', network: 'Pick a far target to start a quest', matches: 'Message a match, then reveal', intros: 'Responses arrive in a few seconds', inbox: 'Alerts appear as things happen' } as Record<string, string>)[pathname.split('/')[2] ?? ''] ?? ''
  const items = [
    { to: 'discover', icon: Compass, label: 'Discover' },
    { to: 'network', icon: Network, label: 'Network' },
    { to: 'matches', icon: Handshake, label: 'Matches' },
    { to: 'intros', icon: Send, label: 'Intros' },
    { to: 'inbox', icon: Bell, label: 'Alerts', badge: unread },
  ]
  const link = ({ isActive }: { isActive: boolean }) =>
    `relative flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] transition md:flex-row md:gap-3 md:px-4 md:py-3 md:text-sm ${isActive ? 'bg-elevated text-ink' : 'text-mute hover:text-ink'}`
  return (
    <div className="flex h-full flex-col md:flex-row">
      {source.kind === 'demo' && (
        <div className="fixed inset-x-0 top-0 z-50 bg-pinky/90 py-1 text-center text-xs font-medium text-bg">
          DEMO MODE · simulated, nothing saved{hint && <span className="hidden sm:inline"> · {hint}</span>}
        </div>
      )}
      <div className="fixed right-3 top-9 z-40 md:hidden"><SoundToggle compact /></div>
      <aside className="hidden w-60 shrink-0 flex-col border-r border-white/5 p-5 pt-10 md:flex">
        <span className="display mb-8 text-2xl">Fish<span className="text-accent">Net</span></span>
        <nav className="flex flex-col gap-1">
          {items.map((i) => <NavLink key={i.to} to={`${base}/${i.to}`} className={link}><i.icon size={18} />{i.label}{!!i.badge && <Badge n={i.badge} />}</NavLink>)}
        </nav>
        <div className="mt-auto space-y-2 text-sm text-mute">
          {me && <p className="truncate px-4" title="Your fictional persona">Playing: {me.persona.name}</p>}
          <button className="flex items-center gap-3 px-4 py-2 hover:text-ink" onClick={() => nav(`${base}/onboarding`)}><Pencil size={16} />Edit persona</button>
          <SoundToggle />
          <InviteButton className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm text-mute transition hover:bg-elevated/60 hover:text-ink" />
          <button className="flex items-center gap-3 px-4 py-2 hover:text-ink" onClick={async () => { if (supabase && source.kind === 'live') await supabase.auth.signOut(); nav('/') }}>
            <LogOut size={16} />{source.kind === 'demo' ? 'Exit demo' : 'Log out'}
          </button>
        </div>
      </aside>
      <main className="min-h-0 flex-1 overflow-y-auto pb-24 pt-8 md:pb-0">
        <motion.div key={pathname} className="h-full" initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}><Outlet /></motion.div>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-white/5 bg-bg/90 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
        {items.map((i) => <NavLink key={i.to} to={`${base}/${i.to}`} className={link} aria-label={i.label}><i.icon size={20} />{i.label}{!!i.badge && <Badge n={i.badge} />}</NavLink>)}
      </nav>
    </div>
  )
}
const Badge = ({ n }: { n: number }) => <span className="absolute right-2 top-1 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] text-white md:static md:ml-auto">{n}</span>
