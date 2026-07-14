import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import puppeteer from 'puppeteer'
import QRCode from 'qrcode'
import { renderWalletHeroHtml } from '@/features/carte/components/CarteVirtuelleExport'
import { verifyWalletHeroSignature } from '@/lib/walletHeroSignature'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const cardRef = url.searchParams.get('cardRef')
    const fullName = url.searchParams.get('fullName')
    const maskedCin = url.searchParams.get('maskedCin')
    const cnss = url.searchParams.get('cnss')
    const exp = url.searchParams.get('exp')
    const sig = url.searchParams.get('sig')
    // Optional; signed as '' when absent so the HMAC still matches.
    const photo = url.searchParams.get('photo') ?? ''

    if (!cardRef || !fullName || !maskedCin || !cnss || !exp || !sig) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const expiresAt = Number(exp)
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now() / 1000) {
      return NextResponse.json({ error: 'Link expired' }, { status: 410 })
    }

    const isValid = verifyWalletHeroSignature({ cardRef, fullName, maskedCin, cnss, photo, exp }, sig)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    // Domaine public (le conteneur voit 0.0.0.0:3000 en interne)
    const origin = process.env.AUTH_URL ?? url.origin
    const qrUrl = `${origin}/carte/${cardRef}`
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 168,
      margin: 1,
      color: { dark: '#010C2D', light: '#FFFFFF' },
    })

    // Le conteneur ne peut pas recharger son propre domaine public (hairpin NAT) —
    // on inline le logo depuis le disque.
    const logoBuffer = await readFile(path.join(process.cwd(), 'public', 'logo0.png'))
    const logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`

    const heroHtml = renderWalletHeroHtml({ fullName, maskedCin, cnss, cardRef, origin, qrDataUrl, photoUrl: photo || undefined, logoDataUrl })

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            body { margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
          </style>
        </head>
        <body>${heroHtml}</body>
      </html>
    `

    const browser = await puppeteer.launch({
      headless: true,
      // In the Docker image puppeteer's bundled Chrome is absent — use system Chromium.
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 1032, height: 336, deviceScaleFactor: 1 })
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' })
    const buffer = await page.screenshot({ type: 'png', omitBackground: false })
    await browser.close()

    return new NextResponse(buffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=600',
      },
    })
  } catch (error) {
    console.error('Wallet hero image error:', error)
    return NextResponse.json({ error: 'Failed to generate hero image' }, { status: 500 })
  }
}
