import { describe, expect, it } from 'vitest'
import {
  applySimpleManifestToJson,
  applySimpleSettingsToJson,
  countUserRelationKeys,
  defaultSimpleManifestForm,
  manifestRecordToSimpleForm,
} from './simpleCreation'

describe('simpleCreation', () => {
  it('merges manifest and preserves extra keys', () => {
    const base = JSON.stringify({ id: 'a', extra_future: { plugin: true } })
    const form = defaultSimpleManifestForm()
    form.id = 'my_role'
    form.name = 'N'
    const out = applySimpleManifestToJson(base, form)
    const o = JSON.parse(out) as Record<string, unknown>
    expect(o.id).toBe('my_role')
    expect(o.name).toBe('N')
    expect(o.extra_future).toEqual({ plugin: true })
  })

  it('applySimpleManifestToJson sets or clears min_runtime_version', () => {
    const base = JSON.stringify({ id: 'a', min_runtime_version: '0.9.0' })
    const form = defaultSimpleManifestForm()
    form.id = 'a'
    form.name = 'N'
    form.minRuntimeVersion = '0.2.0'
    let out = applySimpleManifestToJson(base, form)
    expect(JSON.parse(out).min_runtime_version).toBe('0.2.0')
    form.minRuntimeVersion = ''
    out = applySimpleManifestToJson(out, form)
    expect(JSON.parse(out).min_runtime_version).toBeUndefined()
  })

  it('manifestRecordToSimpleForm reads first relation', () => {
    const m = {
      id: 'r',
      name: 'R',
      scenes: ['x'],
      default_relation: 'friend',
      user_relations: {
        friend: { display_name: 'F', prompt_hint: 'p', initial_favorability: 40, favor_multiplier: 1.2 },
      },
    }
    const f = manifestRecordToSimpleForm(m as Record<string, unknown>)
    expect(f.relationKey).toBe('friend')
    expect(f.relationInitialFavorability).toBe(40)
  })

  it('countUserRelationKeys', () => {
    expect(countUserRelationKeys('{"user_relations":{"a":{},"b":{}}}')).toBe(2)
  })
})
