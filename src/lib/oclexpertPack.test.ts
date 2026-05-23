import { describe, expect, it } from 'vitest'
import {
  validateExpertGraphNodes,
  parseOclexpertPackJson,
  OclexpertPackError,
} from './oclexpertPack'
import { MANIFEST_KEY_GUIDE, SETTINGS_KEY_GUIDE } from './advancedEditorHints'

describe('oclexpertPack (T06 expert model editor)', () => {
  it('accepts minimal valid expert graph', () => {
    expect(() =>
      validateExpertGraphNodes({ nodes: [{ type: 'base_model' }, { type: 'prompt_style' }] }),
    ).not.toThrow()
  })

  it('rejects unknown node type', () => {
    expect(() => validateExpertGraphNodes({ nodes: [{ type: 'unknown' }] })).toThrow(
      OclexpertPackError,
    )
  })

  it('parses oclexpert format v1', () => {
    const raw = JSON.stringify({
      format: 'oclexpert',
      fileVersion: 1,
      name: 'Demo',
      graph: { nodes: [{ type: 'cloud_model' }] },
    })
    const parsed = parseOclexpertPackJson(raw)
    expect(parsed.suggestedName).toBe('Demo')
    expect(parsed.graph.nodes).toHaveLength(1)
  })
})

describe('advancedEditorHints (T06 key guides)', () => {
  it('manifest and settings guides include core keys', () => {
    const manifestKeys = MANIFEST_KEY_GUIDE.map((r) => r.key).join(' ')
    expect(manifestKeys).toMatch(/id/)
    expect(SETTINGS_KEY_GUIDE.some((r) => r.key.includes('plugin_backends'))).toBe(true)
  })
})
