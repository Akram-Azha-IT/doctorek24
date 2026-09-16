import type { CarteVirtuelle, PatientProfile } from '../../../lib/types'
import { buildRectoSvg, buildVersoSvg } from './card-design'
export { buildRectoSvg, buildVersoSvg, buildWalletHeroSvg, nameFontSize } from './card-design'

interface RenderOptions {
  /** Origin used to resolve absolute asset URLs (e.g. http://localhost:3000) */
  origin: string
  /** Data URI (image/png base64) of the pre-generated QR code, or undefined for placeholder */
  qrDataUrl?: string
  /** Logo embarqué en data URI — Puppeteer ne peut pas recharger le domaine public depuis le conteneur. */
  logoDataUrl?: string
}

export function renderCarteRectoHtml(
  carte: CarteVirtuelle,
  profile: PatientProfile | null | undefined,
  firstName: string | undefined,
  lastName: string | undefined,
  { origin, qrDataUrl, logoDataUrl }: RenderOptions,
): string {
  const fullName =
    [firstName, lastName?.toUpperCase()].filter(Boolean).join(' ') || 'NOM ET PRÉNOM'

  const rawCin = profile?.numIdentite ?? ''
  const maskedCin =
    rawCin.length >= 3
      ? rawCin[0] + '*'.repeat(rawCin.length - 2) + rawCin[rawCin.length - 1]
      : rawCin || '-'

  const cnss = carte.assuranceNumero ?? '-'
  const logoUrl = logoDataUrl ?? `${origin}/logo0.png`

  return buildRectoSvg(fullName, maskedCin, cnss, carte.cardRef ?? '-', logoUrl, profile?.photoUrl ?? undefined, qrDataUrl)
}

export function renderCarteVersoHtml(
  carte: CarteVirtuelle,
  profile: PatientProfile | null | undefined,
  firstName: string | undefined,
  lastName: string | undefined,
  { origin, logoDataUrl }: RenderOptions,
): string {
  const logoUrl = logoDataUrl ?? `${origin}/logo0.png`
  return buildVersoSvg(
    lastName?.toUpperCase() || '-',
    firstName || '-',
    profile?.dateNaissance ?? '-',
    profile?.numIdentite ?? '-',
    `01/01/${new Date().getFullYear()}`,
    carte.assuranceNumero ?? carte.cardRef ?? '-',
    logoUrl,
  )
}
