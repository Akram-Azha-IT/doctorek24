import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import puppeteer from 'puppeteer'
import QRCode from 'qrcode'
import { renderCarteRectoHtml, renderCarteVersoHtml } from '@/features/carte/components/CarteVirtuelleExport'

export async function POST(req: Request) {
  try {
    const { carte, profile, firstName, lastName } = await req.json()

    if (!carte) {
      return NextResponse.json({ error: 'Carte data is required' }, { status: 400 })
    }

    const origin = new URL(req.url).origin
    const qrUrl = carte.cardRef ? `${origin}/carte/${carte.cardRef}` : undefined
    const qrDataUrl = qrUrl
      ? await QRCode.toDataURL(qrUrl, { width: 168, margin: 1, color: { dark: '#010C2D', light: '#FFFFFF' } })
      : undefined

    // Le conteneur ne peut pas recharger son propre domaine public (hairpin NAT) —
    // on inline le logo depuis le disque.
    const logoBuffer = await readFile(path.join(process.cwd(), 'public', 'logo0.png'))
    const logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`

    const renderOptions = { origin, qrDataUrl, logoDataUrl }
    const rectoHtml = renderCarteRectoHtml(carte, profile, firstName, lastName, renderOptions)
    const versoHtml = renderCarteVersoHtml(carte, profile, firstName, lastName, renderOptions)

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              margin: 0;
              padding: 40px;
              background: #010C2D;
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              gap: 40px;
              align-items: center;
              justify-content: center;
              width: fit-content;
            }
            .card-container {
              position: relative;
              width: 856px;
              height: 540px;
            }
          </style>
        </head>
        <body>
          <div class="card-container">
            ${rectoHtml}
          </div>
          <div class="card-container">
            ${versoHtml}
          </div>
        </body>
      </html>
    `

    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
    })

    const page = await browser.newPage()

    // Set a high deviceScaleFactor for retina-quality rendering
    await page.setViewport({ width: 936, height: 1180, deviceScaleFactor: 2 })

    // Set HTML content and wait for network/fonts
    // Tout est inliné (logo/QR en data URI, polices système) — aucun réseau à attendre.
    await page.setContent(fullHtml, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 300))

    // Capture the screenshot
    const buffer = await page.screenshot({ type: 'png', omitBackground: false })

    await browser.close()

    // Return the image
    return new NextResponse(buffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        // Force cache invalidation
        'Content-Disposition': `attachment; filename="carte-medicale-${carte.cardRef || 'doctorek'}.png"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to generate carte' }, { status: 500 })
  }
}
