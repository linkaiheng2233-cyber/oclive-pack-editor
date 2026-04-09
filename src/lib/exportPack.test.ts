import { describe, expect, it } from 'vitest'
import { buildRolePackFiles } from './exportPack'

describe('buildRolePackFiles', () => {
  it('serializes manifest with id aligned to folder name', () => {
    const manifest = {
      id: 'ignored',
      name: 'N',
      scenes: ['home'],
      user_relations: { f: { favor_multiplier: 1, initial_favorability: 40 } },
      default_relation: 'f',
    }
    const settings = { schema_version: 1 }
    const files = buildRolePackFiles('myrole', manifest, settings)
    const mj = files.get('myrole/manifest.json')
    expect(mj).toBeDefined()
    expect(files.get('myrole/core_personality.txt')).toBeDefined()
    const parsed = JSON.parse(mj!) as { id: string }
    expect(parsed.id).toBe('myrole')
  })

  it('includes scene placeholders for each manifest scene', () => {
    const manifest = {
      id: 'x',
      name: 'N',
      scenes: ['a', 'b'],
      user_relations: { f: { favor_multiplier: 1, initial_favorability: 40 } },
      default_relation: 'f',
    }
    const files = buildRolePackFiles('x', manifest, { schema_version: 1 })
    expect(files.has('x/scenes/a/scene.json')).toBe(true)
    expect(files.has('x/scenes/b/description.txt')).toBe(true)
  })

  it('writes creator_message.txt when creatorMessage extra is set', () => {
    const manifest = {
      id: 'x',
      name: 'N',
      scenes: ['home'],
      user_relations: { f: { favor_multiplier: 1, initial_favorability: 40 } },
      default_relation: 'f',
    }
    const files = buildRolePackFiles('x', manifest, { schema_version: 1 }, {
      creatorMessage: 'hello world',
    })
    expect(files.get('x/creator_message.txt')).toBe('hello world\n')
  })

  it('writes multiple lines in per_module mode', () => {
    const manifest = {
      id: 'x',
      name: 'N',
      scenes: ['home'],
      user_relations: { f: { favor_multiplier: 1, initial_favorability: 40 } },
      default_relation: 'f',
    }
    const files = buildRolePackFiles('x', manifest, { schema_version: 1 }, {
      creatorMessage: 'one\ntwo',
      creatorMessageMode: 'per_module',
    })
    expect(files.get('x/creator_message.txt')).toBe('one\ntwo\n')
  })
})
