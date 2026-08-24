import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { buildWalletHeroSvg } from '@/features/carte/components/CarteVirtuelleExport'
import { inlineRemoteImage, renderSvgToPng } from '@/features/carte/server/CartePngRenderer'
import { verifyWalletHeroSignature } from '@/lib/walletHeroSignature'

export const runtime = 'nodejs'

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

    // Le conteneur ne peut pas recharger son propre domaine public (hairpin NAT) —
    // on inline le logo depuis le disque.
    const logoBuffer = await readFile(path.join(process.cwd(), 'public', 'logo0.png'))
    const logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`

    const photoDataUrl = await inlineRemoteImage(photo)
    const heroSvg = buildWalletHeroSvg({
      fullName,
      maskedCin,
      cnss,
      cardRef,
      origin,
      photoUrl: photoDataUrl,
      logoDataUrl,
    })
    const buffer = renderSvgToPng(heroSvg, 1032)

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
