import { describe, expect, it } from 'vitest'
import { runAllPackChecks } from './packChecks'

describe('runAllPackChecks', () => {
  it('reports JSON errors', () => {
    const r = runAllPackChecks('{', '{}')
    expect(r.ok).toBe(false)
    expect(r.errors.some((e) => e.includes('manifest'))).toBe(true)
  })

  it('passes for minimal valid pack', () => {
    const manifest = JSON.stringify({
      id: 'r1',
      name: 'Role',
      scenes: ['s1'],
      user_relations: { u: {} },
      memory_config: { topic_weights: { s1: { a: 1 } } },
    })
    const settings = JSON.stringify({
      memory_config: { topic_weights: { s1: { a: 1 } } },
    })
    const r = runAllPackChecks(manifest, settings)
    expect(r.ok).toBe(true)
    expect(r.errors).toEqual([])
  })
})
