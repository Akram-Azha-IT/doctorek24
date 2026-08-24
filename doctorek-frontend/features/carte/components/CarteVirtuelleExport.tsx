import { CarteVirtuelle, PatientProfile } from '@/lib/types'

// Palette de la carte — issue du design system Doctorek. La marque s'exprime par le
// guilloché bleu, le logo et le numéro de carte : aucun aplat de couleur n'est nécessaire.
const C_BLUE  = '#007DFF'   // bleu de marque — guilloché, n° de carte, mention officielle
const C_RICH  = '#0C4A83'   // bleu profond — filet du portrait
const C_NAVY  = '#010C2D'   // valeurs, pied de carte
const C_LABEL = '#5B7291'   // gris bleuté — libellés (pas un gris neutre générique)
const C_ARLBL = '#8FA9C7'   // libellés arabes, subordonnés
const C_LINE  = '#DCE7F5'   // filets, teintés bleu
const C_RED   = '#C1272D'
const C_GREEN = '#006233'

/**
 * Styles typographiques de la carte, injectés dans le SVG.
 * Outfit est fourni par next/font dans l'app ; resvg utilise ensuite Segoe UI ou
 * Noto Sans selon la plateforme. La famille générique reste toujours sans-serif.
 */
const SVG_TYPE_STYLE = `
      <style>
        .dk-s { font-family: 'Outfit', 'Figtree', 'Segoe UI', 'Noto Sans', sans-serif; }
        .dk-m { font-family: ui-monospace, 'SF Mono', 'DejaVu Sans Mono', 'Roboto Mono', 'Courier New', monospace; font-variant-numeric: tabular-nums; }
        .dk-a { font-family: 'Noto Sans Arabic', 'Noto Naskh Arabic', system-ui, sans-serif; }
      </style>`

interface RenderOptions {
  /** Origin used to resolve absolute asset URLs (e.g. http://localhost:3000) */
  origin: string
  /** Data URI (image/png base64) of the pre-generated QR code, or undefined for placeholder */
  qrDataUrl?: string
  /** Logo embarqué en data URI — Puppeteer ne peut pas recharger le domaine public depuis le conteneur. */
  logoDataUrl?: string
}

/** Un champ vide ne doit pas ressembler à un champ cassé : mention explicite et grisée. */
const isBlankValue = (v: string) => !v?.trim() || v.trim() === '-'

/**
 * Champ de la carte : libellé (arabe en ligne, pas rejeté à droite) puis valeur.
 * Aucun filet de séparation — les cartes physiques n'en ont pas ; ce sont eux qui
 * faisaient lire la carte comme un formulaire. La séparation vient de l'espace.
 */
function field(opts: {
  x: number
  y: number
  fr: string
  ar: string
  value: string
  valueSize?: number
  valueColor?: string
}): string {
  const { x, y, fr, ar, value, valueSize = 21, valueColor = C_NAVY } = opts
  const blank = isBlankValue(value)
  return `
        <text class="dk-s" x="${x}" y="${y}" font-size="10.5" font-weight="700" fill="${C_LABEL}" letter-spacing="1.5">${fr}<tspan class="dk-a" font-size="11.5" fill="${C_ARLBL}" letter-spacing="0"> · ${ar}</tspan></text>
        <text class="${blank ? 'dk-s' : 'dk-m'}" x="${x}" y="${y + 32}" font-size="${blank ? 17 : valueSize}" font-weight="${blank ? 500 : 700}" fill="${blank ? '#A9BBD2' : valueColor}" letter-spacing="${blank ? 0 : 1.6}">${blank ? 'Non renseigné' : value}</text>`
}

const CARD_W = 856
const CARD_H = 540

/**
 * Trame de sécurité : maillage de triangles équilatéraux (lignes à 0°, +60°, -60°).
 * Double lecture — impression de sécurité d'un document officiel, et parenté avec
 * les entrelacs géométriques marocains.
 */
function triangleMesh(size: number, opacity: number): string {
  const rowH = (size * Math.sqrt(3)) / 2
  const run = CARD_H / Math.sqrt(3) // décalage horizontal d'une diagonale à 60° sur toute la hauteur
  const paths: string[] = []
  for (let y = 0; y <= CARD_H + rowH; y += rowH) paths.push(`M0 ${y.toFixed(1)}H${CARD_W}`)
  for (let x = -run; x <= CARD_W + run; x += size) {
    paths.push(
      `M${x.toFixed(1)} 0L${(x + run).toFixed(1)} ${CARD_H}`,
      `M${x.toFixed(1)} 0L${(x - run).toFixed(1)} ${CARD_H}`,
    )
  }
  return `<g fill="none" stroke="${C_BLUE}" stroke-width="0.6" opacity="${opacity}">${paths
    .map((d) => `<path d="${d}"/>`)
    .join('')}</g>`
}

