export function parseMapUrl(text: string): { lat: number; lng: number } | null {
  const t = text.trim()

  let m = t.match(/\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) }

  m = t.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) }

  m = t.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) }

  m = t.match(/#map=\d+\/(-?\d+\.?\d*)\/(-?\d+\.?\d*)/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) }

  m = t.match(/[?&]cp=(-?\d+\.?\d*)~(-?\d+\.?\d*)/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) }

  m = t.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) }

  return null
}

export function compressImage(dataUrl: string, maxSize = 256, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = dataUrl
  })
}

export function parseApiError(error: unknown): string {
  const msg = error instanceof Error ? error.message : ''
  if (msg.includes('phone') || msg.includes('users_phone_key')) {
    return 'Ce numéro de téléphone est déjà utilisé par un autre compte.'
  }
  if (msg.includes('inpe') || msg.includes('users_inpe_key')) {
    return 'Cet INPE est déjà associé à un autre compte.'
  }
  if (msg.includes('email') || msg.includes('users_email_key')) {
    return 'Cette adresse e-mail est déjà utilisée par un autre compte.'
  }
  return 'Une erreur est survenue lors de la mise à jour. Veuillez réessayer.'
}
