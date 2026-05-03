import { CarteVirtuelle } from '@/lib/types'

const C_DOC_BLUE = '#0066FF'
const C_BG_CARD  = '#FFFFFF'
const C_TEXT     = '#111827'
const C_LABEL    = '#6B7280'
const C_RED      = '#C1272D'
const C_GREEN    = '#006233'

function emvChipSvg(size: number): string {
  const h = Math.round(size * 0.8)
  return `<svg width="${size}" height="${h}" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="32" rx="6" fill="url(#chipGrad)"/>
    <defs>
      <linearGradient id="chipGrad" x1="0" y1="0" x2="40" y2="32" gradientUnits="userSpaceOnUse">
        <stop stop-color="#E5C158"/>
        <stop offset="0.5" stop-color="#FCEEAA"/>
        <stop offset="1" stop-color="#C29B35"/>
      </linearGradient>
    </defs>
    <path d="M12 0V32 M28 0V32 M0 11H40 M0 21H40 M12 11H28V21H12Z" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>
    <circle cx="20" cy="16" r="3" stroke="rgba(0,0,0,0.1)" stroke-width="1" fill="none"/>
  </svg>`
}

function userPlaceholderSvg(): string {
  return `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="#D1D5DB" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>`
}

function zellSvg(patternId = 'zell'): string {
  return `<svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.03;pointer-events:none;" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="${patternId}" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M20 0 L40 20 L20 40 L0 20 Z M10 10 L30 30 M30 10 L10 30" stroke="${C_DOC_BLUE}" stroke-width="0.5" fill="none"/>
        <circle cx="20" cy="20" r="14" stroke="${C_DOC_BLUE}" stroke-width="0.3" fill="none"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#${patternId})"/>
  </svg>`
}

function doctorekWatermark(): string {
  return `<div style="position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden;display:flex;align-items:center;justify-content:center;">
    <span style="color:${C_DOC_BLUE};font-size:56px;font-weight:900;font-style:italic;opacity:0.045;letter-spacing:-0.02em;transform:rotate(-18deg);white-space:nowrap;user-select:none;">Doctorek</span>
  </div>`
}

function doubleShieldBadge(): string {
  return `<div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;gap:2px;">
    <svg viewBox="0 0 58 64" style="width:34px;overflow:visible;" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 2 L44 8 L44 27 C44 39 34 49 22 55 C10 49 0 39 0 27 L0 8 Z" fill="#3DA8FF"/>
      <path d="M36 22 L56 28 L56 39 C56 47 47 54 36 58 C25 54 16 47 16 39 L16 28 Z" fill="#00263C"/>
    </svg>
    <div style="color:#003B95;font-size:5px;font-weight:900;letter-spacing:0.06em;text-align:center;line-height:1.2;">Healthcare</div>
    <div style="color:#6B7280;font-size:3.5px;font-weight:600;letter-spacing:0.04em;text-align:center;line-height:1.2;">Security</div>
  </div>`
}

export function renderCarteRectoHtml(carte: CarteVirtuelle, firstName?: string, lastName?: string): string {
  const nom = lastName?.toUpperCase() || '—'
  const prenom = firstName || '—'
  const expiryDate = new Date()
  expiryDate.setFullYear(expiryDate.getFullYear() + 3)
  const expiry = expiryDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const photoBlock = carte.photoUrl
    ? `<img src="${carte.photoUrl}" alt="photo" style="width:100%;height:100%;object-fit:cover;"/>`
    : userPlaceholderSvg()

  return `
    <div style="position:relative;width:100%;height:100%;background:${C_BG_CARD};border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08),inset 0 0 0 1px rgba(0,0,0,0.1);font-family:system-ui,-apple-system,sans-serif;">
      ${zellSvg('zell-recto')}
      ${doctorekWatermark()}

      <!-- Red/Green stripe -->
      <div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg, ${C_RED} 0%, ${C_RED} 50%, ${C_GREEN} 50%, ${C_GREEN} 100%);"></div>

      <!-- Header -->
      <div style="padding:14px 20px 0;display:flex;justify-content:space-between;align-items:center;position:relative;z-index:2;">
        <div style="flex:1;">
          <div style="color:${C_TEXT};font-size:8px;font-weight:800;letter-spacing:0.05em;">ROYAUME DU MAROC</div>
          <div style="color:${C_LABEL};font-size:6px;font-weight:600;margin-top:1px;">MINISTÈRE DE LA SANTÉ</div>
        </div>
        <div style="flex:1;display:flex;justify-content:center;align-items:center;">
          <span style="color:#007DFF;font-size:20px;font-weight:900;font-style:italic;letter-spacing:-0.01em;line-height:1;">Doctorek</span>
        </div>
        <div style="flex:1;text-align:right;direction:rtl;">
          <div style="color:${C_TEXT};font-size:9px;font-weight:800;">المملكة المغربية</div>
          <div style="color:${C_LABEL};font-size:6px;font-weight:600;margin-top:1px;">وزارة الصحة</div>
        </div>
      </div>

      <!-- Central title -->
      <div style="text-align:center;margin-top:8px;position:relative;z-index:2;">
        <div style="color:${C_DOC_BLUE};font-size:10px;font-weight:900;letter-spacing:0.1em;border-bottom:1px solid ${C_DOC_BLUE}40;display:inline-block;padding-bottom:2px;">
          CARTE MÉDICALE NATIONALE
        </div>
      </div>

      <!-- Body -->
      <div style="padding:10px 20px;display:flex;gap:14px;position:relative;z-index:2;">
        <!-- Photo column -->
        <div style="flex-shrink:0;">
          <div style="width:74px;height:98px;background:#F3F4F6;border-radius:6px;border:1.5px solid #D1D5DB;overflow:hidden;">
            ${photoBlock}
          </div>
        </div>

        <!-- Info column -->
        <div style="flex:1;display:flex;flex-direction:column;gap:7px;justify-content:center;">
          <div>
            <div style="color:${C_LABEL};font-size:8px;font-weight:600;">Nom / النسب</div>
            <div style="color:${C_TEXT};font-size:14px;font-weight:800;line-height:1.1;">${nom}</div>
          </div>
          <div>
            <div style="color:${C_LABEL};font-size:8px;font-weight:600;">Prénom / الاسم الشخصي</div>
            <div style="color:${C_TEXT};font-size:14px;font-weight:800;line-height:1.1;">${prenom}</div>
          </div>
          <div style="display:flex;gap:18px;">
            <div>
              <div style="color:${C_LABEL};font-size:8px;font-weight:600;">Né(e) le / تاريخ الازدياد</div>
              <div style="color:${C_TEXT};font-size:12px;font-weight:700;">${carte.dateNaissance ?? '—'}</div>
            </div>
            <div>
              <div style="color:${C_LABEL};font-size:8px;font-weight:600;">N° Carte / رقم البطاقة</div>
              <div style="color:${C_TEXT};font-size:12px;font-weight:800;">${carte.cardRef ?? '—'}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="position:absolute;bottom:0;left:0;right:0;padding:8px 20px;background:#F8FAFC;border-top:1px solid #E5E7EB;display:flex;justify-content:space-between;align-items:center;z-index:2;">
        <span style="color:#007DFF;font-size:11px;font-weight:900;font-style:italic;letter-spacing:-0.01em;">Doctorek</span>
        <div style="text-align:right;">
          <span style="color:${C_LABEL};font-size:6px;font-weight:600;margin-right:4px;">Valable jusqu'au:</span>
          <span style="color:${C_TEXT};font-size:9px;font-weight:800;">${expiry}</span>
        </div>
      </div>
    </div>
  `
}

