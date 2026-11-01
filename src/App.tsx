import { lazy, Suspense, useEffect, useMemo, type ReactNode } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { rollPersona } from './lib/persona'
import { TEMPLATE_KEYS } from './types'
import { useAuth } from './auth'
import { createDemoSource } from './data/demo'
import { createLiveSource, liveConfigured } from './data/supabase'
import { WorkspaceProvider, useWorkspace } from './workspace'
import { Shell } from './components/Shell'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import Discover from './pages/Discover'
import Matches from './pages/Matches'
import Intros from './pages/Intros'
import Inbox from './pages/Inbox'
import Chat from './pages/Chat'

const Network = lazy(() => import('./pages/Network'))
const Loading = () => <div className="grid h-full place-items-center text-mute" role="status">Loading…</div>

const entry = (base: string) => (base === '/demo' ? `${base}/start` : `${base}/onboarding`)

/** Demo quick start: a ready-made persona so a first-time visitor reaches the swipe deck in one click. */
function DemoStart() {
  const { source, setMe, base } = useWorkspace()
  const nav = useNavigate()
  useEffect(() => {
    let live = true
    void (async () => {
      const m = (await source.getMe()) ?? (await source.saveMe({
        persona: rollPersona(TEMPLATE_KEYS[Math.floor(Math.random() * TEMPLATE_KEYS.length)]),
        real: { name: 'Demo Visitor', role: 'Hackathon judge', bio: 'Fictional demo identity.', linkedin: '' },
        tags: { skills: ['Strategy'], interests: ['AI', 'Climate', 'Design'], goals: ['Find cofounder'] },
        settings: { discoverable: true, showInGraph: true },
      }))
      if (live) { setMe(m); nav(`${base}/discover`, { replace: true }) }
    })()
    return () => { live = false }
  }, [source, setMe, nav, base])
  return <Loading />
}

function Gate({ children }: { children: ReactNode }) {
  const { me, ready, base } = useWorkspace()
  if (!ready) return <Loading />
  if (!me) return <Navigate to={entry(base)} replace />
  return <>{children}</>
}

function WorkspaceRoutes() {
  const { me, ready, base } = useWorkspace()
  if (!ready) return <Loading />
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="onboarding" element={<Onboarding />} />
        {base === '/demo' && <Route path="start" element={<DemoStart />} />}
        <Route element={<Gate><Shell /></Gate>}>
          <Route path="discover" element={<Discover />} />
          <Route path="network" element={<Network />} />
          <Route path="matches" element={<Matches />} />
          <Route path="intros" element={<Intros />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="chat/:otherId" element={<Chat />} />
        </Route>
        <Route path="*" element={<Navigate to={me ? `${base}/discover` : entry(base)} replace />} />
      </Routes>
    </Suspense>
  )
}

function DemoApp() {
  const source = useMemo(() => createDemoSource(), [])
  return <WorkspaceProvider source={source} base="/demo"><WorkspaceRoutes /></WorkspaceProvider>
}

function LiveApp() {
  const { session, loading } = useAuth()
  const uid = session?.user.id
  const source = useMemo(() => (uid ? createLiveSource(uid) : null), [uid])
  if (loading) return <Loading />
  if (!liveConfigured || !source || !uid) return <Navigate to="/auth" replace />
  return <WorkspaceProvider key={uid} source={source} base="/app"><WorkspaceRoutes /></WorkspaceProvider>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/demo/*" element={<DemoApp />} />
      <Route path="/app/*" element={<LiveApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
