import { describe, expect, it } from 'vitest'

import {

  mergeWorldKnowledgeExportFiles,

  parseWorldKnowledgeFromFiles,

  worldKnowledgeTextsToFiles,

} from './worldKnowledgeUser'



describe('worldKnowledgeUser', () => {

  it('writes two standard paths with front matter', () => {

    const files = worldKnowledgeTextsToFiles({

      dialogueWorldview: '近未来日常',

      knowledgeBoundary: '不懂编程细节',

    })

    expect(files.map((f) => f.path)).toEqual([

      'knowledge/world.md',

      'knowledge/knowledge_boundary.md',

    ])

    expect(files[0]?.content).toContain('id: world_intro')

    expect(files[0]?.content).toContain('近未来日常')

  })



  it('roundtrips body text without exposing meta to user', () => {

    const files = worldKnowledgeTextsToFiles({

      dialogueWorldview: 'B',

      knowledgeBoundary: '',

    })

    const { texts, extraFiles, legacySceneSettingBody } = parseWorldKnowledgeFromFiles(files)

    expect(texts.dialogueWorldview).toBe('B')

    expect(extraFiles).toHaveLength(0)

    expect(legacySceneSettingBody).toBe('')

  })



  it('preserves legacy scene_setting as extra file', () => {

    const { texts, extraFiles, legacySceneSettingBody } = parseWorldKnowledgeFromFiles([

      {

        path: 'knowledge/scene_setting.md',

        content: '---\nid: scene_setting\n---\n\n旧场景文案',

      },

    ])

    expect(texts.dialogueWorldview).toBe('')

    expect(legacySceneSettingBody).toBe('旧场景文案')

    expect(extraFiles.some((f) => f.path === 'knowledge/scene_setting.md')).toBe(true)

  })



  it('preserves non-standard knowledge files on merge', () => {

    const merged = mergeWorldKnowledgeExportFiles(

      { dialogueWorldview: 'W', knowledgeBoundary: '' },

      [{ path: 'knowledge/lore/extra.md', content: '---\nid: x\n---\n\nlegacy' }],

    )

    expect(merged.some((f) => f.path === 'knowledge/lore/extra.md')).toBe(true)

    expect(merged.some((f) => f.path === 'knowledge/world.md')).toBe(true)

  })

})


