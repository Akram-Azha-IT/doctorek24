'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export const MAX_AUDIO_SEC = 120 // aligné sur le cap backend (2 min)

type RecorderState = 'idle' | 'recording' | 'error'

interface RecordingResult {
  blob: Blob
  durationSec: number
}

function pickMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
  if (typeof MediaRecorder === 'undefined') return ''
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
}

/**
 * Enregistreur vocal basé sur MediaRecorder. Cap dur à MAX_AUDIO_SEC (auto-stop).
 * Libère le micro dès l'arrêt. `stop()` renvoie le blob + la durée ; `cancel()` jette.
 */
export function useAudioRecorder() {
  const [state, setState] = useState<RecorderState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef<number>(0)
  const resolveRef = useRef<((r: RecordingResult | null) => void) | null>(null)

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    recorderRef.current = null
  }, [])

  useEffect(() => cleanup, [cleanup])

  const start = useCallback(async () => {
    setError(null)
    const mimeType = pickMimeType()
    if (!mimeType) { setState('error'); setError("Enregistrement audio non supporté par ce navigateur"); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const rec = new MediaRecorder(stream, { mimeType })
      recorderRef.current = rec
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = () => {
        const durationSec = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
        const blob = new Blob(chunksRef.current, { type: mimeType.split(';')[0] })
        cleanup()
        setState('idle')
        setElapsed(0)
        const resolve = resolveRef.current
        resolveRef.current = null
        if (resolve) resolve(chunksRef.current.length ? { blob, durationSec } : null)
      }
      startedAtRef.current = Date.now()
      rec.start()
      setState('recording')
      setElapsed(0)
      timerRef.current = setInterval(() => {
        const secs = Math.round((Date.now() - startedAtRef.current) / 1000)
        setElapsed(secs)
        if (secs >= MAX_AUDIO_SEC) rec.stop() // auto-stop au cap
      }, 250)
    } catch {
      setState('error')
      setError("Micro inaccessible — autorise l'accès au microphone")
    }
  }, [cleanup])

  /** Arrête et renvoie l'enregistrement (ou null si vide). */
  const stop = useCallback((): Promise<RecordingResult | null> => {
    return new Promise((resolve) => {
      const rec = recorderRef.current
      if (!rec || rec.state === 'inactive') { resolve(null); return }
      resolveRef.current = resolve
      rec.stop()
    })
  }, [])

  /** Annule sans produire de blob. */
  const cancel = useCallback(() => {
    chunksRef.current = []
    const rec = recorderRef.current
    resolveRef.current = null
    if (rec && rec.state !== 'inactive') rec.stop()
    cleanup()
    setState('idle')
    setElapsed(0)
  }, [cleanup])

  return { state, elapsed, error, start, stop, cancel }
}
