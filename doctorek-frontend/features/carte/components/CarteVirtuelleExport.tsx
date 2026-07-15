import { CarteVirtuelle, PatientProfile } from '@/lib/types'

const C_BLUE  = '#007DFF'
const C_DARK  = '#003B95'
const C_TEXT  = '#111827'
const C_LABEL = '#6B7280'
const C_RED   = '#C1272D'
const C_GREEN = '#006233'

interface RenderOptions {
  /** Origin used to resolve absolute asset URLs (e.g. http://localhost:3000) */
  origin: string
  /** Data URI (image/png base64) of the pre-generated QR code, or undefined for placeholder */
  qrDataUrl?: string
  /** Logo embarqué en data URI — Puppeteer ne peut pas recharger le domaine public depuis le conteneur. */
  logoDataUrl?: string
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
    ? `<image href="${photoUrl}" x="40" y="124" width="176" height="220" clip-path="url(#photo-clip-recto)" preserveAspectRatio="xMidYMid slice"/>`
    : `<g clip-path="url(#photo-clip-recto)">
        <rect x="40" y="124" width="176" height="220" fill="#EDF2F7"/>
        <circle cx="128" cy="204" r="34" fill="#C4CFDD"/>
        <ellipse cx="128" cy="300" rx="58" ry="46" fill="#C4CFDD"/>
      </g>`

  const qrBlock = qrDataUrl
    ? `<image href="${qrDataUrl}" x="682" y="218" width="96" height="96"/>`
    : ''

