import { createHmac, timingSafeEqual } from 'crypto'

function getSecret(): string {
  const secret = process.env.GOOGLE_WALLET_HERO_SECRET
  if (!secret) {
    throw new Error('GOOGLE_WALLET_HERO_SECRET not configured')
  }
  return secret
}

export interface WalletHeroParams {
  cardRef: string
  fullName: string
  maskedCin: string
  cnss: string
  photo: string
  exp: string
}

function canonicalPayload({ cardRef, fullName, maskedCin, cnss, photo, exp }: WalletHeroParams): string {
  return [cardRef, fullName, maskedCin, cnss, photo, exp].join('|')
}

export function signWalletHeroParams(params: WalletHeroParams): string {
  return createHmac('sha256', getSecret()).update(canonicalPayload(params)).digest('hex')
}

export function verifyWalletHeroSignature(params: WalletHeroParams, signature: string): boolean {
  const expected = signWalletHeroParams(params)
  const expectedBuf = Buffer.from(expected, 'hex')
  const actualBuf = Buffer.from(signature, 'hex')
  if (expectedBuf.length !== actualBuf.length) return false
  return timingSafeEqual(expectedBuf, actualBuf)
}
