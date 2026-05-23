import { describe, it, expect } from 'vitest'
import { mergeManifestWithSettings } from './mergeManifest'

describe('mergeManifestWithSettings (T13)', () => {
  it('prefers ollama_model over model', () => {
    const out = mergeManifestWithSettings({}, { model: 'a', ollama_model: 'b' })
    expect(out.ollama_model).toBe('b')
  })

  it('copies identity_binding and knowledge blocks', () => {
    const out = mergeManifestWithSettings(
      { id: 'x' },
      { identity_binding: 'per_scene', knowledge: { glob: '*.md' } },
    )
    expect(out.identity_binding).toBe('per_scene')
    expect(out.knowledge).toEqual({ glob: '*.md' })
  })
})
