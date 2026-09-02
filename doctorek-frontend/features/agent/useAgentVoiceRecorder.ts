'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { describeError } from '@/lib/error-message'
import { postAgentTranscription } from './api'
import { convertirAudioEnWav } from './audioToWav'

export type EtatDictee = 'repos' | 'autorisation' | 'enregistrement' | 'transcription'

const DUREE_MAX_SECONDES = 30
const TYPES_AUDIO = [
  { mime: 'audio/webm;codecs=opus' },
  { mime: 'audio/mp4' },
  { mime: 'audio/ogg;codecs=opus' },
] as const

function typeAudioSupporte() {
  if (typeof MediaRecorder === 'undefined') return null
  return TYPES_AUDIO.find(({ mime }) => MediaRecorder.isTypeSupported(mime)) ?? null
}

interface Options {
  readonly actif: boolean
  readonly onTranscription: (texte: string) => void
}

/** Enregistre au plus 30 secondes puis remplit le composeur, sans envoyer le message. */
export function useAgentVoiceRecorder({ actif, onTranscription }: Options) {
  const [etat, setEtat] = useState<EtatDictee>('repos')
  const [secondes, setSecondes] = useState(0)
  const [erreur, setErreur] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const annuleRef = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const monteRef = useRef(true)

  const nettoyerMedia = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    recorderRef.current = null
  }, [])

  const terminer = useCallback((annuler = false) => {
    annuleRef.current = annuler
    const recorder = recorderRef.current
    if (recorder?.state === 'recording') recorder.stop()
    else nettoyerMedia()
  }, [nettoyerMedia])

  const commencer = useCallback(async () => {
    if (!actif || etat !== 'repos') return
    setErreur(null)
    const format = typeAudioSupporte()
    if (!format || !navigator.mediaDevices?.getUserMedia) {
      setErreur("L'enregistrement vocal n'est pas supporté par ce navigateur.")
      return
    }

    setEtat('autorisation')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      streamRef.current = stream
      if (!monteRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        return
      }

      const recorder = new MediaRecorder(stream, { mimeType: format.mime })
      recorderRef.current = recorder
      chunksRef.current = []
      annuleRef.current = false

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onerror = () => {
        annuleRef.current = true
        setErreur("L'enregistrement a été interrompu.")
        nettoyerMedia()
        setEtat('repos')
      }
      recorder.onstop = async () => {
        const annule = annuleRef.current
        const blob = new Blob(chunksRef.current, { type: format.mime })
        chunksRef.current = []
        nettoyerMedia()
        if (annule || blob.size === 0) {
          setEtat('repos')
          return
        }

        setEtat('transcription')
        try {
          const wav = await convertirAudioEnWav(blob)
          const dureeSecondes = Math.min(
            DUREE_MAX_SECONDES,
            Math.max(0.1, wav.dureeSecondes),
          )
          const resultat = await postAgentTranscription(wav.blob, 'wav', dureeSecondes)
          if (monteRef.current) onTranscription(resultat.transcription)
        } catch (cause) {
          if (monteRef.current) setErreur(describeError(cause).texte)
        } finally {
          if (monteRef.current) setEtat('repos')
        }
      }

      recorder.start(250)
      setSecondes(0)
      setEtat('enregistrement')
      const debut = Date.now()
      intervalRef.current = setInterval(() => {
        const ecoulees = Math.min(DUREE_MAX_SECONDES, Math.floor((Date.now() - debut) / 1000))
        setSecondes(ecoulees)
        if (ecoulees >= DUREE_MAX_SECONDES && recorder.state === 'recording') recorder.stop()
      }, 250)
    } catch (cause) {
      const refuse = cause instanceof DOMException && cause.name === 'NotAllowedError'
      setErreur(refuse
        ? "Autorisez le microphone dans votre navigateur pour utiliser la dictée."
        : "Impossible d'accéder au microphone.")
      nettoyerMedia()
      setEtat('repos')
    }
  }, [actif, etat, nettoyerMedia, onTranscription])

  useEffect(() => {
    if (!actif) terminer(true)
  }, [actif, terminer])

  useEffect(() => {
    monteRef.current = true
    return () => {
      monteRef.current = false
      annuleRef.current = true
      const recorder = recorderRef.current
      if (recorder?.state === 'recording') recorder.stop()
      nettoyerMedia()
    }
  }, [nettoyerMedia])

  return {
    etat,
    secondes,
    erreur,
    supporte: actif && typeAudioSupporte() !== null,
    commencer,
    arreter: () => terminer(false),
    annuler: () => terminer(true),
  }
}