export function renderCarteVersoHtml(carte: CarteVirtuelle, firstName?: string, lastName?: string): string {
  const nom = lastName?.toUpperCase() || '—'
  const prenom = firstName || '—'
  const createdYear = new Date().getFullYear()

  const rows = [
    { fr: 'Nom',                   ar: 'النسب',               value: nom },
    { fr: 'Prénom',                ar: 'الاسم الشخصي',        value: prenom },
    { fr: 'Date de naissance',     ar: 'تاريخ الازدياد',      value: carte.dateNaissance ?? '—' },
    { fr: 'C.I.N.',                ar: 'ب.ت.و',               value: carte.numIdentite ?? '—' },
    { fr: "Date d'immatriculation", ar: 'تاريخ التسجيل',      value: `01/01/${createdYear}` },
  ]

  const rowsHtml = rows.map(row => `
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #E5E7EB;padding-bottom:3px;margin-bottom:0;">
      <span style="color:${C_LABEL};font-size:6px;font-weight:600;min-width:70px;flex-shrink:0;">${row.fr}</span>
      <span style="color:${C_TEXT};font-size:10px;font-weight:800;flex:1;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 4px;">${row.value}</span>
      <span style="color:${C_LABEL};font-size:6px;font-weight:600;direction:rtl;text-align:right;min-width:70px;flex-shrink:0;">${row.ar}</span>
    </div>
  `).join('')

  return `
    <div style="position:relative;width:100%;height:100%;background:${C_BG_CARD};border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08),inset 0 0 0 1px rgba(0,0,0,0.1);font-family:system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;">
      ${zellSvg('zell-verso')}
      ${doctorekWatermark()}

      <!-- Red/Green stripe -->
      <div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg, ${C_RED} 0%, ${C_RED} 50%, ${C_GREEN} 50%, ${C_GREEN} 100%);z-index:3;"></div>

      <!-- Blue header -->
      <div style="padding:14px 20px 8px;background:${C_DOC_BLUE};position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
        <span style="color:#FFFFFF;font-size:16px;font-weight:900;font-style:italic;letter-spacing:-0.01em;">Doctorek</span>
        <div style="text-align:right;">
          <div style="color:rgba(255,255,255,0.7);font-size:6px;font-weight:600;letter-spacing:0.05em;">N° D'IMMATRICULATION / رقم التسجيل</div>
          <div style="color:#FFFFFF;font-size:12px;font-weight:900;font-family:'Courier New',Courier,monospace;letter-spacing:0.08em;margin-top:1px;">
            ${carte.assuranceNumero ?? carte.cardRef ?? '—'}
          </div>
        </div>
      </div>

      <!-- Bilingual rows -->
      <div style="flex:1;padding:10px 20px;position:relative;z-index:2;display:flex;flex-direction:column;justify-content:center;gap:4px;">
        ${rowsHtml}
      </div>

      <!-- Footer -->
      <div style="background:#F8FAFC;border-top:1px solid #E5E7EB;padding:6px 20px;display:flex;justify-content:space-between;align-items:center;position:relative;z-index:2;">
        <div style="background:${C_DOC_BLUE};color:white;padding:1px 5px;border-radius:3px;font-size:7px;font-weight:900;font-style:italic;">Doctorek</div>
        <div style="font-family:'Courier New',Courier,monospace;font-size:6px;color:${C_LABEL};letter-spacing:0.08em;font-weight:600;">CARTE MÉDICALE NATIONALE — MA</div>
        ${doubleShieldBadge()}
      </div>
    </div>
  `
}
