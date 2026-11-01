import { lazy, Suspense, useMemo, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
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

const Network = lazy(() => import('./pages/Network'))
const Loading = () => <div className="grid h-full place-items-center text-mute" role="status">Loading…</div>

function Gate({ children }: { children: ReactNode }) {
  const { me, ready, base } = useWorkspace()
  if (!ready) return <Loading />
  if (!me) return <Navigate to={`${base}/onboarding`} replace />
  return <>{children}</>
}

function WorkspaceRoutes() {
  const { me, ready, base } = useWorkspace()
  if (!ready) return <Loading />
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="onboarding" element={<Onboarding />} />
        <Route element={<Gate><Shell /></Gate>}>
          <Route path="discover" element={<Discover />} />
          <Route path="network" element={<Network />} />
          <Route path="matches" element={<Matches />} />
          <Route path="intros" element={<Intros />} />
          <Route path="inbox" element={<Inbox />} />
        </Route>
        <Route path="*" element={<Navigate to={me ? `${base}/discover` : `${base}/onboarding`} replace />} />
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
