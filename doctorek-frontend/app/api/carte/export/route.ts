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

    // Derrière le proxy, req.url = adresse interne du conteneur (0.0.0.0:3000) —
    // le QR doit pointer vers le domaine public.
    const origin = process.env.AUTH_URL ?? new URL(req.url).origin
    const qrUrl = carte.cardRef ? `${origin}/carte/${carte.cardRef}` : undefined
    const qrDataUrl = qrUrl
      ? await QRCode.toDataURL(qrUrl, { width: 168, margin: 1, color: { dark: '#010C2D', light: '#FFFFFF' } })
      : undefined

    // Le conteneur ne peut pas recharger son propre domaine public (hairpin NAT) —
    // on inline le logo depuis le disque.
    const logoBuffer = await readFile(path.join(process.cwd(), 'public', 'logo0.png'))
    const logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`

    // La photo du patient peut être une URL externe (avatar Google) : le rendu
    // n'attend plus le réseau, donc on l'inline en data URI côté serveur.
    let photoDataUrl: string | undefined = profile?.photoUrl ?? undefined
    if (photoDataUrl && !photoDataUrl.startsWith('data:')) {
      try {
        const resp = await fetch(photoDataUrl, { signal: AbortSignal.timeout(8000) })
        if (resp.ok) {
          const buf = Buffer.from(await resp.arrayBuffer())
          const ct = resp.headers.get('content-type') ?? 'image/jpeg'
          photoDataUrl = `data:${ct};base64,${buf.toString('base64')}`
        } else {
          photoDataUrl = undefined
        }
      } catch {
        photoDataUrl = undefined // silhouette de repli
      }
    }
    const profileInline = profile ? { ...profile, photoUrl: photoDataUrl ?? null } : profile

    const renderOptions = { origin, qrDataUrl, logoDataUrl }
    const rectoHtml = renderCarteRectoHtml(carte, profileInline, firstName, lastName, renderOptions)
    const versoHtml = renderCarteVersoHtml(carte, profileInline, firstName, lastName, renderOptions)

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Noto+Sans+Arabic:wght@400;700;800&display=swap" rel="stylesheet">
          <style>
            /* La carte lit --font-outfit (fourni par next/font dans l'app) : on le
               définit ici pour que le PNG exporté ait la même typographie que l'écran. */
            :root { --font-outfit: 'Outfit'; }
            body {
              margin: 0;
              padding: 40px;
              background: #FFFFFF;
              font-family: 'Outfit', system-ui, -apple-system, sans-serif;
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

    // Logo/QR/photo sont inlinés en data URI ; seules les polices viennent du réseau.
    await page.setContent(fullHtml, { waitUntil: 'domcontentloaded', timeout: 30000 })
    // On attend le chargement effectif des polices, sinon le PNG sort en repli système.
    // Sans réseau, document.fonts.ready se résout quand même : le rendu dégrade sans bloquer.
    await page.evaluate(() => document.fonts.ready).catch(() => {})
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
