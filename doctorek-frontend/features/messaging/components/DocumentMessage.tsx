'use client'

import { useState } from 'react'
import { fetchAudioObjectUrl } from '../api'
import LogoLoader from '@/components/LogoLoader'
import { Download } from 'lucide-react'

interface DocumentMessageProps {
  readonly mediaUrl: string
  readonly filename: string
  readonly size: number
  readonly mine: boolean
}

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  return `${Math.round(bytes / 1024)} Ko`
}

function isPdf(name: string): boolean {
  return name.toLowerCase().endsWith('.pdf')
}

/** Carte document: chip de type, nom, taille. Au clic, ouvre le fichier protégé (fetch authentifié). */
export function DocumentMessage({ mediaUrl, filename, size, mine }: DocumentMessageProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const pdf = isPdf(filename)

  async function open() {
    setError(false)
    setLoading(true)
    try {
      const url = await fetchAudioObjectUrl(mediaUrl)
      window.open(url, '_blank', 'noopener')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const chip = pdf ? 'bg-[#E01E5A] text-white' : 'bg-[#2EB67D] text-white'
  const surface = mine ? 'bg-white/35 hover:bg-white/60' : 'bg-[#F6F8FB] hover:bg-[#EDF2F8]'
  const sub = mine ? 'text-[#5E7EA8]' : 'text-[#6B7A8D]'
  const typeLabel = pdf ? 'PDF' : 'IMG'
  const typeName = pdf ? 'Document PDF' : 'Image'

  return (
    <button
      type="button"
      onClick={open}
      className={`flex items-center gap-3 min-w-[210px] max-w-[260px] rounded-xl p-2 text-left transition-colors ${surface}`}
      aria-label={`Ouvrir ${filename}`}
    >
      <span className={`flex-none flex h-10 w-9 items-center justify-center rounded-md text-[9px] font-bold tracking-wide shadow-sm ${chip}`}>
        {loading ? (
          <LogoLoader variant="mark" size={16} inverse decorative />
        ) : (
          typeLabel
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold leading-tight">{filename}</span>
        <span className={`mt-0.5 block text-[11px] ${sub}`}>
          {error ? "Erreur d'ouverture" : `${typeName} · ${fmtSize(size)}`}
        </span>
      </span>
      <Download className={`h-4 w-4 flex-none ${mine ? 'text-[#007DFF]' : 'text-[#9AA7B5]'}`} aria-hidden="true" />
    </button>
  )
}
