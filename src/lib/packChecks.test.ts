import { describe, expect, it } from 'vitest'
import { parsePackDocuments, runAllPackChecks } from './packChecks'

describe('parsePackDocuments', () => {
  it('returns errors when manifest JSON invalid', () => {
    const r = parsePackDocuments('{', '{}')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors[0]).toContain('角色门面')
  })

  it('returns errors when settings JSON invalid', () => {
    const r = parsePackDocuments('{}', '{')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors[0]).toContain('运行时')
  })

  it('returns objects when both parse', () => {
    const r = parsePackDocuments('{"a":1}', '{"b":2}')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.manifest).toEqual({ a: 1 })
      expect(r.settings).toEqual({ b: 2 })
    }
  })
})

describe('runAllPackChecks', () => {
  it('reports JSON errors', async () => {
    const r = await runAllPackChecks('{', '{}')
    expect(r.ok).toBe(false)
    expect(r.errors.some((e) => e.includes('角色门面'))).toBe(true)
  })

  it('rejects unknown top-level manifest key', async () => {
    const manifest = JSON.stringify({
      id: 'r1',
      name: 'Role',
      not_a_valid_key: true,
      scenes: ['s1'],
      user_relations: { u: {} },
      memory_config: { topic_weights: { s1: { a: 1 } } },
    })
    const r = await runAllPackChecks(manifest, '{}')
    expect(r.ok).toBe(false)
    expect(r.errors.some((e) => e.includes('未识别'))).toBe(true)
  })

  it('passes for minimal valid pack', async () => {
    const manifest = JSON.stringify({
      id: 'r1',
      name: 'Role',
      version: '1',
      author: 't',
      description: 'd',
      scenes: ['s1'],
      user_relations: { u: {} },
      memory_config: { topic_weights: { s1: { a: 1 } } },
    })
    const settings = JSON.stringify({
      memory_config: { topic_weights: { s1: { a: 1 } } },
    })
    const r = await runAllPackChecks(manifest, settings)
    expect(r.ok).toBe(true)
    expect(r.errors).toEqual([])
  })
})
