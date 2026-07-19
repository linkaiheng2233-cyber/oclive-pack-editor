import { describe, expect, it } from 'vitest'
import { DEFAULT_MEMORY_SEED_JSON, validateMemorySeedJson } from './memorySeed'

describe('validateMemorySeedJson', () => {
  it('accepts the empty creator seed', () => {
    expect(validateMemorySeedJson(DEFAULT_MEMORY_SEED_JSON)).toEqual([])
  })

  it('rejects duplicate ids and invalid importance', () => {
    const raw = JSON.stringify({
      schema_version: 1,
      memories: [
        { id: 'first', content: 'a' },
        { id: 'first', content: 'b', importance: 2 },
      ],
    })
    expect(validateMemorySeedJson(raw)).toEqual([
      'memory_seed：重复 id「first」',
      'memory_seed：条目「first」importance 须在 0..=1',
    ])
  })

  it('rejects unknown fields like the Rust deny_unknown_fields contract', () => {
    expect(validateMemorySeedJson('{"schema_version":1,"memories":[],"extra":true}'))
      .toContain('memory_seed.json 未知顶层键「extra」')
  })
})
