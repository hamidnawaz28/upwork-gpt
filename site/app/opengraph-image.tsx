import { ImageResponse } from 'next/og'
import { site } from '@/lib/site'

// Preview picture shown when the site is shared on social media and in chats.
export const alt = site.title
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: 'linear-gradient(135deg, #f3f8f6 0%, #dff3ee 100%)',
          color: '#10201c',
        }}
      >
        <div style={{ fontSize: 38, fontWeight: 700, color: '#0f766e' }}>{site.name}</div>
        <div style={{ marginTop: 24, fontSize: 76, fontWeight: 800, lineHeight: 1.1, letterSpacing: -2 }}>
          Write Upwork proposals that get opened, in seconds.
        </div>
        <div style={{ marginTop: 32, fontSize: 32, color: '#5b6b66' }}>
          {`AI cover letter generator for Chrome · ${site.freeProposals} proposals free`}
        </div>
      </div>
    ),
    size,
  )
}
