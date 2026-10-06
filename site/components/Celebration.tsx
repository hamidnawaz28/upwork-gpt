// Balloons that float up and confetti that falls, once, when the welcome page opens.
// Pure CSS animation: no script, hidden from assistive technology, and switched off for
// people who ask their system for reduced motion.

const COLORS = ['#14b8a6', '#6366f1', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#3b82f6']

// Fixed values rather than Math.random(), so the server and the browser render the same thing.
const BALLOONS = [
  { left: 6, size: 64, delay: 0, duration: 7.5, sway: 26 },
  { left: 17, size: 48, delay: 0.9, duration: 8.6, sway: -20 },
  { left: 29, size: 72, delay: 0.3, duration: 7.0, sway: 18 },
  { left: 41, size: 52, delay: 1.4, duration: 9.0, sway: -28 },
  { left: 55, size: 60, delay: 0.6, duration: 7.8, sway: 22 },
  { left: 67, size: 46, delay: 1.8, duration: 8.8, sway: -16 },
  { left: 78, size: 70, delay: 0.2, duration: 7.2, sway: 24 },
  { left: 90, size: 54, delay: 1.1, duration: 8.2, sway: -22 },
]

const CONFETTI = Array.from({ length: 44 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  delay: ((i * 13) % 24) / 10,
  duration: 3.4 + ((i * 7) % 20) / 10,
  drift: ((i * 29) % 160) - 80,
  spin: 360 + ((i * 53) % 720),
  width: 7 + (i % 4) * 2,
  height: 10 + (i % 3) * 4,
  round: i % 5 === 0,
}))

export function Celebration() {
  return (
    <div className="celebration" aria-hidden="true">
      {BALLOONS.map((balloon, i) => (
        <span
          key={`b${i}`}
          className="balloon"
          style={
            {
              left: `${balloon.left}%`,
              '--size': `${balloon.size}px`,
              '--color': COLORS[i % COLORS.length],
              '--sway': `${balloon.sway}px`,
              animationDelay: `${balloon.delay}s`,
              animationDuration: `${balloon.duration}s`,
            } as React.CSSProperties
          }
        />
      ))}
      {CONFETTI.map((piece, i) => (
        <span
          key={`c${i}`}
          className="confetti"
          style={
            {
              left: `${piece.left}%`,
              width: piece.width,
              height: piece.round ? piece.width : piece.height,
              borderRadius: piece.round ? '50%' : 2,
              background: COLORS[(i * 3) % COLORS.length],
              '--drift': `${piece.drift}px`,
              '--spin': `${piece.spin}deg`,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
