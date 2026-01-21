/**
 * Generate PWA icons for Night Whispers
 *
 * Creates gothic-themed icons with crimson moon on dark background.
 * Run with: node scripts/generate-icons.js
 */

import { createCanvas } from 'canvas'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DARK_BG = '#141517' // dark.8 from Mantine
const CRIMSON = '#c92a2a' // Primary crimson color

/**
 * Generate a single icon with the Night Whispers moon design
 */
function generateIcon(size, filename) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Dark background
  ctx.fillStyle = DARK_BG
  ctx.fillRect(0, 0, size, size)

  // Crimson circle (full moon)
  ctx.fillStyle = CRIMSON
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size * 0.35, 0, Math.PI * 2)
  ctx.fill()

  // Dark crescent cutout (creates moon shape)
  ctx.fillStyle = DARK_BG
  ctx.beginPath()
  ctx.arc(size / 2 + size * 0.15, size / 2, size * 0.25, 0, Math.PI * 2)
  ctx.fill()

  const buffer = canvas.toBuffer('image/png')
  const outputPath = path.join(__dirname, '..', 'public', filename)
  fs.writeFileSync(outputPath, buffer)
  console.log(`Created: ${filename} (${size}x${size})`)
}

/**
 * Generate ICO file (simple single-size PNG renamed - browsers accept PNG as ICO)
 */
function generateFavicon(size, filename) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Dark background
  ctx.fillStyle = DARK_BG
  ctx.fillRect(0, 0, size, size)

  // Crimson circle (full moon)
  ctx.fillStyle = CRIMSON
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size * 0.35, 0, Math.PI * 2)
  ctx.fill()

  // Dark crescent cutout
  ctx.fillStyle = DARK_BG
  ctx.beginPath()
  ctx.arc(size / 2 + size * 0.15, size / 2, size * 0.25, 0, Math.PI * 2)
  ctx.fill()

  // ICO format - for simplicity we'll use PNG which most browsers accept
  // A true .ico would need additional libraries
  const buffer = canvas.toBuffer('image/png')
  const outputPath = path.join(__dirname, '..', 'public', filename)
  fs.writeFileSync(outputPath, buffer)
  console.log(`Created: ${filename} (${size}x${size} PNG)`)
}

// Ensure public directory exists
const publicDir = path.join(__dirname, '..', 'public')
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

// Generate all icons
console.log('Generating PWA icons...')
generateIcon(192, 'pwa-192x192.png')
generateIcon(512, 'pwa-512x512.png')
generateIcon(180, 'apple-touch-icon.png')
generateFavicon(32, 'favicon.ico')
console.log('Done!')
