'use client'

import { useEffect, useRef, useState } from 'react'
import { fetchAudioObjectUrl } from '../api'
import LogoLoader from '@/components/LogoLoader'

interface AudioMessageProps {
  readonly mediaUrl: string
  readonly durationSec: number
  readonly mine: boolean
}

// Barres de forme d'onde déterministes (aspect vocal, stable entre rendus).
// Clé stable par barre (id figé) pour éviter l'usage de l'index en key.
const BARS = [6, 11, 8, 14, 10, 16, 9, 13, 7, 15, 11, 8, 12, 6, 14, 9, 12, 7, 10, 13, 8, 15, 9, 6]
  .map((h, i) => ({ id: `bar-${i}`, h }))

function fmt(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Lecteur vocal: charge le blob protégé à la 1re lecture, play/pause, progression sur forme d'onde. */
export function AudioMessage({ mediaUrl, durationSec, mine }: AudioMessageProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

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
      } catch {
        setLoading(false)
        setError(true)
      }
      return
    }
    audio?.play().catch(() => setError(true))
  }

  const progress = durationSec > 0 ? Math.min(1, current / durationSec) : 0
  const playedBars = Math.round(progress * BARS.length)

  const btn = mine
    ? 'bg-white text-[#007DFF] hover:bg-blue-50'
    : 'bg-[#007DFF] text-white hover:bg-[#00263C]'
  const barOn = mine ? 'bg-white' : 'bg-[#007DFF]'
  const barOff = mine ? 'bg-white/35' : 'bg-[#C7D5E4]'
  const time = mine ? 'text-blue-50/85' : 'text-[#6B7A8D]'

  function renderIcon() {
    if (loading) return <LogoLoader variant="mark" size={16} inverse={!mine} decorative />
    if (playing) return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.2" /><rect x="14" y="5" width="4" height="14" rx="1.2" /></svg>
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86A1 1 0 008 5.14z" /></svg>
  }

  const shownSec = playing || current ? current : durationSec

  return (
    <div className="flex items-center gap-2.5 py-0.5 pr-1 min-w-[196px]">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Lire le message vocal'}
        className={`flex-none flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition-colors ${btn}`}
      >
        {renderIcon()}
      </button>

      <div className="flex-1">
        <div className="flex h-7 items-center gap-[3px]">
          {BARS.map((bar, i) => (
            <span
              key={bar.id}
              className={`w-[3px] rounded-full transition-colors ${i < playedBars ? barOn : barOff}`}
              style={{ height: `${bar.h}px` }}
            />
          ))}
        </div>
        <div className={`mt-0.5 text-[10.5px] tabular-nums ${time}`}>
          {error ? 'Erreur de lecture' : fmt(shownSec)}
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
        >
          <track kind="captions" />
        </audio>
      )}
    </div>
  )
}
