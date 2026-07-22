'use client'

import { useState } from 'react'
import { fetchAudioObjectUrl } from '../api'

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
  const surface = mine ? 'bg-white/12 hover:bg-white/20' : 'bg-[#F6F8FB] hover:bg-[#EDF2F8]'
  const sub = mine ? 'text-blue-50/80' : 'text-[#6B7A8D]'

  return (
    <button
      type="button"
      onClick={open}
      className={`flex items-center gap-3 min-w-[210px] max-w-[260px] rounded-xl p-2 text-left transition-colors ${surface}`}
      aria-label={`Ouvrir ${filename}`}
    >
      <span className={`flex-none flex h-10 w-9 items-center justify-center rounded-md text-[9px] font-bold tracking-wide shadow-sm ${chip}`}>
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          pdf ? 'PDF' : 'IMG'
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold leading-tight">{filename}</span>
        <span className={`mt-0.5 block text-[11px] ${sub}`}>
          {error ? "Erreur d'ouverture" : `${pdf ? 'Document PDF' : 'Image'} · ${fmtSize(size)}`}
        </span>
      </span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           className={`flex-none ${mine ? 'text-white/70' : 'text-[#9AA7B5]'}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
      </svg>
    </button>
  )
}
