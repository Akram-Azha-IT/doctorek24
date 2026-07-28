import { describe, expect, test } from 'vitest'
import { omit } from './object'

describe('omit', () => {
  test('retire la clé demandée et garde les autres', () => {
    const values = { email: 'a@b.ma', password: 'secret', confirmPassword: 'secret' }
    expect(omit(values, 'confirmPassword')).toEqual({ email: 'a@b.ma', password: 'secret' })
  })

  test('accepte plusieurs clés', () => {
    expect(omit({ a: 1, b: 2, c: 3 }, 'a', 'c')).toEqual({ b: 2 })
  })

  test('ne modifie pas la source', () => {
    const source = { a: 1, b: 2 }
    omit(source, 'a')
    expect(source).toEqual({ a: 1, b: 2 })
  })

  test('sans clé, renvoie une copie équivalente mais distincte', () => {
    const source = { a: 1 }
    const copy = omit(source)
    expect(copy).toEqual(source)
    expect(copy).not.toBe(source)
  })
})
