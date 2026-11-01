import { useEffect, useState } from 'react'
import { useWorkspace } from '../workspace'

/** Returns a function mapping a persona name to the person's real name once they have revealed to you. */
export function useRevealedNames() {
  const { source, version } = useWorkspace()
  const [names, setNames] = useState<Map<string, string>>(new Map())
  useEffect(() => {
    let live = true
    source.connections()
      .then((cs) => { if (live) setNames(new Map(cs.filter((c) => c.reveal === 'revealed' && c.identity).map((c) => [c.persona.name, c.identity!.name]))) })
      .catch(() => { /* names fall back to personas */ })
    return () => { live = false }
  }, [source, version])
  return (personaName: string) => names.get(personaName) ?? personaName
}
