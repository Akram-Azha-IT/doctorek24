import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import QRCode from 'qrcode'
import { renderCarteRectoHtml, renderCarteVersoHtml } from '@/features/carte/components/CarteVirtuelleExport'
import { inlineRemoteImage, renderCarteExportPng } from '@/features/carte/server/CartePngRenderer'

export const runtime = 'nodejs'

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
    const photoDataUrl = await inlineRemoteImage(profile?.photoUrl)
    const profileInline = profile ? { ...profile, photoUrl: photoDataUrl ?? null } : profile

    const renderOptions = { origin, qrDataUrl, logoDataUrl }
    const rectoHtml = renderCarteRectoHtml(carte, profileInline, firstName, lastName, renderOptions)
    const versoHtml = renderCarteVersoHtml(carte, profileInline, firstName, lastName, renderOptions)

    const buffer = renderCarteExportPng(rectoHtml, versoHtml)

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
