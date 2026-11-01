// Tactile UI sounds, synthesized with WebAudio (no assets). Off by default; only plays after the user turns it on.
const KEY = 'fishnet.sound'
let ctx: AudioContext | null = null
let bus: { dry: GainNode; wet: GainNode } | null = null

export const soundEnabled = () => { try { return localStorage.getItem(KEY) === '1' } catch { return false } }
export const setSound = (on: boolean) => { try { localStorage.setItem(KEY, on ? '1' : '0') } catch { /* ignore */ } if (on) setTimeout(() => sfx.on(), 30) }

function ac(): AudioContext | null {
  if (!soundEnabled()) return null
  try {
    if (!ctx) {
      ctx = new AudioContext()
      const master = ctx.createGain(); master.gain.value = 0.9
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000
      master.connect(lp).connect(ctx.destination)
      const dry = ctx.createGain(); dry.connect(master)
      // soft "air": a short feedback delay that gives chimes a gentle tail
      const wet = ctx.createGain(); wet.gain.value = 0.28
      const d = ctx.createDelay(); d.delayTime.value = 0.16
      const fb = ctx.createGain(); fb.gain.value = 0.34
      const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 3200
      wet.connect(d); d.connect(tone); tone.connect(fb); fb.connect(d); tone.connect(master)
      bus = { dry, wet }
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch { return null }
}

interface ToneOpts { type?: OscillatorType; vol?: number; glide?: number; attack?: number; wet?: number; pan?: number; at?: number }
function tone(freq: number, dur: number, o: ToneOpts = {}) {
  const a = ac(); if (!a || !bus) return
  const t = a.currentTime + (o.at ?? 0)
  const osc = a.createOscillator(), g = a.createGain()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(freq, t)
  if (o.glide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.glide), t + dur)
  const v = o.vol ?? 0.08, at = o.attack ?? 0.005
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + at); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  let out: AudioNode = g
  if (o.pan) { const p = a.createStereoPanner(); p.pan.value = o.pan; g.connect(p); out = p }
  osc.connect(g); out.connect(bus.dry)
  if (o.wet) { const w = a.createGain(); w.gain.value = o.wet; out.connect(w); w.connect(bus.wet) }
  osc.start(t); osc.stop(t + dur + 0.05)
}

function noise(dur: number, o: { freq: number; to?: number; q?: number; type?: BiquadFilterType; vol?: number; pan?: number; at?: number } ) {
  const a = ac(); if (!a || !bus) return
  const t = a.currentTime + (o.at ?? 0)
  const len = Math.floor(a.sampleRate * dur)
  const buf = a.createBuffer(1, len, a.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = a.createBufferSource(); src.buffer = buf
  const f = a.createBiquadFilter(); f.type = o.type ?? 'bandpass'; f.Q.value = o.q ?? 1.2
  f.frequency.setValueAtTime(o.freq, t); if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur)
  const g = a.createGain(); g.gain.setValueAtTime(o.vol ?? 0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(f).connect(g)
  if (o.pan) { const p = a.createStereoPanner(); p.pan.value = o.pan; g.connect(p); p.connect(bus.dry) } else g.connect(bus.dry)
  src.start(t)
}

const N = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, E6: 1318.5, G6: 1568, C4: 261.63 }

const jit = () => 1 + (Math.random() - 0.5) * 0.18
function keyStroke(kind: 'key' | 'space' | 'enter' | 'back', vel: number) {
  const deep = kind === 'space' ? 0.78 : kind === 'enter' ? 0.68 : kind === 'back' ? 1.1 : 1
  const v = vel * (0.85 + Math.random() * 0.3)
  // top-end click: the switch actuating
  noise(0.012, { freq: 4300 * jit(), type: 'highpass', q: 0.7, vol: 0.05 * v })
  tone(3100 * jit(), 0.014, { type: 'square', vol: 0.012 * v, attack: 0.001 })
  // body: plate and case thock
  tone(150 * deep * jit(), 0.07, { glide: 70 * deep, vol: 0.11 * v, attack: 0.002 })
  noise(0.04, { freq: 1500 * deep * jit(), q: 1.6, vol: 0.035 * v, at: 0.004 })
  if (kind === 'enter' || kind === 'space') tone(95 * jit(), 0.12, { glide: 55, vol: 0.07 * v, at: 0.01, attack: 0.003 })
}

