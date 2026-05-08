const PREFIX = 'doctorek_photo_'

export function getDoctorPhoto(doctorId: string): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(PREFIX + doctorId)
}

export function setDoctorPhoto(doctorId: string, dataUrl: string | null): void {
  if (dataUrl) {
    localStorage.setItem(PREFIX + doctorId, dataUrl)
  } else {
    localStorage.removeItem(PREFIX + doctorId)
  }
}