/**
 * Grande courbe d'angle, reprise du langage visuel de l'app (aplats bleus adoucis).
 * Donne à la carte une respiration et un point d'ancrage, sans aplat plein.
 */
function cornerArc(suffix: string): string {
  return `
        <circle cx="980" cy="640" r="380" fill="url(#arc-grad-${suffix})"/>
        <circle cx="980" cy="640" r="406" fill="none" stroke="#CBE0F8" stroke-width="1.4" opacity="0.8"/>`
}

/**
 * Le nom reste l'élément dominant, mais sans écraser le reste : il descend en corps
 * plutôt que d'être rogné quand il s'allonge.
 */
export function nameFontSize(fullName: string): number {
  if (fullName.length > 26) return 24
  if (fullName.length > 20) return 28
  return 32
}

export function buildRectoSvg(
  fullName: string,
  maskedCin: string,
  cnss: string,
  cardRef: string,
  logoUrl: string,
  photoUrl?: string,
  qrDataUrl?: string,
): string {
  const photoBlock = photoUrl
    ? `<image href="${photoUrl}" x="48" y="132" width="168" height="206" clip-path="url(#photo-clip-recto)" preserveAspectRatio="xMidYMid slice"/>`
    : `<g clip-path="url(#photo-clip-recto)">
        <rect x="48" y="132" width="168" height="206" fill="#EEF3FA"/>
        <circle cx="132" cy="208" r="32" fill="#C4CFDD"/>
        <ellipse cx="132" cy="300" rx="55" ry="44" fill="#C4CFDD"/>
      </g>`

  const qrBlock = qrDataUrl
    ? `<image href="${qrDataUrl}" x="686" y="296" width="120" height="120"/>`
    : `<g opacity="0.2">
        <rect x="686" y="296" width="120" height="120" fill="#F1F5F9"/>
        <text class="dk-s" x="746" y="361" text-anchor="middle" font-size="10" font-weight="700" fill="${C_LABEL}">QR</text>
      </g>`

  const nameSize = nameFontSize(fullName)

  return `
    <svg viewBox="0 0 856 540" style="width:100%;height:100%;display:block;" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif">
      <defs>
        <clipPath id="card-clip-recto"><rect width="856" height="540" rx="24"/></clipPath>
        <clipPath id="photo-clip-recto"><rect x="48" y="132" width="168" height="206" rx="10"/></clipPath>
        <clipPath id="name-clip-recto"><rect x="256" y="180" width="404" height="46"/></clipPath>
        <linearGradient id="chip-grad-recto" x1="0" y1="0" x2="56" y2="42" gradientUnits="userSpaceOnUse">
          <stop stop-color="#E7C766"/>
          <stop offset="0.5" stop-color="#F6E8B1"/>
          <stop offset="1" stop-color="#C9A23C"/>
        </linearGradient>
        <linearGradient id="bg-grad-recto" x1="0" y1="0" x2="0" y2="540" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FFFFFF"/>
          <stop offset="1" stop-color="#EDF4FE"/>
        </linearGradient>
        <linearGradient id="arc-grad-recto" x1="640" y1="280" x2="900" y2="560" gradientUnits="userSpaceOnUse">
          <stop stop-color="#DCEAFB"/>
          <stop offset="1" stop-color="#C9DEF7"/>
        </linearGradient>
      </defs>
      ${SVG_TYPE_STYLE}

      <g clip-path="url(#card-clip-recto)">
        <rect width="856" height="540" fill="url(#bg-grad-recto)"/>
        ${cornerArc('recto')}
        ${triangleMesh(74, 0.1)}

        <rect x="0" y="0" width="428" height="3.5" fill="${C_RED}"/>
        <rect x="428" y="0" width="428" height="3.5" fill="${C_GREEN}"/>

        <image href="${logoUrl}" x="48" y="32" width="156" height="44" preserveAspectRatio="xMinYMid meet"/>
        <text class="dk-a" x="808" y="50" text-anchor="end" font-size="16" font-weight="800" fill="${C_NAVY}">المملكة المغربية</text>
        <text class="dk-s" x="808" y="70" text-anchor="end" font-size="10" font-weight="600" fill="${C_LABEL}" letter-spacing="3">ROYAUME DU MAROC</text>
        <text class="dk-s" x="808" y="94" text-anchor="end" font-size="13.5" font-weight="800" fill="${C_BLUE}" letter-spacing="1.6">CARTE SANTÉ VIRTUELLE</text>

        <rect x="48" y="132" width="168" height="206" rx="10" fill="#FFFFFF"/>
        ${photoBlock}
        <rect x="48" y="132" width="168" height="206" rx="10" fill="none" stroke="${C_RICH}" stroke-opacity="0.22" stroke-width="1"/>

        <!-- Puce centrée sous le portrait : centre photo 48 + 168/2 = 132, moins 56/2 -->
        <g transform="translate(104, 360)">
          <rect width="56" height="42" rx="7" fill="url(#chip-grad-recto)" stroke="#B08A2E" stroke-width="0.8"/>
          <line x1="17" y1="0" x2="17" y2="42" stroke="rgba(0,0,0,0.18)" stroke-width="0.9"/>
          <line x1="39" y1="0" x2="39" y2="42" stroke="rgba(0,0,0,0.18)" stroke-width="0.9"/>
          <line x1="0" y1="14" x2="56" y2="14" stroke="rgba(0,0,0,0.18)" stroke-width="0.9"/>
          <line x1="0" y1="28" x2="56" y2="28" stroke="rgba(0,0,0,0.18)" stroke-width="0.9"/>
          <rect x="17" y="14" width="22" height="14" rx="2" fill="none" stroke="rgba(0,0,0,0.14)" stroke-width="0.8"/>
        </g>

        <text class="dk-s" x="256" y="158" font-size="10.5" font-weight="600" fill="${C_LABEL}" letter-spacing="1.8">TITULAIRE<tspan class="dk-a" font-size="11.5" fill="${C_ARLBL}" letter-spacing="0"> · حامل البطاقة</tspan></text>
        <g clip-path="url(#name-clip-recto)">
          <text class="dk-s" x="256" y="210" font-size="${nameSize}" font-weight="700" fill="${C_NAVY}" letter-spacing="-0.5">${fullName}</text>
        </g>

        ${field({ x: 256, y: 274, fr: 'C.I.N.', ar: 'ب.ت.و', value: maskedCin })}
        ${field({ x: 474, y: 274, fr: 'N° CNSS / AMO', ar: 'الضمان الاجتماعي', value: cnss })}

        <text class="dk-s" x="256" y="382" font-size="10.5" font-weight="600" fill="${C_LABEL}" letter-spacing="1.8">N° DE CARTE<tspan class="dk-a" font-size="11.5" fill="${C_ARLBL}" letter-spacing="0"> · رقم البطاقة</tspan></text>
        <text class="dk-m" x="256" y="424" font-size="24" font-weight="700" fill="${C_RICH}" letter-spacing="2.4">${cardRef}</text>

        <rect x="678" y="288" width="136" height="136" rx="12" fill="#FFFFFF" stroke="${C_LINE}" stroke-width="1"/>
        ${qrBlock}
        <text class="dk-s" x="746" y="446" text-anchor="middle" font-size="9.5" font-weight="600" fill="${C_LABEL}" letter-spacing="2.4">VÉRIFIER</text>

        <rect x="0" y="486" width="856" height="54" fill="${C_NAVY}"/>
        <image href="${logoUrl}" x="48" y="498" width="92" height="30" preserveAspectRatio="xMinYMid meet" style="filter:brightness(0) invert(1);"/>
        <text class="dk-s" x="158" y="518" font-size="12" font-weight="500" fill="rgba(255,255,255,0.62)" letter-spacing="0.4">doctorek.ma · 080 100 2000</text>
        <text class="dk-a" x="808" y="518" text-anchor="end" font-size="10.5" font-weight="700" fill="rgba(255,255,255,0.58)" letter-spacing="0.4">DOCUMENT OFFICIEL · وثيقة رسمية</text>
      </g>
    </svg>
  `
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

function escapeSvgText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

/** Bannière Google Wallet en SVG pur, rendue sans navigateur headless. */
export function buildWalletHeroSvg(opts: {
  fullName: string
  maskedCin: string
  cnss: string
  cardRef: string
  origin: string
  qrDataUrl?: string
  photoUrl?: string
  /** Logo embarqué en data URI — Puppeteer ne peut pas recharger le domaine public depuis le conteneur. */
  logoDataUrl?: string
}): string {
  const { fullName, maskedCin, cnss, cardRef, qrDataUrl, origin, photoUrl, logoDataUrl } = opts
  const logoUrl = escapeSvgText(logoDataUrl ?? `${origin}/logo0.png`)
  const safeName = escapeSvgText(fullName)
  const safeCardRef = escapeSvgText(cardRef)
  const contentX = photoUrl ? 216 : 52
  const nameWidth = photoUrl ? 600 : 780
  const nameSize = fullName.length > 30 ? 30 : fullName.length > 24 ? 34 : 40

  // Le grand QR est déjà affiché par Google Wallet ; le répéter surcharge le hero.
  void qrDataUrl

  const walletField = (x: number, labelFr: string, labelAr: string, value: string) => `
    <text class="dk-s" x="${x}" y="216" font-size="10" font-weight="700" fill="#8FB8E8" letter-spacing="1.6">${labelFr}</text>
    <text class="dk-a" x="${x + 92}" y="216" font-size="10" fill="#8FB8E8">${labelAr}</text>
    <text class="dk-s" x="${x}" y="245" font-size="19" font-weight="700" fill="#FFFFFF" letter-spacing="0.8">${escapeSvgText(value)}</text>`

  const fields = [
    maskedCin && maskedCin !== '-' ? walletField(contentX, 'C.I.N.', 'ب.ت.و', maskedCin) : '',
    cnss && cnss !== '-' ? walletField(contentX + 250, 'N° CNSS / AMO', 'الضمان الاجتماعي', cnss) : '',
  ].join('')

  const photoBlock = photoUrl
    ? `<image href="${escapeSvgText(photoUrl)}" x="52" y="112" width="132" height="154"
        clip-path="url(#wallet-photo-clip)" preserveAspectRatio="xMidYMid slice"/>
       <rect x="52" y="112" width="132" height="154" rx="10" fill="none"
        stroke="rgba(255,255,255,0.85)" stroke-width="3"/>`
    : ''

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1032 336" width="1032" height="336" font-family="sans-serif">
      <defs>
        <clipPath id="wallet-photo-clip"><rect x="52" y="112" width="132" height="154" rx="10"/></clipPath>
        <clipPath id="wallet-name-clip"><rect x="${contentX}" y="139" width="${nameWidth}" height="50"/></clipPath>
      </defs>
      ${SVG_TYPE_STYLE}
      <rect width="1032" height="336" fill="#042651"/>
      ${Array.from({ length: 9 }, (_, i) =>
        `<circle cx="1000" cy="360" r="${120 + i * 34}" fill="none" stroke="rgba(255,255,255,0.045)" stroke-width="1.2"/>`
      ).join('')}
      ${Array.from({ length: 7 }, (_, i) =>
        `<circle cx="30" cy="-20" r="${90 + i * 30}" fill="none" stroke="rgba(61,168,255,0.07)" stroke-width="1.2"/>`
      ).join('')}

      <rect x="0" y="0" width="516" height="7" fill="#C1272D"/>
      <rect x="516" y="0" width="516" height="7" fill="#006233"/>

      <rect x="52" y="26" width="154" height="46" rx="10" fill="#FFFFFF"/>
      <image href="${logoUrl}" x="68" y="34" width="122" height="30" preserveAspectRatio="xMinYMid meet"/>

      <text class="dk-a" x="980" y="39" text-anchor="end" font-size="15" font-weight="700" fill="#FFFFFF">المملكة المغربية</text>
      <text class="dk-s" x="980" y="57" text-anchor="end" font-size="10" font-weight="700" fill="#B6DAF7" letter-spacing="2.6">ROYAUME DU MAROC</text>
      <text class="dk-s" x="980" y="76" text-anchor="end" font-size="11" font-weight="800" fill="#3DA8FF" letter-spacing="2">CARTE SANTÉ VIRTUELLE</text>

      ${photoBlock}
      <text class="dk-s" x="${contentX}" y="132" font-size="10" font-weight="700" fill="#8FB8E8" letter-spacing="1.8">NOM COMPLET</text>
      <text class="dk-a" x="${contentX + 112}" y="132" font-size="10" fill="#8FB8E8">الاسم الكامل</text>
      <g clip-path="url(#wallet-name-clip)">
        <text class="dk-s" x="${contentX}" y="177" font-size="${nameSize}" font-weight="800" fill="#FFFFFF">${safeName}</text>
      </g>
      ${fields}

      <line x1="52" y1="292" x2="980" y2="292" stroke="rgba(255,255,255,0.14)"/>
      <text class="dk-s" x="52" y="321" font-size="13" font-weight="700" fill="#3DA8FF" letter-spacing="1.6">${safeCardRef}</text>
      <text class="dk-s" x="828" y="321" text-anchor="end" font-size="10" font-weight="600" fill="#8FB8E8" letter-spacing="1.4">DOCUMENT OFFICIEL ·</text>
      <text class="dk-a" x="980" y="321" text-anchor="end" font-size="11" fill="#8FB8E8">وثيقة رسمية</text>
    </svg>
  `
}

export function buildVersoSvg(
  nom: string,
  prenom: string,
  dateNaissance: string,
  cin: string,
  immatDate: string,
  immatNo: string,
  logoUrl: string,
): string {
  // Grille deux colonnes : lecture en Z, sans la pile de lignes qui faisait « formulaire ».
  const fields = [
    field({ x: 48,  y: 178, fr: 'NOM',                    ar: 'النسب',           value: nom }),
    field({ x: 452, y: 178, fr: 'PRÉNOM',                 ar: 'الاسم الشخصي',    value: prenom }),
    field({ x: 48,  y: 262, fr: 'DATE DE NAISSANCE',      ar: 'تاريخ الازدياد',  value: dateNaissance }),
    field({ x: 452, y: 262, fr: 'C.I.N.',                 ar: 'ب.ت.و',           value: cin }),
    field({ x: 48,  y: 346, fr: "DATE D'IMMATRICULATION", ar: 'تاريخ التسجيل',   value: immatDate }),
  ].join('')

  return `
    <svg viewBox="0 0 856 540" style="width:100%;height:100%;display:block;" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif">
      <defs>
        <clipPath id="card-clip-verso"><rect width="856" height="540" rx="24"/></clipPath>
        <linearGradient id="bg-grad-verso" x1="0" y1="0" x2="0" y2="540" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FFFFFF"/>
          <stop offset="1" stop-color="#EDF4FE"/>
        </linearGradient>
        <linearGradient id="arc-grad-verso" x1="640" y1="280" x2="900" y2="560" gradientUnits="userSpaceOnUse">
          <stop stop-color="#DCEAFB"/>
          <stop offset="1" stop-color="#C9DEF7"/>
        </linearGradient>
      </defs>
      ${SVG_TYPE_STYLE}

      <g clip-path="url(#card-clip-verso)">
        <rect width="856" height="540" fill="url(#bg-grad-verso)"/>
        ${cornerArc('verso')}
        ${triangleMesh(74, 0.1)}

        <rect x="0" y="0" width="428" height="3.5" fill="${C_RED}"/>
        <rect x="428" y="0" width="428" height="3.5" fill="${C_GREEN}"/>

        <image href="${logoUrl}" x="48" y="32" width="144" height="42" preserveAspectRatio="xMinYMid meet"/>
        <text class="dk-s" x="808" y="50" text-anchor="end" font-size="10.5" font-weight="600" fill="${C_LABEL}" letter-spacing="1.8">N° IMMATRICULATION<tspan class="dk-a" font-size="11.5" fill="${C_ARLBL}" letter-spacing="0"> · رقم التسجيل</tspan></text>
        <text class="dk-m" x="808" y="86" text-anchor="end" font-size="25" font-weight="700" fill="${C_RICH}" letter-spacing="2.6">${immatNo}</text>

        ${fields}

        <g transform="translate(48, 412)">
          <path d="M11 1L3 4v6c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V4l-8-3z" fill="${C_BLUE}" opacity="0.9"/>
          <path d="M7.5 11.5l2.5 2.5 4.5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </g>
        <text class="dk-s" x="80" y="423" font-size="12.5" font-weight="700" fill="${C_NAVY}">Carte strictement personnelle et confidentielle</text>
        <text class="dk-s" x="80" y="444" font-size="11.5" font-weight="500" fill="${C_LABEL}">En cas de perte ou de vol, contactez le 080 100 2000 ou votre espace patient.</text>
        <text class="dk-a" x="808" y="432" text-anchor="end" font-size="12" font-weight="700" fill="${C_ARLBL}">بطاقة شخصية وسرية</text>

        <rect x="0" y="486" width="856" height="54" fill="${C_NAVY}"/>
        <image href="${logoUrl}" x="48" y="498" width="92" height="30" preserveAspectRatio="xMinYMid meet" style="filter:brightness(0) invert(1);"/>
        <text class="dk-s" x="158" y="518" font-size="12" font-weight="500" fill="rgba(255,255,255,0.62)" letter-spacing="0.4">doctorek.ma</text>
        <text class="dk-m" x="808" y="518" text-anchor="end" font-size="10.5" font-weight="700" fill="rgba(255,255,255,0.58)" letter-spacing="1.8">CARTE MÉDICALE NATIONALE · MA</text>
      </g>
    </svg>
  `
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
