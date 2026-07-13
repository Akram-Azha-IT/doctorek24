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
}

function buildRectoSvg(
  fullName: string,
  maskedCin: string,
  cnss: string,
  logoUrl: string,
  photoBlock: string,
  qrBlock: string,
): string {
  return `
    <svg viewBox="0 0 856 540" style="width:100%;height:100%;display:block;" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="card-clip-recto"><rect width="856" height="540" rx="28"/></clipPath>
        <clipPath id="photo-clip-recto"><circle cx="132" cy="292" r="82"/></clipPath>
        <clipPath id="name-clip-recto"><rect x="248" y="198" width="418" height="54"/></clipPath>
        <linearGradient id="chip-grad-recto" x1="0" y1="0" x2="60" y2="46" gradientUnits="userSpaceOnUse">
          <stop stop-color="#E5C158"/>
          <stop offset="0.5" stop-color="#FCEEAA"/>
          <stop offset="1" stop-color="#C29B35"/>
        </linearGradient>
        <pattern id="zellige-recto" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M20 0 L40 20 L20 40 L0 20 Z M10 10 L30 30 M30 10 L10 30" stroke="#0066FF" stroke-width="0.5" fill="none"/>
          <circle cx="20" cy="20" r="14" stroke="#0066FF" stroke-width="0.3" fill="none"/>
        </pattern>
      </defs>

      <g clip-path="url(#card-clip-recto)">
        <rect width="856" height="540" fill="#FFFFFF"/>
        <rect width="856" height="540" fill="url(#zellige-recto)" opacity="0.03"/>

        <rect x="0" y="0" width="428" height="7" fill="${C_RED}"/>
        <rect x="428" y="0" width="428" height="7" fill="${C_GREEN}"/>

        <image href="${logoUrl}" x="20" y="16" width="170" height="58" preserveAspectRatio="xMinYMid meet"/>

        <text x="832" y="44" text-anchor="end" font-family="system-ui,-apple-system,sans-serif" font-size="14" font-weight="800" fill="${C_TEXT}">المملكة المغربية</text>
        <text x="832" y="65" text-anchor="end" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="700" fill="${C_BLUE}" letter-spacing="0.5">Carte Santé Virtuelle</text>

        <line x1="24" y1="96" x2="832" y2="96" stroke="${C_BLUE}" stroke-width="0.6" opacity="0.15"/>
        <path d="M24 96 L310 96 L326 96 L336 80 L346 112 L356 80 L366 96 L392 96 L832 96" stroke="${C_BLUE}" stroke-width="1.5" opacity="0.45" stroke-linecap="round" stroke-linejoin="round" fill="none"/>

        <circle cx="132" cy="292" r="90" fill="none" stroke="${C_BLUE}" stroke-width="3" opacity="0.75"/>
        ${photoBlock}

        <g clip-path="url(#name-clip-recto)">
          <text x="248" y="236" font-family="system-ui,-apple-system,sans-serif" font-size="22" font-weight="900" fill="${C_TEXT}" letter-spacing="0.3">${fullName}</text>
        </g>

        <text x="248" y="272" font-family="system-ui,-apple-system,sans-serif" font-size="8" font-weight="700" fill="${C_LABEL}" letter-spacing="2">CIN</text>
        <text x="248" y="295" font-family="'Courier New',Courier,monospace" font-size="17" font-weight="800" fill="${C_TEXT}" letter-spacing="2">${maskedCin}</text>
        <line x1="248" y1="307" x2="562" y2="307" stroke="#E5E7EB" stroke-width="1"/>

        <text x="248" y="327" font-family="system-ui,-apple-system,sans-serif" font-size="8" font-weight="700" fill="${C_LABEL}" letter-spacing="2">N° CNSS / AMO</text>
        <text x="248" y="350" font-family="'Courier New',Courier,monospace" font-size="16" font-weight="800" fill="${C_TEXT}" letter-spacing="1.5">${cnss}</text>

        <g transform="translate(694, 226)">
          <rect width="62" height="48" rx="8" fill="url(#chip-grad-recto)"/>
          <line x1="19" y1="0" x2="19" y2="48" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>
          <line x1="43" y1="0" x2="43" y2="48" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>
          <line x1="0" y1="16" x2="62" y2="16" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>
          <line x1="0" y1="32" x2="62" y2="32" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>
          <rect x="19" y="16" width="24" height="16" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="0.8"/>
          <circle cx="31" cy="24" r="3.5" stroke="rgba(0,0,0,0.1)" stroke-width="0.8" fill="none"/>
        </g>

        ${qrBlock}

        <rect x="0" y="460" width="856" height="80" fill="${C_BLUE}"/>
        <image href="${logoUrl}" x="24" y="472" width="120" height="38" preserveAspectRatio="xMinYMid meet" style="filter:brightness(0) invert(1);"/>

        <text x="158" y="500" font-family="system-ui,-apple-system,sans-serif" font-size="18" font-weight="300" fill="rgba(255,255,255,0.35)">|</text>
        <text x="174" y="500" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="600" fill="rgba(255,255,255,0.85)" letter-spacing="0.5">www.doctorek.ma</text>
        <text x="334" y="500" font-family="system-ui,-apple-system,sans-serif" font-size="18" font-weight="300" fill="rgba(255,255,255,0.35)">|</text>

        <g transform="translate(352, 488)" stroke="rgba(255,255,255,0.85)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">
          <path d="M14 10.5v2a1.5 1.5 0 01-1.6 1.5 12 12 0 01-5.2-1.8 12 12 0 01-3.6-3.6A12 12 0 011.8 3.1 1.5 1.5 0 013.3 1.5h2a1.5 1.5 0 011.5 1.3c.1.7.3 1.4.5 2.1a1.5 1.5 0 01-.3 1.6L6.2 7.3A12 12 0 009.7 10.8l.8-.8a1.5 1.5 0 011.6-.3c.7.2 1.4.4 2.1.5A1.5 1.5 0 0114 10.5z"/>
        </g>
        <text x="376" y="500" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="600" fill="rgba(255,255,255,0.85)" letter-spacing="0.5">080 100 2000</text>
      </g>
    </svg>
  `
}