  return `
    <svg viewBox="0 0 856 540" style="width:100%;height:100%;display:block;" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="card-clip-recto"><rect width="856" height="540" rx="24"/></clipPath>
        <clipPath id="photo-clip-recto"><rect x="40" y="124" width="176" height="220" rx="12"/></clipPath>
        <clipPath id="name-clip-recto"><rect x="248" y="130" width="404" height="60"/></clipPath>
        <linearGradient id="chip-grad-recto" x1="0" y1="0" x2="58" y2="44" gradientUnits="userSpaceOnUse">
          <stop stop-color="#E7C766"/>
          <stop offset="0.5" stop-color="#F6E8B1"/>
          <stop offset="1" stop-color="#C9A23C"/>
        </linearGradient>
        <linearGradient id="bg-grad-recto" x1="0" y1="0" x2="0" y2="540" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FBFDFF"/>
          <stop offset="1" stop-color="#F3F7FC"/>
        </linearGradient>
      </defs>

      <g clip-path="url(#card-clip-recto)">
        <rect width="856" height="540" fill="url(#bg-grad-recto)"/>

        <g stroke="${C_BLUE}" fill="none" opacity="0.05">
          <path d="M-20 430 C 120 360, 240 500, 400 430 S 700 360, 880 440" stroke-width="1.4"/>
          <path d="M-20 455 C 130 390, 260 520, 420 455 S 710 390, 880 465" stroke-width="1"/>
          <path d="M-20 480 C 140 420, 280 540, 440 480 S 720 420, 880 490" stroke-width="0.7"/>
          <path d="M-20 110 C 160 40, 340 160, 520 90 S 760 50, 880 100" stroke-width="0.8"/>
        </g>

        <rect x="0" y="0" width="428" height="4" fill="${C_RED}"/>
        <rect x="428" y="0" width="428" height="4" fill="${C_GREEN}"/>

        <image href="${logoUrl}" x="24" y="18" width="170" height="58" preserveAspectRatio="xMinYMid meet"/>
        <text x="832" y="38" text-anchor="end" font-family="'Noto Sans Arabic','Noto Naskh Arabic',system-ui,sans-serif" font-size="15" font-weight="800" fill="#0F172A">المملكة المغربية</text>
        <text x="832" y="56" text-anchor="end" font-family="system-ui,-apple-system,sans-serif" font-size="9" font-weight="700" fill="#64748B" letter-spacing="3">ROYAUME DU MAROC</text>
        <text x="832" y="76" text-anchor="end" font-family="system-ui,-apple-system,sans-serif" font-size="11.5" font-weight="800" fill="${C_BLUE}" letter-spacing="1.2">CARTE SANTÉ VIRTUELLE</text>

        <line x1="24" y1="96" x2="832" y2="96" stroke="#E2E8F0" stroke-width="1"/>

        <rect x="36" y="120" width="184" height="228" rx="15" fill="none" stroke="#0F2A4A" stroke-opacity="0.15" stroke-width="1.5"/>
        <rect x="40" y="124" width="176" height="220" rx="12" fill="#FFFFFF"/>
        ${photoBlock}

        <text x="248" y="142" font-family="system-ui,-apple-system,sans-serif" font-size="9" font-weight="700" fill="#64748B" letter-spacing="2">NOM COMPLET</text>
        <text x="652" y="142" text-anchor="end" font-family="'Noto Sans Arabic','Noto Naskh Arabic',system-ui,sans-serif" font-size="9" font-weight="700" fill="#94A3B8">الاسم الكامل</text>
        <g clip-path="url(#name-clip-recto)">
          <text x="248" y="176" font-family="system-ui,-apple-system,sans-serif" font-size="25" font-weight="900" fill="#0F172A" letter-spacing="0.3">${fullName}</text>
        </g>
        <line x1="248" y1="196" x2="652" y2="196" stroke="#EDF2F7" stroke-width="1.2"/>

        <text x="248" y="222" font-family="system-ui,-apple-system,sans-serif" font-size="9" font-weight="700" fill="#64748B" letter-spacing="2">C.I.N.</text>
        <text x="652" y="222" text-anchor="end" font-family="'Noto Sans Arabic','Noto Naskh Arabic',system-ui,sans-serif" font-size="9" font-weight="700" fill="#94A3B8">ب.ت.و</text>
        <text x="248" y="252" font-family="'Courier New',Courier,monospace" font-size="19" font-weight="800" fill="#0F172A" letter-spacing="3">${maskedCin}</text>
        <line x1="248" y1="270" x2="652" y2="270" stroke="#EDF2F7" stroke-width="1.2"/>

        <text x="248" y="296" font-family="system-ui,-apple-system,sans-serif" font-size="9" font-weight="700" fill="#64748B" letter-spacing="2">N° CNSS / AMO</text>
        <text x="652" y="296" text-anchor="end" font-family="'Noto Sans Arabic','Noto Naskh Arabic',system-ui,sans-serif" font-size="9" font-weight="700" fill="#94A3B8">رقم الضمان الاجتماعي</text>
        <text x="248" y="326" font-family="'Courier New',Courier,monospace" font-size="18" font-weight="800" fill="#0F172A" letter-spacing="2.5">${cnss}</text>
        <line x1="248" y1="344" x2="652" y2="344" stroke="#EDF2F7" stroke-width="1.2"/>

        <text x="248" y="370" font-family="system-ui,-apple-system,sans-serif" font-size="9" font-weight="700" fill="#64748B" letter-spacing="2">N° DE CARTE</text>
        <text x="652" y="370" text-anchor="end" font-family="'Noto Sans Arabic','Noto Naskh Arabic',system-ui,sans-serif" font-size="9" font-weight="700" fill="#94A3B8">رقم البطاقة</text>
        <text x="248" y="400" font-family="'Courier New',Courier,monospace" font-size="17" font-weight="800" fill="${C_BLUE}" letter-spacing="3">${cardRef}</text>

        <g transform="translate(694, 122)">
          <rect width="58" height="44" rx="8" fill="url(#chip-grad-recto)" stroke="#B08A2E" stroke-width="0.8"/>
          <line x1="18" y1="0" x2="18" y2="44" stroke="rgba(0,0,0,0.18)" stroke-width="0.9"/>
          <line x1="40" y1="0" x2="40" y2="44" stroke="rgba(0,0,0,0.18)" stroke-width="0.9"/>
          <line x1="0" y1="15" x2="58" y2="15" stroke="rgba(0,0,0,0.18)" stroke-width="0.9"/>
          <line x1="0" y1="29" x2="58" y2="29" stroke="rgba(0,0,0,0.18)" stroke-width="0.9"/>
          <rect x="18" y="15" width="22" height="14" rx="2" fill="none" stroke="rgba(0,0,0,0.14)" stroke-width="0.8"/>
        </g>

        <rect x="670" y="206" width="120" height="120" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2"/>
        ${qrBlock}
        <text x="730" y="346" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="7.5" font-weight="700" fill="#94A3B8" letter-spacing="2.5">VÉRIFICATION</text>

        <rect x="0" y="486" width="856" height="54" fill="#010C2D"/>
        <image href="${logoUrl}" x="24" y="497" width="100" height="32" preserveAspectRatio="xMinYMid meet" style="filter:brightness(0) invert(1);"/>
        <text x="140" y="518" font-family="system-ui,-apple-system,sans-serif" font-size="14" font-weight="300" fill="rgba(255,255,255,0.3)">|</text>
        <text x="154" y="518" font-family="system-ui,-apple-system,sans-serif" font-size="10.5" font-weight="600" fill="rgba(255,255,255,0.85)" letter-spacing="0.5">www.doctorek.ma</text>
        <text x="296" y="518" font-family="system-ui,-apple-system,sans-serif" font-size="14" font-weight="300" fill="rgba(255,255,255,0.3)">|</text>
        <g transform="translate(312, 506)" stroke="rgba(255,255,255,0.85)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">
          <path d="M14 10.5v2a1.5 1.5 0 01-1.6 1.5 12 12 0 01-5.2-1.8 12 12 0 01-3.6-3.6A12 12 0 011.8 3.1 1.5 1.5 0 013.3 1.5h2a1.5 1.5 0 011.5 1.3c.1.7.3 1.4.5 2.1a1.5 1.5 0 01-.3 1.6L6.2 7.3A12 12 0 009.7 10.8l.8-.8a1.5 1.5 0 011.6-.3c.7.2 1.4.4 2.1.5A1.5 1.5 0 0114 10.5z"/>
        </g>
        <text x="336" y="518" font-family="system-ui,-apple-system,sans-serif" font-size="10.5" font-weight="600" fill="rgba(255,255,255,0.85)" letter-spacing="0.5">080 100 2000</text>
        <text x="832" y="518" text-anchor="end" font-family="'Noto Sans Arabic','Noto Naskh Arabic',system-ui,sans-serif" font-size="8" font-weight="700" fill="rgba(255,255,255,0.55)">DOCUMENT OFFICIEL · وثيقة رسمية</text>
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

/** Modern full-bleed hero banner for the Google Wallet pass (recommended ratio ~1032x336). */
export function renderWalletHeroHtml(opts: {
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
  const logoUrl = logoDataUrl ?? `${origin}/logo0.png`

  // Le grand QR du pass est déjà affiché par Google Wallet juste au-dessus du hero —
  // le dupliquer ici encombre la carte. qrDataUrl est ignoré volontairement.
  void qrDataUrl

  const arabicFont = `font-family:'Noto Sans Arabic','Noto Naskh Arabic',system-ui,sans-serif;`

  const field = (labelFr: string, labelAr: string, value: string) => `
    <div style="display:flex;flex-direction:column;gap:3px;min-width:150px;">
      <div style="display:flex;align-items:baseline;gap:8px;">
        <span style="font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#8FB8E8;">${labelFr}</span>
        <span style="${arabicFont}font-size:10px;color:#8FB8E8;">${labelAr}</span>
      </div>
      <span style="font-size:19px;font-weight:700;color:#FFFFFF;letter-spacing:0.04em;">${value}</span>
    </div>`

  const fields = [
    maskedCin && maskedCin !== '-' ? field('C.I.N.', 'ب.ت.و', maskedCin) : '',
    cnss && cnss !== '-' ? field('N° CNSS / AMO', 'الضمان الاجتماعي', cnss) : '',
  ].join('')

  const photoBlock = photoUrl
    ? `<div style="width:132px;height:158px;border-radius:10px;overflow:hidden;border:3px solid rgba(255,255,255,0.85);box-shadow:0 8px 26px rgba(0,0,0,0.35);flex-shrink:0;">
         <img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" />
       </div>`
    : ''

  return `
    <div style="position:relative;width:1032px;height:336px;background:#042651;overflow:hidden;font-family:'Inter',system-ui,sans-serif;">
      <!-- guilloche discret (arcs concentriques, motif document officiel) -->
      <svg style="position:absolute;inset:0;" width="1032" height="336" viewBox="0 0 1032 336" fill="none">
        ${Array.from({ length: 9 }, (_, i) =>
          `<circle cx="1000" cy="360" r="${120 + i * 34}" stroke="rgba(255,255,255,0.045)" stroke-width="1.2"/>`
        ).join('')}
        ${Array.from({ length: 7 }, (_, i) =>
          `<circle cx="30" cy="-20" r="${90 + i * 30}" stroke="rgba(61,168,255,0.07)" stroke-width="1.2"/>`
        ).join('')}
      </svg>

