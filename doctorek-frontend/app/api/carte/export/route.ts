import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { renderCarteRectoHtml, renderCarteVersoHtml } from '@/features/carte/components/CarteVirtuelleExport'

export async function POST(req: Request) {
  try {
    const { carte, firstName, lastName } = await req.json()

    if (!carte) {
      return NextResponse.json({ error: 'Carte data is required' }, { status: 400 })
    }

    const rectoHtml = renderCarteRectoHtml(carte, firstName, lastName)
    const versoHtml = renderCarteVersoHtml(carte, firstName, lastName)

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            body {
              margin: 0;
              padding: 40px;
              background: #010C2D;
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              gap: 40px;
              align-items: center;
              justify-content: center;
              width: fit-content;
            }
            .card-container {
              position: relative;
              width: 480px;
              height: 302px;
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
    await page.setViewport({ width: 560, height: 780, deviceScaleFactor: 3 })
    
    // Set HTML content and wait for network/fonts
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' })
    
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
