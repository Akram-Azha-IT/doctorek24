import { Resvg } from '@resvg/resvg-js'

const CARD_WIDTH = 856
const CARD_HEIGHT = 540
const EXPORT_PADDING = 40
const EXPORT_GAP = 40
const EXPORT_WIDTH = CARD_WIDTH + EXPORT_PADDING * 2
const EXPORT_HEIGHT = CARD_HEIGHT * 2 + EXPORT_PADDING * 2 + EXPORT_GAP
const RETINA_SCALE = 2

function constrainCardSvg(svg: string): string {
  return svg
    .replace('<svg ', `<svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" `)
    .replace('style="width:100%;height:100%;display:block;"', 'style="display:block;"')
}

export async function inlineRemoteImage(
  source: string | null | undefined,
): Promise<string | undefined> {
  if (!source || source.startsWith('data:')) return source ?? undefined

  try {
    const response = await fetch(source, { signal: AbortSignal.timeout(8_000) })
    if (!response.ok) return undefined

    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = response.headers.get('content-type') ?? 'image/jpeg'
    return `data:${contentType};base64,${buffer.toString('base64')}`
  } catch {
    return undefined
  }
}

/** Assemble le recto et le verso sans passer par un document HTML. */
export function composeCarteExportSvg(rectoSvg: string, versoSvg: string): string {
  const versoY = EXPORT_PADDING + CARD_HEIGHT + EXPORT_GAP
  const constrainedRecto = constrainCardSvg(rectoSvg)
  const constrainedVerso = constrainCardSvg(versoSvg)

  return `
    <svg xmlns="http://www.w3.org/2000/svg"
      width="${EXPORT_WIDTH}" height="${EXPORT_HEIGHT}"
      viewBox="0 0 ${EXPORT_WIDTH} ${EXPORT_HEIGHT}">
      <rect width="100%" height="100%" fill="#FFFFFF"/>
      <g transform="translate(${EXPORT_PADDING} ${EXPORT_PADDING})">${constrainedRecto}</g>
      <g transform="translate(${EXPORT_PADDING} ${versoY})">${constrainedVerso}</g>
    </svg>
  `
}

/** Convertit un SVG en PNG de manière déterministe, sans Chrome ni Puppeteer. */
export function renderSvgToPng(svg: string, outputWidth: number): Buffer {
  const sansSerifFamily =
    process.platform === 'win32'
      ? 'Segoe UI'
      : process.platform === 'darwin'
        ? 'Helvetica'
        : 'Noto Sans'
  const monospaceFamily = process.platform === 'win32' ? 'Consolas' : 'DejaVu Sans Mono'

  const renderer = new Resvg(svg, {
    background: '#FFFFFF',
    fitTo: { mode: 'width', value: outputWidth },
    imageRendering: 0,
    shapeRendering: 2,
    textRendering: 1,
    font: {
      loadSystemFonts: true,
      defaultFontFamily: sansSerifFamily,
      sansSerifFamily,
      serifFamily: sansSerifFamily,
      monospaceFamily,
    },
  })

  return renderer.render().asPng()
}

export function renderCarteExportPng(rectoSvg: string, versoSvg: string): Buffer {
  return renderSvgToPng(
    composeCarteExportSvg(rectoSvg, versoSvg),
    EXPORT_WIDTH * RETINA_SCALE,
  )
}
