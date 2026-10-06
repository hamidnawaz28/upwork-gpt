// Renders the Chrome Web Store images from store-assets/src/scene.html.
//
//   node store-assets/render.mjs
//
// Needs Google Chrome installed, and `sharp`, which is borrowed from the site's
// node_modules (run `npm install` in site/ first). Output goes to store-assets/.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const sharp = createRequire(join(here, '../site/package.json'))('sharp')

const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((path) => path && existsSync(path))
if (!CHROME) throw new Error('Chrome not found. Set CHROME_PATH to its executable.')

// The Web Store wants exact sizes and no transparency.
const IMAGES = [
  { scene: 'hero', file: 'screenshot-1-hero.png', width: 1280, height: 800 },
  { scene: 'controls', file: 'screenshot-2-tone-and-length.png', width: 1280, height: 800 },
  { scene: 'answers', file: 'screenshot-3-screening-answers.png', width: 1280, height: 800 },
  { scene: 'profiles', file: 'screenshot-4-profiles.png', width: 1280, height: 800 },
  { scene: 'pricing', file: 'screenshot-5-pricing.png', width: 1280, height: 800 },
  { scene: 'tile', file: 'small-promo-tile-440x280.png', width: 440, height: 280 },
  { scene: 'marquee', file: 'marquee-promo-tile-1400x560.png', width: 1400, height: 560 },
]

const page = pathToFileURL(join(here, 'src/scene.html')).href
const work = mkdtempSync(join(tmpdir(), 'copalat-store-'))

for (const { scene, file, width, height } of IMAGES) {
  const raw = join(work, `${scene}.png`)
  // The window is taller than needed and the picture is cropped afterwards, because
  // headless Chrome's viewport is not always exactly the requested window size.
  execFileSync(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--allow-file-access-from-files',
      `--window-size=${width},${height + 200}`,
      '--virtual-time-budget=8000',
      `--screenshot=${raw}`,
      `${page}?scene=${scene}`,
    ],
    { stdio: 'ignore' },
  )
  await sharp(raw)
    .extract({ left: 0, top: 0, width, height })
    .flatten({ background: '#06110f' })
    .removeAlpha()
    .png()
    .toFile(join(here, file))
  console.log(`${file}  ${width}x${height}`)
}

// Store icon: 96px artwork centred in a 128px canvas with a transparent margin, as the
// Web Store's image guidelines ask.
const logo = join(here, '../site/public/logo.svg')
await sharp(logo, { density: 1200 })
  .resize(96, 96)
  .extend({ top: 16, bottom: 16, left: 16, right: 16, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(join(here, 'store-icon-128.png'))
console.log('store-icon-128.png  128x128')

rmSync(work, { recursive: true, force: true })
