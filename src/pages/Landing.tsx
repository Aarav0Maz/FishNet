import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Dices, Heart, Map, Drama } from 'lucide-react'
import { Mascot } from '../components/Mascot'
import { liveConfigured } from '../data/supabase'
import { useAuth } from '../auth'

export default function Landing() {
  const { session } = useAuth()
  return (
    <div className="relative mx-auto flex min-h-full max-w-5xl flex-col px-6 py-8">
      <header className="flex items-center justify-between"><span className="display text-2xl">Fish<span className="text-accent">Net</span></span>
        <Link to="/auth" className="inline-flex min-h-11 items-center px-2 text-sm text-mute hover:text-ink">{session ? 'Open app' : 'Log in'}</Link></header>
      <section className="grid items-center gap-10 py-12 md:min-h-[70vh] md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease: [.22, 1, .36, 1] }}>
          <h1 className="display text-5xl leading-[1.05] md:text-7xl">Come for the <em className="text-lav">fake status.</em><br />Leave with <em className="text-pinky">real connections.</em></h1>
          <p className="mt-6 max-w-md text-mute">A role-playing game for real networking. Roll a character, meet other players, quest your way to anyone, and take the mask off only when you both choose to.</p>
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
      <section aria-labelledby="how" className="pb-12">
        <h2 id="how" className="label mb-4">How the game works</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Dices, t: 'Roll a character', d: 'A fictional name, company and valuation. Always labelled fictional.' },
            { icon: Heart, t: 'Meet in encounters', d: 'Swipe. A match forms only when you both say yes.' },
            { icon: Map, t: 'Quest to anyone', d: 'Follow a route of real connections, one introduction at a time.' },
            { icon: Drama, t: 'Take the mask off', d: 'Reveal your real self only when you both choose to.' },
          ].map((s, i) => (
            <motion.li key={s.t} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl border border-white/5 bg-surface p-5">
              <span className="grid size-10 place-items-center rounded-2xl bg-accent/15 text-lav"><s.icon size={20} /></span>
              <p className="display mt-4 text-xl">{s.t}</p>
              <p className="mt-1 text-sm leading-relaxed text-mute">{s.d}</p>
            </motion.li>
          ))}
        </ol>
      </section>
    </div>
  )
}