      <!-- liseré drapeau (rouge → vert) -->
      <div style="position:absolute;top:0;left:0;right:0;height:7px;background:linear-gradient(90deg,#C1272D 0%,#C1272D 48%,#006233 52%,#006233 100%);"></div>

      <div style="position:relative;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:26px 52px 20px;box-sizing:border-box;">
        <!-- en-tête : marque + mention officielle bilingue -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;">
          <div style="background:#FFFFFF;border-radius:10px;padding:7px 16px;box-shadow:0 4px 14px rgba(0,0,0,0.3);">
            <img src="${logoUrl}" style="height:30px;width:auto;display:block;" />
          </div>
          <div style="text-align:right;">
            <div style="${arabicFont}font-size:15px;font-weight:700;color:#FFFFFF;line-height:1.3;">المملكة المغربية</div>
            <div style="font-size:10px;font-weight:700;letter-spacing:0.26em;color:#B6DAF7;margin-top:2px;">ROYAUME DU MAROC</div>
            <div style="font-size:11px;font-weight:800;letter-spacing:0.2em;color:#3DA8FF;margin-top:4px;">CARTE SANTÉ VIRTUELLE</div>
          </div>
        </div>

        <!-- identité -->
        <div style="display:flex;align-items:center;gap:32px;min-width:0;">
          ${photoBlock}
          <div style="display:flex;flex-direction:column;gap:14px;min-width:0;">
            <div>
              <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:4px;">
                <span style="font-size:10px;font-weight:700;letter-spacing:0.18em;color:#8FB8E8;">NOM COMPLET</span>
                <span style="${arabicFont}font-size:10px;color:#8FB8E8;">الاسم الكامل</span>
              </div>
              <div style="font-size:40px;font-weight:800;line-height:1.05;color:#FFFFFF;letter-spacing:-0.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:560px;">${fullName}</div>
            </div>
            <div style="display:flex;gap:44px;">${fields}</div>
          </div>
        </div>

