// Optional UI sounds via WebAudio. Off by default; only plays after the user enables it.
const KEY = 'fishnet.sound'
let ctx: AudioContext | null = null
export const soundEnabled = () => { try { return localStorage.getItem(KEY) === '1' } catch { return false } }
export const setSound = (on: boolean) => { try { localStorage.setItem(KEY, on ? '1' : '0') } catch { /* ignore */ } }

export function blip(freq = 520, dur = 0.09, gain = 0.04) {
  if (!soundEnabled()) return
  try {
    ctx ??= new AudioContext()
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.type = 'sine'; o.frequency.value = freq
    g.gain.setValueAtTime(gain, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
    o.connect(g).connect(ctx.destination)
    o.start(); o.stop(ctx.currentTime + dur)
  } catch { /* audio unavailable */ }
}
export const matchChime = () => { blip(520, 0.12); setTimeout(() => blip(780, 0.2), 110) }
