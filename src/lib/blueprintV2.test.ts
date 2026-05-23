import { describe, expect, it } from 'vitest'
import {
  buildBlueprintV2FromLegacy,
  blueprintToLegacyParts,
  parseBlueprintV2Json,
  pluginBackendsToSlotRegistry,
  serializeBlueprintV2,
  validateBlueprintV2Typescript,
} from './blueprintV2'

describe('buildBlueprintV2FromLegacy', () => {
  it('maps manifest and settings into v2 meta + slot_registry', () => {
    const manifest = {
      id: 'hero',
      name: 'Hero',
      version: '1.0.0',
      scenes: ['home'],
      user_relations: { f: { favor_multiplier: 1, initial_favorability: 40 } },
      default_relation: 'f',
      creator_message_to_downloader: 'thanks',
    }
    const settings = {
      schema_version: 1,
      model: 'qwen2.5:7b',
      plugin_backends: { llm: 'remote', memory: 'builtin' },
    }
    const bp = buildBlueprintV2FromLegacy(manifest, settings)
    expect(bp.schema_version).toBe(2)
    expect(bp.meta.id).toBe('hero')
    expect(bp.meta.creator_message_to_downloader).toBe('thanks')
    expect(bp.meta.ollama_model).toBe('qwen2.5:7b')
    const llm = Object.values(bp.slot_registry).find((s) => s.type === 'llm')
    expect(llm?.backend).toBe('remote')
  })
})

describe('blueprint roundtrip', () => {
  it('preserves core fields through legacy parts', () => {
    const manifest = {
      id: 'x',
      name: 'N',
      scenes: ['a'],
      user_relations: { f: { favor_multiplier: 1, initial_favorability: 40 } },
      default_relation: 'f',
    }
    const settings = { schema_version: 1, plugin_backends: { llm: 'ollama' } }
    const bp = buildBlueprintV2FromLegacy(manifest, settings)
    const { manifest: m2, settings: s2 } = blueprintToLegacyParts(bp)
    expect(m2.id).toBe('x')
    expect(m2.scenes).toEqual(['a'])
    expect((s2.plugin_backends as { llm?: string }).llm).toBe('ollama')
  })
})

describe('parseBlueprintV2Json', () => {
  it('rejects wrong schema_version', () => {
    expect(() => parseBlueprintV2Json('{"schema_version":1}')).toThrow(/schema_version/)
  })
})

describe('validateBlueprintV2Typescript', () => {
  it('requires meta.id and llm slot', () => {
    const bp = {
      schema_version: 2 as const,
      meta: {},
      slot_registry: pluginBackendsToSlotRegistry({}),
    }
    const errs = validateBlueprintV2Typescript(bp)
    expect(errs.some((e) => e.includes('meta.id'))).toBe(true)
  })
})