import { stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const assets = [
  {
    input: 'public/hero-doctorek.png',
    output: 'public/hero-doctorek.webp',
    width: 960,
    quality: 72,
  },
  {
    input: 'public/agent-doctor-youssef-v1.png',
    output: 'public/agent-doctor-youssef-v1.webp',
    width: 512,
    quality: 72,
  },
  {
    input: 'public/wallet-hero-global-care.png',
    output: 'public/wallet-hero-global-care.webp',
    width: 640,
    quality: 72,
  },
  {
    input: 'public/illustrations/free-day-calendar.png',
    output: 'public/illustrations/free-day-calendar.webp',
    width: 512,
    quality: 70,
  },
  {
    input: 'public/illustrations/resilient-empty-v1.png',
    output: 'public/illustrations/resilient-empty-v1.webp',
    width: 416,
    quality: 70,
  },
  {
    input: 'public/illustrations/resilient-recovery-v1.png',
    output: 'public/illustrations/resilient-recovery-v1.webp',
    width: 416,
    quality: 70,
  },
]

for (const asset of assets) {
  const input = resolve(projectRoot, asset.input)
  const output = resolve(projectRoot, asset.output)

  await sharp(input)
    .rotate()
    .resize({ width: asset.width, fit: 'inside', withoutEnlargement: true })
    .webp({
      quality: asset.quality,
      alphaQuality: 90,
      effort: 5,
      smartSubsample: true,
    })
    .toFile(output)

  const { size } = await stat(output)
  console.log(`${asset.output}: ${(size / 1024).toFixed(1)} KiB`)
}