        <!-- pied : référence + mention officielle -->
        <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.14);padding-top:10px;">
          <span style="font-size:13px;font-weight:700;letter-spacing:0.12em;color:#3DA8FF;">${cardRef}</span>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
            <span style="font-size:10px;font-weight:600;letter-spacing:0.14em;color:#8FB8E8;">DOCUMENT OFFICIEL ·</span>
            <span style="${arabicFont}font-size:11px;color:#8FB8E8;">وثيقة رسمية</span>
          </div>
        </div>
      </div>
    </div>
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
  const rows = [
    { fr: 'NOM', ar: 'النسب', value: nom },
    { fr: 'PRÉNOM', ar: 'الاسم الشخصي', value: prenom },
    { fr: 'DATE DE NAISSANCE', ar: 'تاريخ الازدياد', value: dateNaissance },
    { fr: 'C.I.N.', ar: 'ب.ت.و', value: cin },
    { fr: "DATE D'IMMATRICULATION", ar: 'تاريخ التسجيل', value: immatDate },
  ]

  const rowsSvg = rows
    .map((row, i) => {
      const y = 128 + i * 62
      return `
        <text x="40" y="${y}" font-family="system-ui,-apple-system,sans-serif" font-size="9.5" font-weight="700" fill="#64748B" letter-spacing="2">${row.fr}</text>
        <text x="816" y="${y}" text-anchor="end" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="700" fill="#94A3B8">${row.ar}</text>
        <text x="428" y="${y + 2}" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="18" font-weight="800" fill="#0F172A" letter-spacing="0.5">${row.value}</text>
        <line x1="40" y1="${y + 22}" x2="816" y2="${y + 22}" stroke="#EDF2F7" stroke-width="1.2"/>`
    })
    .join('')

  return `
    <svg viewBox="0 0 856 540" style="width:100%;height:100%;display:block;" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="card-clip-verso"><rect width="856" height="540" rx="24"/></clipPath>
        <linearGradient id="bg-grad-verso" x1="0" y1="0" x2="0" y2="540" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FBFDFF"/>
          <stop offset="1" stop-color="#F3F7FC"/>
        </linearGradient>
      </defs>

      <g clip-path="url(#card-clip-verso)">
        <rect width="856" height="540" fill="url(#bg-grad-verso)"/>

        <g stroke="${C_BLUE}" fill="none" opacity="0.05">
          <path d="M-20 300 C 140 230, 300 370, 460 300 S 740 230, 880 310" stroke-width="1.2"/>
          <path d="M-20 330 C 150 265, 320 395, 480 330 S 750 265, 880 340" stroke-width="0.8"/>
        </g>

        <rect x="0" y="0" width="428" height="4" fill="${C_RED}"/>
        <rect x="428" y="0" width="428" height="4" fill="${C_GREEN}"/>

        <image href="${logoUrl}" x="24" y="18" width="140" height="48" preserveAspectRatio="xMinYMid meet"/>
        <text x="832" y="38" text-anchor="end" font-family="'Noto Sans Arabic','Noto Naskh Arabic',system-ui,sans-serif" font-size="9" font-weight="700" fill="#64748B">N° IMMATRICULATION · رقم التسجيل</text>
        <text x="832" y="64" text-anchor="end" font-family="'Courier New',Courier,monospace" font-size="21" font-weight="800" fill="#0F172A" letter-spacing="3">${immatNo}</text>

        <line x1="24" y1="88" x2="832" y2="88" stroke="#E2E8F0" stroke-width="1"/>

        ${rowsSvg}

        <!-- Encart confidentialité -->
        <rect x="40" y="428" width="776" height="42" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2"/>
        <g transform="translate(56, 438)">
          <path d="M11 1L3 4v6c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V4l-8-3z" fill="${C_BLUE}" opacity="0.9"/>
          <path d="M7.5 11.5l2.5 2.5 4.5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </g>
        <text x="88" y="446" font-family="system-ui,-apple-system,sans-serif" font-size="10.5" font-weight="700" fill="#0F172A">Carte strictement personnelle et confidentielle</text>
        <text x="88" y="461" font-family="system-ui,-apple-system,sans-serif" font-size="9" font-weight="500" fill="#64748B">En cas de perte ou de vol, contactez le 080 100 2000 ou votre espace patient.</text>
        <text x="800" y="454" text-anchor="end" font-family="'Noto Sans Arabic','Noto Naskh Arabic',system-ui,sans-serif" font-size="10" font-weight="700" fill="#94A3B8">بطاقة شخصية وسرية</text>

        <!-- Pied officiel -->
        <rect x="0" y="486" width="856" height="54" fill="#010C2D"/>
        <image href="${logoUrl}" x="24" y="497" width="100" height="32" preserveAspectRatio="xMinYMid meet" style="filter:brightness(0) invert(1);"/>
        <text x="140" y="518" font-family="system-ui,-apple-system,sans-serif" font-size="14" font-weight="300" fill="rgba(255,255,255,0.3)">|</text>
        <text x="154" y="518" font-family="system-ui,-apple-system,sans-serif" font-size="10.5" font-weight="600" fill="rgba(255,255,255,0.85)" letter-spacing="0.5">www.doctorek.ma</text>
        <text x="832" y="518" text-anchor="end" font-family="'Courier New',Courier,monospace" font-size="8" font-weight="700" fill="rgba(255,255,255,0.55)" letter-spacing="2">CARTE MÉDICALE NATIONALE · MA</text>
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
