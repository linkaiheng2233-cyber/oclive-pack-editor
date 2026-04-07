import { describe, expect, it } from 'vitest'
import { normalizeHttpBaseUrl } from './runtimeApiHelpers'

describe('normalizeHttpBaseUrl', () => {
  it('accepts http and strips trailing slash', () => {
    expect(normalizeHttpBaseUrl('http://127.0.0.1:8420/')).toBe('http://127.0.0.1:8420')
  })

  it('rejects non-http protocols', () => {
    expect(() => normalizeHttpBaseUrl('file:///C:/x')).toThrow(/仅支持/)
  })
})
