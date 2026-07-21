'use client'

import { useEffect, useRef, useState } from 'react'
import { fetchAudioObjectUrl } from '../api'

interface AudioMessageProps {
  mediaUrl: string
  durationSec: number
  mine: boolean
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Lecteur vocal : charge le blob protégé à la 1re lecture, play/pause + progression. */
export function AudioMessage({ mediaUrl, durationSec, mine }: AudioMessageProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  // Révoque le blob URL au démontage.
  useEffect(() => {
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [objectUrl])

  async function toggle() {
    setError(false)
    const audio = audioRef.current
    if (playing && audio) { audio.pause(); return }

    if (!objectUrl) {
      try {
        setLoading(true)
        const url = await fetchAudioObjectUrl(mediaUrl)
        setObjectUrl(url)
        setLoading(false)
        // lecture démarrée par l'effet onCanPlay ci-dessous
      } catch {
        setLoading(false)
        setError(true)
      }
      return
    }
    audio?.play().catch(() => setError(true))
  }

  const accent = mine ? 'text-white' : 'text-[#007DFF]'
  const track = mine ? 'bg-white/30' : 'bg-[#007DFF]/20'
  const fill = mine ? 'bg-white' : 'bg-[#007DFF]'
  const pct = durationSec > 0 ? Math.min(100, (current / durationSec) * 100) : 0

  return (
    <div className="flex items-center gap-2.5 min-w-[180px]">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Lire le message vocal'}
        className={`flex-none flex h-9 w-9 items-center justify-center rounded-full ${
          mine ? 'bg-white/20 hover:bg-white/30' : 'bg-[#007DFF]/10 hover:bg-[#007DFF]/20'
        } transition-colors ${accent}`}
      >
        {loading ? (
          <span className={`h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent`} />
        ) : playing ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        )}
      </button>

      <div className="flex-1">
        <div className={`h-1 rounded-full ${track}`}>
          <div className={`h-1 rounded-full ${fill}`} style={{ width: `${pct}%` }} />
        </div>
        <div className={`mt-1 text-[10px] ${mine ? 'text-blue-100' : 'text-gray-400'}`}>
          {error ? 'Erreur de lecture' : fmt(playing || current ? current : durationSec)}
        </div>
      </div>

      {objectUrl && (
        <audio
          ref={audioRef}
          src={objectUrl}
          onCanPlay={() => { if (!playing) audioRef.current?.play().catch(() => setError(true)) }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={() => setCurrent(audioRef.current?.currentTime ?? 0)}
          onEnded={() => { setPlaying(false); setCurrent(0) }}
        />
      )}
    </div>
  )
}