export function renderCarteRectoHtml(
  carte: CarteVirtuelle,
  profile: PatientProfile | null | undefined,
  firstName: string | undefined,
  lastName: string | undefined,
  { origin, qrDataUrl }: RenderOptions,
): string {
  const fullName =
    [firstName, lastName?.toUpperCase()].filter(Boolean).join(' ') || 'NOM ET PRÉNOM'

  const rawCin = profile?.numIdentite ?? ''
  const maskedCin =
    rawCin.length >= 3
      ? rawCin[0] + '*'.repeat(rawCin.length - 2) + rawCin[rawCin.length - 1]
      : rawCin || '-'

  const cnss = carte.assuranceNumero ?? '-'
  const logoUrl = `${origin}/logo0.png`

  const photoBlock = profile?.photoUrl
    ? `<image href="${profile.photoUrl}" x="50" y="210" width="164" height="164" clip-path="url(#photo-clip-recto)" preserveAspectRatio="xMidYMid slice"/>`
    : `<g clip-path="url(#photo-clip-recto)">
        <circle cx="132" cy="292" r="82" fill="${C_BLUE}"/>
        <circle cx="132" cy="264" r="29" fill="white" opacity="0.9"/>
        <ellipse cx="132" cy="344" rx="44" ry="36" fill="white" opacity="0.9"/>
      </g>`

  const qrBlock = qrDataUrl
    ? `<g transform="translate(682, 290)">
        <rect width="84" height="84" rx="5" fill="#FFFFFF"/>
        <image href="${qrDataUrl}" x="2" y="2" width="80" height="80"/>
      </g>`
    : `<g transform="translate(682, 290)">
        <rect width="84" height="84" rx="5" fill="#F3F4F6"/>
        <rect x="8" y="8" width="24" height="24" rx="2" fill="none" stroke="${C_TEXT}" stroke-width="2"/>
        <rect x="14" y="14" width="12" height="12" fill="${C_TEXT}"/>
        <rect x="52" y="8" width="24" height="24" rx="2" fill="none" stroke="${C_TEXT}" stroke-width="2"/>
        <rect x="58" y="14" width="12" height="12" fill="${C_TEXT}"/>
        <rect x="8" y="52" width="24" height="24" rx="2" fill="none" stroke="${C_TEXT}" stroke-width="2"/>
        <rect x="14" y="58" width="12" height="12" fill="${C_TEXT}"/>
        <rect x="42" y="44" width="8" height="8" fill="${C_TEXT}"/>
        <rect x="58" y="52" width="16" height="8" fill="${C_TEXT}"/>
        <rect x="50" y="68" width="8" height="8" fill="${C_TEXT}"/>
        <rect x="66" y="68" width="8" height="8" fill="${C_TEXT}"/>
        <rect x="42" y="10" width="8" height="16" fill="${C_TEXT}"/>
        <rect x="10" y="42" width="16" height="8" fill="${C_TEXT}"/>
      </g>`

  return buildRectoSvg(fullName, maskedCin, cnss, logoUrl, photoBlock, qrBlock)
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
}): string {
  const { fullName, maskedCin, cnss, cardRef, qrDataUrl, origin, photoUrl } = opts
  const logoUrl = `${origin}/logo0.png`

  const chip = (label: string, value: string) => `
    <div style="display:flex;flex-direction:column;gap:2px;padding:10px 18px;background:rgba(255,255,255,0.10);border:1px solid rgba(255,255,255,0.18);border-radius:14px;">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#B6DAF7;">${label}</span>
      <span style="font-size:17px;font-weight:700;color:#FFFFFF;">${value}</span>
    </div>`

  const chips = [
    maskedCin && maskedCin !== '-' ? chip('CIN', maskedCin) : '',
    cnss && cnss !== '-' ? chip('N° CNSS / AMO', cnss) : '',
  ].join('')

  const photoBlock = photoUrl
    ? `<img src="${photoUrl}" style="width:140px;height:140px;border-radius:50%;object-fit:cover;border:4px solid rgba(255,255,255,0.35);box-shadow:0 10px 30px rgba(1,12,45,0.35);" />`
    : ''

  const qrBlock = qrDataUrl
    ? `<div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
        <div style="background:#FFFFFF;border-radius:18px;padding:10px;box-shadow:0 10px 30px rgba(1,12,45,0.35);">
          <img src="${qrDataUrl}" style="width:130px;height:130px;display:block;" />
        </div>
       </div>`
    : ''

  return `
    <div style="position:relative;width:1032px;height:336px;background:linear-gradient(115deg, #042651 0%, #0C4A83 45%, #007DFF 100%);overflow:hidden;font-family:'Inter',system-ui,sans-serif;">
      <!-- décor discret -->
      <div style="position:absolute;right:-120px;top:-140px;width:420px;height:420px;border-radius:50%;background:rgba(255,255,255,0.06);"></div>
      <div style="position:absolute;right:40px;bottom:-180px;width:340px;height:340px;border-radius:50%;background:rgba(61,168,255,0.14);"></div>
      <div style="position:absolute;left:-90px;bottom:-160px;width:300px;height:300px;border-radius:50%;background:rgba(255,255,255,0.05);"></div>

      <div style="position:relative;height:100%;display:flex;align-items:center;justify-content:space-between;padding:0 56px;box-sizing:border-box;">
        <!-- gauche : marque + identité -->
        <div style="display:flex;flex-direction:column;justify-content:center;gap:16px;min-width:0;">
          <img src="${logoUrl}" style="height:40px;width:auto;align-self:flex-start;filter:brightness(0) invert(1);" />
          <div>
            <div style="font-size:12px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#3DA8FF;margin-bottom:6px;">Carte Santé Virtuelle</div>
            <div style="font-size:44px;font-weight:800;line-height:1.05;color:#FFFFFF;letter-spacing:-0.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:520px;">${fullName}</div>
          </div>
          <div style="display:flex;gap:12px;">${chips}</div>
          <div style="font-size:14px;font-weight:600;letter-spacing:0.08em;color:#B6DAF7;">${cardRef}</div>
        </div>

        <!-- droite : photo + QR -->
        <div style="display:flex;align-items:center;gap:28px;">
          ${photoBlock}
          ${qrBlock}
        </div>
      </div>
    </div>
  `
}