export const sfx = {
  /** Mechanical-keyboard "clack" for any button press: a crisp top-end click over a creamy low thock. */
  tap() { keyStroke('key', 1.15) },
  /** Lighter key for chips, toggles and selections. */
  tick() { keyStroke('key', 0.7) },
  /** Typing in a text field. */
  key(kind: 'key' | 'space' | 'enter' | 'back' = 'key') { keyStroke(kind, 1) },
  whoosh(dir: 'like' | 'pass') { noise(0.2, { freq: dir === 'like' ? 500 : 2400, to: dir === 'like' ? 2600 : 450, q: 0.9, vol: 0.06, pan: dir === 'like' ? 0.5 : -0.5 }) },
  like() { sfx.whoosh('like'); tone(N.E5, 0.22, { vol: 0.07, wet: 0.5, at: 0.04 }); tone(N.B5, 0.3, { vol: 0.06, wet: 0.6, at: 0.1 }) },
  pass() { sfx.whoosh('pass'); tone(300, 0.14, { glide: 170, vol: 0.07, at: 0.03, wet: 0.15 }) },
  match() {
    ;[N.C5, N.E5, N.G5, N.C6, N.E6].forEach((f, i) => tone(f, 0.7, { type: 'triangle', vol: 0.07, wet: 0.7, at: i * 0.075 }))
    tone(N.C4, 1.2, { vol: 0.05, attack: 0.06, wet: 0.4 }); tone(N.G5 / 2, 1.2, { vol: 0.035, attack: 0.08, wet: 0.4 })
  },
  send() { tone(520, 0.09, { glide: 840, vol: 0.06, wet: 0.25 }) },
  receive() { tone(N.G5, 0.22, { vol: 0.05, wet: 0.5 }); tone(N.C6, 0.32, { vol: 0.045, wet: 0.6, at: 0.09 }) },
  notify() { tone(N.A5, 0.18, { vol: 0.04, wet: 0.4 }); tone(N.E6, 0.26, { vol: 0.035, wet: 0.5, at: 0.08 }) },
  error() { tone(150, 0.2, { glide: 90, vol: 0.09, type: 'triangle' }) },
  on() { tone(N.G5, 0.18, { vol: 0.06, wet: 0.5 }); tone(N.C6, 0.3, { vol: 0.055, wet: 0.6, at: 0.1 }) },
  /** A rising tension swell that lands with the dings. */
  roll(sec: number) {
    let t = 0, gap = 0.15, i = 0
    while (t < sec) {
      tone(140, 0.09, { glide: 60, vol: 0.05 + 0.11 * Math.min(1, i / 30), type: 'triangle', at: t, attack: 0.002 })
      noise(0.05, { freq: 900, q: 0.8, vol: 0.02 + 0.03 * Math.min(1, i / 30), at: t })
      gap = Math.max(0.035, gap * 0.93); t += gap; i++
    }
    noise(sec, { freq: 300, to: 5200, q: 0.6, vol: 0.05 })
  },
  dings(count = 3) {
    for (let n = 0; n < count; n++) for (const [m, v] of [[1, 0.09], [2.76, 0.035], [5.4, 0.015]] as const) tone(1318.5 * m, 0.9, { vol: v, wet: 0.5, at: n * 0.22, attack: 0.002 })
  },
}

// Backwards-compatible names used across the app.
export const blip = (freq = 520, dur = 0.09, vol = 0.04) => tone(freq, dur, { vol, wet: 0.2 })
export const matchChime = () => sfx.match()
export const drumRoll = (sec: number) => sfx.roll(sec)
export const dings = (count = 3) => sfx.dings(count)

/** Plays a soft tap for every enabled button / link / switch press, app-wide. */
export function installGlobalTapSound() {
  document.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement | null
    if (e.repeat || e.metaKey || e.ctrlKey || !t || !/^(INPUT|TEXTAREA)$/.test(t.tagName)) return
    if (e.key === 'Enter') sfx.key('enter')
    else if (e.key === ' ') sfx.key('space')
    else if (e.key === 'Backspace' || e.key === 'Delete') sfx.key('back')
    else if (e.key.length === 1) sfx.key('key')
  }, { capture: true, passive: true })
  document.addEventListener('pointerdown', (e) => {
    const el = (e.target as HTMLElement | null)?.closest?.('button, a, [role="switch"]') as HTMLButtonElement | null
    if (!el || el.disabled || el.dataset.silent !== undefined) return
    sfx.tap()
  }, { capture: true, passive: true })
}
