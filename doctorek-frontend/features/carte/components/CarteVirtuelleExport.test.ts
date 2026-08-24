import { describe, expect, test } from 'vitest'
import {
  buildRectoSvg,
  buildVersoSvg,
  buildWalletHeroSvg,
  nameFontSize,
  renderCarteRectoHtml,
  renderCarteVersoHtml,
} from './CarteVirtuelleExport'
import type { CarteVirtuelle, PatientProfile } from '@/lib/types'

const LOGO = 'data:image/png;base64,LOGO'
const QR = 'data:image/png;base64,QR'

function recto(overrides: Partial<Parameters<typeof buildRectoSvg>> = {}) {
  void overrides
  return buildRectoSvg('Akram BENHAMMOU', 'A*****9', '123456789012', 'VMC-2026-90446D62', LOGO, undefined, QR)
}

describe('nameFontSize', () => {
  test('réduit le corps à mesure que le nom s’allonge', () => {
    expect(nameFontSize('Ali Idrissi')).toBe(32)
    expect(nameFontSize('Abdelkarim Benjelloun')).toBe(28)
    expect(nameFontSize('Abdelkarim Benjelloun El Fassi')).toBe(24)
  })
})

describe('buildRectoSvg', () => {
  test('rend un SVG au format carte (ratio CR80) avec les données du titulaire', () => {
    const svg = recto()
    expect(svg).toContain('viewBox="0 0 856 540"')
    expect(svg).toContain('Akram BENHAMMOU')
    expect(svg).toContain('A*****9')
    expect(svg).toContain('123456789012')
    expect(svg).toContain('VMC-2026-90446D62')
  })

  test('affiche « Non renseigné » plutôt qu’un tiret nu quand un champ est vide', () => {
    const svg = buildRectoSvg('Ali Idrissi', '-', '', 'VMC-1', LOGO)
    expect(svg).toContain('Non renseigné')
    // La valeur vide ne doit pas être rendue telle quelle dans un champ de données.
    expect(svg).not.toMatch(/letter-spacing="1.6">-</)
  })

  test('centre la puce sous le portrait', () => {
    // Portrait : x=48, largeur 168 → centre 132 ; puce de 56 → x = 132 - 28.
    expect(recto()).toContain('translate(104, 360)')
  })

  test('intègre le QR fourni et bascule sur un repli sans QR', () => {
    expect(recto()).toContain(QR)
    const sansQr = buildRectoSvg('Ali Idrissi', 'A1', 'C1', 'VMC-1', LOGO)
    expect(sansQr).not.toContain(QR)
    expect(sansQr).toContain('>QR<')
  })

  test('affiche la photo du patient quand elle existe, sinon une silhouette', () => {
    const avecPhoto = buildRectoSvg('Ali Idrissi', 'A1', 'C1', 'VMC-1', LOGO, 'https://cdn/photo.jpg')
    expect(avecPhoto).toContain('https://cdn/photo.jpg')
    expect(recto()).toContain('<ellipse')
  })

  test('porte le liseré national et la mention officielle bilingue', () => {
    const svg = recto()
    expect(svg).toContain('#C1272D')
    expect(svg).toContain('#006233')
    expect(svg).toContain('ROYAUME DU MAROC')
    expect(svg).toContain('المملكة المغربية')
  })

  test('inclut la trame de sécurité et la courbe d’angle', () => {
    const svg = recto()
    expect(svg).toContain('arc-grad-recto')
    // Trame de triangles : lignes horizontales + diagonales générées par le maillage.
    expect((svg.match(/<path d="M/g) ?? []).length).toBeGreaterThan(30)
  })
})

describe('buildVersoSvg', () => {
  test('rend les données d’état civil et le numéro d’immatriculation', () => {
    const svg = buildVersoSvg('BENHAMMOU', 'Akram', '1998-04-12', 'A123456', '01/01/2026', 'IMM-77', LOGO)
    expect(svg).toContain('viewBox="0 0 856 540"')
    expect(svg).toContain('BENHAMMOU')
    expect(svg).toContain('Akram')
    expect(svg).toContain('1998-04-12')
    expect(svg).toContain('IMM-77')
    expect(svg).toContain('Carte strictement personnelle et confidentielle')
  })

  test('marque les champs non renseignés', () => {
    const svg = buildVersoSvg('-', '-', '-', '-', '01/01/2026', 'IMM-77', LOGO)
    expect(svg).toContain('Non renseigné')
  })
})

const carte = {
  id: 'c1',
  patientId: 'p1',
  cardRef: 'VMC-2026-ABC',
  assuranceNumero: 'CNSS-42',
} as CarteVirtuelle

const profile = { numIdentite: 'AB123456', photoUrl: null, dateNaissance: '1998-04-12' } as PatientProfile

describe('renderCarteRectoHtml', () => {
  test('masque le CIN en ne laissant que le premier et le dernier caractère', () => {
    const html = renderCarteRectoHtml(carte, profile, 'Akram', 'Benhammou', { origin: 'https://x' })
    expect(html).toContain('A******6')
    expect(html).not.toContain('AB123456')
  })

  test('met le nom de famille en capitales et retombe sur le logo servi par l’origine', () => {
    const html = renderCarteRectoHtml(carte, profile, 'Akram', 'Benhammou', { origin: 'https://x' })
    expect(html).toContain('Akram BENHAMMOU')
    expect(html).toContain('https://x/logo0.png')
  })

  test('préfère le logo inliné quand il est fourni', () => {
    const html = renderCarteRectoHtml(carte, profile, 'Akram', 'Benhammou', {
      origin: 'https://x',
      logoDataUrl: LOGO,
    })
    expect(html).toContain(LOGO)
    expect(html).not.toContain('https://x/logo0.png')
  })

  test('affiche un libellé de repli quand le nom est absent', () => {
    const html = renderCarteRectoHtml(carte, null, undefined, undefined, { origin: 'https://x' })
    expect(html).toContain('NOM ET PRÉNOM')
  })
})

describe('renderCarteVersoHtml', () => {
  test('reprend les données du profil', () => {
    const html = renderCarteVersoHtml(carte, profile, 'Akram', 'Benhammou', { origin: 'https://x' })
    expect(html).toContain('BENHAMMOU')
    expect(html).toContain('AB123456')
  })
})

describe('buildWalletHeroSvg', () => {
  test('rend la bannière du pass et masque les champs absents', () => {
    const svg = buildWalletHeroSvg({
      fullName: 'Akram BENHAMMOU',
      maskedCin: '-',
      cnss: 'CNSS-42',
      cardRef: 'VMC-2026-ABC',
      origin: 'https://x',
      logoDataUrl: LOGO,
    })
    expect(svg).toContain('viewBox="0 0 1032 336"')
    expect(svg).toContain('Akram BENHAMMOU')
    expect(svg).toContain('CNSS-42')
    expect(svg).toContain('VMC-2026-ABC')
    // Un CIN absent ne doit pas produire de champ vide dans le pass.
    expect(svg).not.toContain('C.I.N.')
  })
})
