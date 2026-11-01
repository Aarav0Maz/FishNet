import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase, liveConfigured } from '../data/supabase'
import { useAuth } from '../auth'
import { Mascot } from '../components/Mascot'

export default function Auth() {
  const { session, loading } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  if (!loading && session) return <Navigate to="/app" replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase || busy) return
    setBusy(true); setMsg(null)
    const r = mode === 'signup' ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (r.error) return setMsg({ ok: false, text: r.error.message })
    if (mode === 'signup' && !r.data.session) return setMsg({ ok: true, text: 'Check your email to confirm your account, then log in.' })
    nav('/app')
  }

  return (
    <div className="mx-auto grid min-h-full max-w-md content-center gap-6 px-6 py-10">
      <div className="flex items-center gap-4"><Mascot size={72} mood="happy" /><h1 className="display text-3xl">{mode === 'signup' ? 'Join FishNet' : 'Welcome back'}</h1></div>
      {!liveConfigured && <p className="rounded-2xl bg-elevated p-4 text-sm text-mute">Supabase is not configured for this build, so sign-up is unavailable. <Link className="text-lav underline" to="/demo">Try the demo</Link> instead.</p>}
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label" htmlFor="email">Email</label><input id="email" className="field" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="label" htmlFor="pw">Password</label><input id="pw" className="field" type="password" required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {msg && <p role="alert" className={`text-sm ${msg.ok ? 'text-lav' : 'text-pinky'}`}>{msg.text}</p>}
        <button className="btn btn-primary w-full" disabled={busy || !liveConfigured}>{busy ? 'One moment…' : mode === 'signup' ? 'Create account' : 'Log in'}</button>
      </form>
      <button className="text-sm text-mute hover:text-ink" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setMsg(null) }}>
        {mode === 'signup' ? 'Already have an account? Log in' : 'New here? Create an account'}
      </button>
    </div>
  )
}
