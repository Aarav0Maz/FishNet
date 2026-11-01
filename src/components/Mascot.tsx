import { motion, useReducedMotion } from 'motion/react'

export type Mood = 'smug' | 'happy' | 'sleepy' | 'shades'

/** Vector fish mascot. Swap for a provided asset by dropping public/mascot.png and setting USE_IMAGE. */
export function Mascot({ size = 140, mood = 'smug', float = true }: { size?: number; mood?: Mood; float?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="FishNet fish mascot"
      animate={float && !reduce ? { y: [0, -6, 0], rotate: [-1.5, 1.5, -1.5] } : undefined}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <linearGradient id="fb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#C9A7FF" /><stop offset="1" stopColor="#995CFF" /></linearGradient>
        <radialGradient id="glow"><stop offset="0" stopColor="#995CFF" stopOpacity=".35" /><stop offset="1" stopColor="#995CFF" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="100" cy="100" r="95" fill="url(#glow)" />
      {/* tail */}
      <path d="M150 100 C168 78 182 70 190 62 C186 88 186 112 190 138 C182 130 168 122 150 100Z" fill="#995CFF" />
      {/* fins */}
      <path d="M92 52 C100 30 120 28 130 40 C116 42 106 48 100 58Z" fill="#F3B4DE" />
      <path d="M96 138 C104 158 122 162 132 152 C120 150 110 144 106 134Z" fill="#F3B4DE" />
      {/* body */}
      <path d="M20 100 C20 62 58 42 98 44 C132 46 156 72 156 100 C156 128 132 154 98 156 C58 158 20 138 20 100Z" fill="url(#fb)" />
      <path d="M40 112 C70 132 110 136 142 116 C130 140 98 152 66 146 C50 142 42 130 40 112Z" fill="#F7F4FF" opacity=".28" />
      {/* eye */}
      {mood === 'shades' ? (
        <g><rect x="44" y="76" width="64" height="24" rx="12" fill="#0B0912" /><path d="M52 84h22" stroke="#995CFF" strokeWidth="3" strokeLinecap="round" /></g>
      ) : mood === 'sleepy' ? (
        <path d="M54 88 Q68 98 82 88" stroke="#0B0912" strokeWidth="5" fill="none" strokeLinecap="round" />
      ) : (
        <g>
          <circle cx="68" cy="86" r="16" fill="#F7F4FF" />
          <circle cx="72" cy="88" r="8" fill="#0B0912" />
          <circle cx="75" cy="85" r="2.5" fill="#F7F4FF" />
          {mood === 'smug' && <path d="M50 80 Q68 66 86 78 L86 72 Q68 62 50 74Z" fill="#995CFF" stroke="#0B0912" strokeWidth="3" strokeLinejoin="round" />}
        </g>
      )}
      {/* smirk */}
      {mood === 'happy' ? (
        <path d="M48 120 Q74 142 100 118" stroke="#0B0912" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M46 122 Q70 130 96 116 L102 108" stroke="#0B0912" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      )}
      <circle cx="104" cy="104" r="7" fill="#F3B4DE" opacity=".55" />
      {/* bubbles */}
      <circle cx="16" cy="70" r="4" fill="none" stroke="#C9A7FF" strokeWidth="2" opacity=".7" />
      <circle cx="8" cy="52" r="2.5" fill="none" stroke="#C9A7FF" strokeWidth="2" opacity=".5" />
    </motion.svg>
  )
}
