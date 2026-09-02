import { describe, expect, test } from 'vitest'
import { ApiError } from './api-client'
import { queryRetryDelay, shouldRetryQuery } from './query-retry'

describe('shouldRetryQuery', () => {
  test('réessaie deux fois une panne réseau transitoire', () => {
    const error = new TypeError('fetch failed')

    expect(shouldRetryQuery(0, error)).toBe(true)
    expect(shouldRetryQuery(1, error)).toBe(true)
    expect(shouldRetryQuery(2, error)).toBe(false)
  })

  test('réessaie les erreurs serveur mais pas les erreurs métier', () => {
    expect(shouldRetryQuery(0, new ApiError('indisponible', 503))).toBe(true)
    expect(shouldRetryQuery(2, new ApiError('indisponible', 503))).toBe(false)
    expect(shouldRetryQuery(0, new ApiError('non autorisé', 401))).toBe(false)
    expect(shouldRetryQuery(0, new ApiError('validation', 422))).toBe(false)
  })

  test('autorise une reprise limitée après surcharge', () => {
    expect(shouldRetryQuery(0, new ApiError('trop de requêtes', 429))).toBe(true)
    expect(shouldRetryQuery(2, new ApiError('trop de requêtes', 429))).toBe(false)
  })

  test('utilise un délai exponentiel plafonné', () => {
    expect(queryRetryDelay(0)).toBe(750)
    expect(queryRetryDelay(1)).toBe(1_500)
    expect(queryRetryDelay(10)).toBe(5_000)
  })
})