export function renderCarteVersoHtml(
  carte: CarteVirtuelle,
  profile: PatientProfile | null | undefined,
  firstName: string | undefined,
  lastName: string | undefined,
  { origin }: RenderOptions,
): string {
  const nom = lastName?.toUpperCase() || '-'
  const prenom = firstName || '-'
  const createdYear = new Date().getFullYear()
  const logoUrl = `${origin}/logo0.png`

  const rows = [
    { fr: 'Nom',                    ar: 'النسب',           value: nom },
    { fr: 'Prénom',                 ar: 'الاسم الشخصي',     value: prenom },
    { fr: 'Date de naissance',      ar: 'تاريخ الازدياد',    value: profile?.dateNaissance ?? '-' },
    { fr: 'C.I.N.',                 ar: 'ب.ت.و',            value: profile?.numIdentite ?? '-' },
    { fr: "Date d'immatriculation", ar: 'تاريخ التسجيل',     value: `01/01/${createdYear}` },
  ]

  const rowsHtml = rows
    .map(
      (row, i) => `
      <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:4px;background:${i % 2 === 0 ? 'rgba(0,125,255,0.04)' : 'transparent'};border-radius:5px;padding:5px 10px;">
        <span style="color:${C_LABEL};font-size:7px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;">${row.fr}</span>
        <span style="color:${C_TEXT};font-size:12px;font-weight:800;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:0.02em;border-left:2px solid ${C_BLUE}30;border-right:2px solid ${C_BLUE}30;padding:0 10px;">${row.value}</span>
        <span style="color:${C_LABEL};font-size:7px;font-weight:700;direction:rtl;text-align:right;letter-spacing:0.01em;">${row.ar}</span>
      </div>`,
    )
    .join('')

  return `
    <div style="position:relative;width:100%;height:100%;border-radius:12px;overflow:hidden;background:#F8FAFD;box-shadow:0 4px 24px rgba(0,125,255,0.12), inset 0 0 0 1px rgba(0,125,255,0.1);font-family:system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;">
      <div style="position:absolute;inset:0;z-index:0;pointer-events:none;display:flex;align-items:center;justify-content:center;overflow:hidden;">
        <img src="${logoUrl}" alt="" style="width:55%;opacity:0.04;transform:rotate(-12deg);filter:saturate(0);"/>
      </div>

      <div style="position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(90deg, ${C_RED} 50%, ${C_GREEN} 50%);z-index:3;"></div>

      <div style="background:linear-gradient(135deg, ${C_BLUE} 0%, ${C_DARK} 100%);padding:16px 22px;position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <img src="${logoUrl}" alt="Doctorek" style="height:28px;width:auto;filter:brightness(0) invert(1);flex-shrink:0;"/>
        <div style="text-align:right;flex-shrink:0;">
          <div style="color:rgba(255,255,255,0.6);font-size:7px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">N° Immatriculation / رقم التسجيل</div>
          <div style="color:#FFFFFF;font-size:15px;font-weight:900;font-family:'Courier New',Courier,monospace;letter-spacing:0.1em;margin-top:2px;">${carte.assuranceNumero ?? carte.cardRef ?? '-'}</div>
        </div>
      </div>

      <div style="flex:1;padding:14px 22px;position:relative;z-index:2;display:flex;flex-direction:column;gap:5px;">
        ${rowsHtml}
      </div>

      <div style="margin:0 22px 10px;background:linear-gradient(135deg, #EEF6FF 0%, #F0FDF9 100%);border:1px solid ${C_BLUE}25;border-radius:8px;padding:7px 12px;display:flex;align-items:center;gap:10px;position:relative;z-index:2;">
        <svg viewBox="0 0 24 24" style="width:18px;flex-shrink:0;" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" fill="${C_BLUE}" opacity="0.85"/>
          <path d="M9 12l2 2 4-4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div style="flex:1;">
          <div style="color:${C_TEXT};font-size:7px;font-weight:700;line-height:1.4;">Carte strictement personnelle et confidentielle</div>
          <div style="color:${C_LABEL};font-size:6px;font-weight:500;margin-top:1px;line-height:1.3;">En cas de perte ou vol, contactez le Ministère de la Santé.</div>
        </div>
        <svg viewBox="0 0 80 80" style="width:36px;flex-shrink:0;" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="80" height="80" rx="4" fill="#F3F4F6"/>
          <path d="M8 8H32V32H8V8ZM16 16H24V24H16V16Z" fill="${C_TEXT}"/>
          <path d="M48 8H72V32H48V8ZM56 16H64V24H56V16Z" fill="${C_TEXT}"/>
          <path d="M8 48H32V72H8V48ZM16 56H24V64H16V56Z" fill="${C_TEXT}"/>
          <rect x="40" y="40" width="8" height="8" fill="${C_TEXT}"/>
          <rect x="56" y="48" width="16" height="8" fill="${C_TEXT}"/>
          <rect x="48" y="64" width="8" height="8" fill="${C_TEXT}"/>
          <rect x="64" y="64" width="8" height="8" fill="${C_TEXT}"/>
          <rect x="40" y="8" width="8" height="16" fill="${C_TEXT}"/>
          <rect x="8" y="40" width="16" height="8" fill="${C_TEXT}"/>
        </svg>
      </div>

      <div style="background:${C_BLUE};padding:8px 22px;display:flex;justify-content:space-between;align-items:center;position:relative;z-index:2;">
        <img src="${logoUrl}" alt="Doctorek" style="height:22px;width:auto;filter:brightness(0) invert(1);"/>
        <div style="font-family:'Courier New',Courier,monospace;font-size:6.5px;color:rgba(255,255,255,0.7);letter-spacing:0.08em;font-weight:600;">CARTE MÉDICALE NATIONALE - MA</div>
      </div>
    </div>
  `
}
