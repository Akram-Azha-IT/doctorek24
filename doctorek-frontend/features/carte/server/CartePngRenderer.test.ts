import { describe, expect, test } from 'vitest'
import {
  composeCarteExportSvg,
  renderCarteExportPng,
  renderSvgToPng,
} from './CartePngRenderer'
import { buildWalletHeroSvg } from '../components/CarteVirtuelleExport'

const CARD = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 856 540">
    <rect width="856" height="540" rx="24" fill="#007DFF"/>
    <text x="40" y="80" font-size="32" fill="#FFFFFF">Doctorek</text>
  </svg>
`

function expectPng(buffer: Buffer) {
  expect(buffer.subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  )
}

describe('CartePngRenderer', () => {
  test('compose le recto et le verso dans le même document', () => {
    const svg = composeCarteExportSvg(CARD, CARD)

    expect(svg).toContain('viewBox="0 0 936 1200"')
    expect(svg).toContain('translate(40 40)')
    expect(svg).toContain('translate(40 620)')
    expect(svg).toContain('width="856" height="540"')
  })

  test('convertit un SVG en PNG sans navigateur', () => {
    expectPng(renderSvgToPng(CARD, 856))
  })

  test('produit l’export haute définition recto-verso', () => {
    expectPng(renderCarteExportPng(CARD, CARD))
  })

  test('produit aussi la bannière Google Wallet sans navigateur', () => {
    const heroSvg = buildWalletHeroSvg({
      fullName: 'Akram BENHAMMOU',
      maskedCin: 'A******6',
      cnss: 'CNSS-42',
      cardRef: 'VMC-2026-ABC',
      origin: 'https://doctorek.ma',
      logoDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLJ7wAAAABJRU5ErkJggg==',
    })

    expectPng(renderSvgToPng(heroSvg, 1032))
  })
})
