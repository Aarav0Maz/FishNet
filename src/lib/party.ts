/** Party codes are short, lowercase, URL-safe. Empty means "no party". */
export const normalizeParty = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24)
export const validParty = (s: string) => s === '' || /^[a-z0-9-]{2,24}$/.test(s)

const KEY = 'fishnet.party'
export const invitedParty = () => { try { return localStorage.getItem(KEY) ?? '' } catch { return '' } }
/** Remember a party code from an invite link (?party=CODE) until the user finishes onboarding. */
export function captureInvite() {
  try { const p = normalizeParty(new URLSearchParams(window.location.search).get('party') ?? ''); if (validParty(p) && p) localStorage.setItem(KEY, p) } catch { /* ignore */ }
}
