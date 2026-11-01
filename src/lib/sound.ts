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

function audio(): AudioContext | null {
  if (!soundEnabled()) return null
  try { ctx ??= new AudioContext(); void ctx.resume(); return ctx } catch { return null }
}

/** Accelerating drum roll for `sec` seconds. No-op unless the user enabled sound. */
export function drumRoll(sec: number) {
  const a = audio()
  if (!a) return
  let t = a.currentTime, gap = 0.14, i = 0
  const end = t + sec
  while (t < end) {
    const o = a.createOscillator(), g = a.createGain()
    o.type = 'triangle'
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.07)
    const vol = 0.05 + 0.1 * Math.min(1, i / 28)
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + 0.1)
    gap = Math.max(0.035, gap * 0.93); t += gap; i++
  }
}

/** Bright "ding" repeated `count` times. */
export function dings(count = 3) {
  const a = audio()
  if (!a) return
  for (let n = 0; n < count; n++) {
    const t = a.currentTime + n * 0.22
    for (const f of [1318, 1976]) {
      const o = a.createOscillator(), g = a.createGain()
      o.type = 'sine'; o.frequency.value = f
      g.gain.setValueAtTime(f === 1318 ? 0.09 : 0.04, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7)
      o.connect(g).connect(a.destination); o.start(t); o.stop(t + 0.75)
    }
  }
}
