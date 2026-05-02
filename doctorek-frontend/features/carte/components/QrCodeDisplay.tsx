'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface QrCodeDisplayProps {
  value: string
  size?: number
}

export default function QrCodeDisplay({ value, size = 160 }: QrCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: { dark: '#010C2D', light: '#FFFFFF' },
    })
  }, [value, size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-lg"
      aria-label={`QR code pour ${value}`}
    />
  )
}
