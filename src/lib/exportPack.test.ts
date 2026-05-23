import { describe, expect, it } from 'vitest'
import { PIPELINE_BLUEPRINT_FILENAME, REPLY_QUALITY_ANCHOR_REL_PATH } from './blueprintV2'
import { buildRolePackFiles } from './exportPack'

const baseManifest = {
  id: 'x',
  name: 'N',
  scenes: ['home'],
  user_relations: { f: { favor_multiplier: 1, initial_favorability: 40 } },
  default_relation: 'f',
}

describe('buildRolePackFiles', () => {
  it('writes pipeline.ocblueprint with meta.id aligned to folder name', () => {
    const manifest = { ...baseManifest, id: 'ignored' }
    const files = buildRolePackFiles('myrole', manifest, { schema_version: 1 })
    expect(files.has('myrole/manifest.json')).toBe(false)
    expect(files.has('myrole/settings.json')).toBe(false)
    const bpRaw = files.get(`myrole/${PIPELINE_BLUEPRINT_FILENAME}`)
    expect(bpRaw).toBeDefined()
    expect(files.get('myrole/core_personality.txt')).toBeDefined()
    const parsed = JSON.parse(bpRaw!) as { meta: { id: string } }
    expect(parsed.meta.id).toBe('myrole')
  })

  it('includes scene placeholders for each manifest scene', () => {
    const manifest = { ...baseManifest, scenes: ['a', 'b'] }
    const files = buildRolePackFiles('x', manifest, { schema_version: 1 })
    expect(files.has('x/scenes/a/scene.json')).toBe(true)
    expect(files.has('x/scenes/b/description.txt')).toBe(true)
  })

  it('writes creator_message.txt when creatorMessage extra is set', () => {
    const files = buildRolePackFiles('x', baseManifest, { schema_version: 1 }, {
      creatorMessage: 'hello world',
    })
    expect(files.get('x/creator_message.txt')).toBe('hello world\n')
  })

  it('writes author.json when authorJson extra is set', () => {
    const body = '{"schema_version":1,"summary":"hi"}\n'
    const files = buildRolePackFiles('x', baseManifest, { schema_version: 1 }, {
      authorJson: body,
    })
    expect(files.get('x/author.json')).toBe(body)
  })

  it('blueprint meta may include creator_message_to_downloader', () => {
    const manifest = {
      ...baseManifest,
      creator_message_to_downloader: '感谢游玩',
    }
    const files = buildRolePackFiles('x', manifest, { schema_version: 1 })
    const bp = JSON.parse(files.get(`x/${PIPELINE_BLUEPRINT_FILENAME}`)!) as {
      meta: { creator_message_to_downloader?: string }
    }
    expect(bp.meta.creator_message_to_downloader).toBe('感谢游玩')
  })

  it('writes reply quality anchor to prompts path', () => {
    const files = buildRolePackFiles('x', baseManifest, { schema_version: 1 }, {
      replyQualityAnchorMarkdown: 'anchor text',
    })
    expect(files.get(`x/${REPLY_QUALITY_ANCHOR_REL_PATH}`)).toBe('anchor text\n')
  })

  it('writes multiple lines in per_module mode', () => {
    const files = buildRolePackFiles('x', baseManifest, { schema_version: 1 }, {
      creatorMessage: 'one\ntwo',
      creatorMessageMode: 'per_module',
    })
    expect(files.get('x/creator_message.txt')).toBe('one\ntwo\n')
  })
})
