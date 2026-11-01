import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Mascot } from '../components/Mascot'
import { liveConfigured } from '../data/supabase'
import { useAuth } from '../auth'

export default function Landing() {
  const { session } = useAuth()
  return (
    <div className="relative mx-auto flex min-h-full max-w-5xl flex-col px-6 py-8">
      <header className="flex items-center justify-between"><span className="display text-2xl">Fish<span className="text-accent">Net</span></span>
        <Link to="/auth" className="text-sm text-mute hover:text-ink">{session ? 'Open app' : 'Log in'}</Link></header>
      <section className="grid flex-1 items-center gap-10 py-12 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease: [.22, 1, .36, 1] }}>
          <h1 className="display text-5xl leading-[1.05] md:text-7xl">Come for the <em className="text-lav">fake status.</em><br />Leave with <em className="text-pinky">real connections.</em></h1>
          <p className="mt-6 max-w-md text-mute">Invent an absurd professional persona. Meet people. Match for real. Reveal who you are only when you both say so.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={session ? '/app' : '/auth'} className="btn btn-primary">{session ? 'Continue' : 'Join FishNet'}</Link>
            <Link to="/demo" className="btn btn-ghost">Try the demo</Link>
          </div>
          {!liveConfigured && <p className="mt-4 text-xs text-mute">Accounts are not configured on this build; demo mode works without them.</p>}
        </motion.div>
        <motion.div className="grid place-items-center" initial={{ opacity: 0, scale: .85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 14, delay: .2 }}>
          <Mascot size={300} mood="shades" />
        </motion.div>
      </section>
    </div>
  )
}
