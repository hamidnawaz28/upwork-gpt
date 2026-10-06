// Small stroke icons, drawn on a 24px grid. Decorative unless a label is passed.
const PATHS = {
  sparkles:
    'M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15zM5 15l.7 1.6L7.3 17.3 5.7 18 5 19.6 4.3 18 2.7 17.3l1.6-.7L5 15z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6L6 18',
  shield: 'M12 3l7 3v5.5c0 4.3-2.9 8.2-7 9.5-4.1-1.3-7-5.2-7-9.5V6l7-3zM9 12l2.2 2.2L15 10.4',
  question:
    'M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H11l-4.5 4v-4h-1A1.5 1.5 0 0 1 4 14.5v-9zM9.8 8.6a2.3 2.3 0 1 1 3.3 2.1c-.7.3-1.1.8-1.1 1.4M12 14.3v.1',
  cursor: 'M5 4l5.5 15 2.2-6.3L19 10.5 5 4zM14 14l5 5',
  sliders: 'M4 7h10M18 7h2M4 17h4M12 17h8M14 5v4M8 15v4M4 12h16',
  history: 'M4 12a8 8 0 1 0 2.6-5.9M4 5v4h4M12 8v4.5l3 1.8',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
  lock: 'M6.5 11V8a5.5 5.5 0 0 1 11 0v3M5 11h14v9H5v-9zM12 15v2',
  bolt: 'M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}

// Chrome's four-colour mark, for the install buttons.
export function ChromeMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#fff" />
      <path d="M12 2a10 10 0 0 1 8.66 5H12a5 5 0 0 0-4.33 2.5L4.2 5.8A10 10 0 0 1 12 2z" fill="#ea4335" />
      <path d="M20.66 7A10 10 0 0 1 12.9 21.96L16.33 14.5A5 5 0 0 0 16 7h4.66z" fill="#fbbc04" />
      <path d="M12.9 21.96A10 10 0 0 1 4.2 5.8l3.47 6.7A5 5 0 0 0 12 17a5 5 0 0 0 1.6-.26l-.7 5.22z" fill="#34a853" />
      <circle cx="12" cy="12" r="3.6" fill="#4285f4" stroke="#fff" strokeWidth="1.2" />
    </svg>
  )
}
