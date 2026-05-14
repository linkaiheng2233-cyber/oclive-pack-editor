import { describe, expect, it } from 'vitest'
import { validateRolePackTypescript } from './rolePackEditorValidate'
import { HOST_RUNTIME_VERSION } from './hostRuntimeVersion'

describe('validateRolePackTypescript', () => {
  it('reports missing manifest id', () => {
    const manifest = JSON.stringify({ name: 'x', version: '1', author: 'a', description: 'd' })
    const settings = JSON.stringify({ schema_version: 1 })
    const errs = validateRolePackTypescript(manifest, settings, ['default'], HOST_RUNTIME_VERSION)
    expect(errs.some((e) => e.includes('manifest.id'))).toBe(true)
  })

  it('accepts minimal valid manifest and settings', () => {
    const manifest = JSON.stringify({
      id: 'test.role',
      name: 'T',
      version: '0.1.0',
      author: 'a',
      description: 'd',
      default_personality: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
      scenes: ['default'],
      user_relations: {
        friend: { initial_favorability: 50, favor_multiplier: 1 },
      },
      default_relation: 'friend',
    })
    const settings = JSON.stringify({
      schema_version: 1,
      plugin_backends: {
        memory: 'builtin',
        emotion: 'builtin',
        event: 'builtin',
        prompt: 'builtin',
        llm: 'ollama',
        agent: 'builtin',
      },
    })
    const errs = validateRolePackTypescript(manifest, settings, ['default'], HOST_RUNTIME_VERSION)
    expect(errs).toEqual([])
  })
})
