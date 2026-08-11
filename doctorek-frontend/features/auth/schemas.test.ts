import { describe, expect, test } from 'vitest'
import { RegisterSchema } from './schemas'

const valide = {
  firstName: 'Aïcha',
  lastName: 'Bennani',
  email: 'aicha@exemple.com',
  phone: '0612345678',
  password: 'motdepasse1',
  confirmPassword: 'motdepasse1',
  consentementDonnees: true,
}

describe('RegisterSchema — consentement loi 09-08', () => {
  test('accepte une inscription avec consentement', () => {
    expect(RegisterSchema.safeParse(valide).success).toBe(true)
  })

  test('refuse la création du compte sans consentement', () => {
    const res = RegisterSchema.safeParse({ ...valide, consentementDonnees: false })

    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error.issues.some((i) => i.path[0] === 'consentementDonnees')).toBe(true)
    }
  })

  test('un consentement absent vaut refus, jamais accord implicite', () => {
    const { consentementDonnees, ...sansCase } = valide
    void consentementDonnees

    expect(RegisterSchema.safeParse(sansCase).success).toBe(false)
  })
})
