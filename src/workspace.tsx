import { createContext, useRef, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { DataSource, MyProfile, Notice } from './types'
import { sfx } from './lib/sound'

interface WS {
  source: DataSource
  base: string
  me: MyProfile | null
  ready: boolean
  setMe: (m: MyProfile) => void
  notices: Notice[]
  unread: number
  refreshNotices: () => Promise<void>
  version: number
  bump: () => void
}
const Ctx = createContext<WS | null>(null)
export const useWorkspace = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('useWorkspace outside provider')
  return v
}

export function WorkspaceProvider({ source, base, children }: { source: DataSource; base: string; children: ReactNode }) {
  const [me, setMe] = useState<MyProfile | null>(null)
  const [ready, setReady] = useState(false)
  const [notices, setNotices] = useState<Notice[]>([])
  const [version, setVersion] = useState(0)
  const knownIds = useRef<Set<string> | null>(null)
  const bump = useCallback(() => setVersion((v) => v + 1), [])

  const refreshNotices = useCallback(async () => {
    try {
      const list = await source.notices()
      if (knownIds.current) {
        const fresh = list.filter((n) => !n.read && n.kind !== 'match' && !knownIds.current!.has(n.id))
        if (fresh.length) { if (fresh.some((n) => n.kind === 'message')) sfx.receive(); else sfx.notify() }
      }
      knownIds.current = new Set(list.map((n) => n.id))
      setNotices(list)
    } catch { /* transient; next event retries */ }
  }, [source])

  useEffect(() => {
    let live = true
    source.getMe().then((m) => { if (live) { setMe(m); setReady(true) } }).catch(() => live && setReady(true))
    return () => { live = false }
  }, [source])

  useEffect(() => {
    if (!me) return
    void refreshNotices()
    const off = source.subscribe?.(() => { void refreshNotices(); bump() })
    return () => off?.()
  }, [me, source, refreshNotices, bump])

  const value = useMemo<WS>(() => ({ source, base, me, ready, setMe, notices, unread: notices.filter((n) => !n.read).length, refreshNotices, version, bump }), [source, base, me, ready, notices, refreshNotices, version, bump])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
