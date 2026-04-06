import { describe, expect, it } from 'vitest'
import { validateEditorPack } from './validation'

describe('validateEditorPack', () => {
  it('flags empty id/name', () => {
    const errs = validateEditorPack({}, null, [])
    expect(errs.some((e) => e.includes('id'))).toBe(true)
    expect(errs.some((e) => e.includes('name'))).toBe(true)
  })

  it('requires user_relations', () => {
    const errs = validateEditorPack({ id: 'a', name: 'b' }, null, [])
    expect(errs.some((e) => e.includes('user_relations'))).toBe(true)
  })

  it('checks default_relation key', () => {
    const errs = validateEditorPack(
      {
        id: 'r',
        name: 'n',
        user_relations: { x: {} },
        default_relation: 'missing',
      },
      null,
      [],
    )
    expect(errs.some((e) => e.includes('default_relation'))).toBe(true)
  })

  it('checks topic_weights scenes', () => {
    const errs = validateEditorPack(
      {
        id: 'r',
        name: 'n',
        user_relations: { f: { favor_multiplier: 1, initial_favorability: 50 } },
        default_relation: 'f',
        scenes: ['home'],
      },
      {
        memory_config: {
          topic_weights: {
            wrong_scene: { t: 1 },
          },
        },
      },
      ['home'],
    )
    expect(errs.some((e) => e.includes('wrong_scene'))).toBe(true)
  })

  it('passes minimal valid pack', () => {
    const errs = validateEditorPack(
      {
        id: 'r',
        name: 'n',
        user_relations: { f: { favor_multiplier: 1, initial_favorability: 50 } },
        default_relation: 'f',
        scenes: ['home'],
      },
      {
        memory_config: {
          topic_weights: {
            home: { 日常: 1 },
          },
        },
      },
      ['home'],
    )
    expect(errs).toEqual([])
  })
})
