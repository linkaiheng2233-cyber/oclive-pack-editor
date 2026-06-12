import { buildKnowledgeMarkdown, parseKnowledgeMarkdown } from './knowledgeFrontMatter'

import type { KnowledgeMarkdownFile } from './knowledgeFiles'



/** 用户只填正文；编写器自动生成 front matter 并写入对应路径。 */

export const WORLD_KNOWLEDGE_SLOTS = [

  {

    key: 'dialogueWorldview' as const,

    path: 'knowledge/world.md',

    metaId: 'world_intro',

    defaultTags: ['世界观'],

  },

  {

    key: 'knowledgeBoundary' as const,

    path: 'knowledge/knowledge_boundary.md',

    metaId: 'knowledge_boundary',

    defaultTags: ['知识', '边界'],

  },

] as const



export type WorldKnowledgeTexts = {

  dialogueWorldview: string

  knowledgeBoundary: string

}



export type WorldKnowledgeSlotKey = (typeof WORLD_KNOWLEDGE_SLOTS)[number]['key']



const SLOT_BY_PATH = new Map<string, (typeof WORLD_KNOWLEDGE_SLOTS)[number]>(

  WORLD_KNOWLEDGE_SLOTS.map((s) => [s.path, s]),

)



const LEGACY_SCENE_SETTING_PATH = 'knowledge/scene_setting.md'



export function emptyWorldKnowledgeTexts(): WorldKnowledgeTexts {

  return { dialogueWorldview: '', knowledgeBoundary: '' }

}



export function buildUserKnowledgeMarkdown(

  metaId: string,

  body: string,

  tags: string[] = [],

): string {

  return buildKnowledgeMarkdown(

    {

      id: metaId,

      tags,

      scenes: [],

      eventHints: [],

      weight: 1,

    },

    body.trim(),

  )

}



export function bodyFromKnowledgeContent(content: string): string {

  return parseKnowledgeMarkdown(content).body.trim()

}



/** 两个白话字段 → 标准 knowledge 文件（空字段不写入）。 */

export function worldKnowledgeTextsToFiles(texts: WorldKnowledgeTexts): KnowledgeMarkdownFile[] {

  const out: KnowledgeMarkdownFile[] = []

  for (const slot of WORLD_KNOWLEDGE_SLOTS) {

    const body = texts[slot.key].trim()

    if (!body) continue

    out.push({

      path: slot.path,

      content: buildUserKnowledgeMarkdown(slot.metaId, body, [...slot.defaultTags]),

    })

  }

  return out

}



/** 从已加载 knowledge 文件还原两个字段；非标准文件（含旧 scene_setting）单独返回供静默保留。 */

export function parseWorldKnowledgeFromFiles(files: KnowledgeMarkdownFile[]): {

  texts: WorldKnowledgeTexts

  extraFiles: KnowledgeMarkdownFile[]

  legacySceneSettingBody: string

} {

  const texts = emptyWorldKnowledgeTexts()

  const extraFiles: KnowledgeMarkdownFile[] = []

  let legacySceneSettingBody = ''

  for (const f of files) {

    if (f.path === LEGACY_SCENE_SETTING_PATH) {

      legacySceneSettingBody = bodyFromKnowledgeContent(f.content)

      extraFiles.push(f)

      continue

    }

    const slot = SLOT_BY_PATH.get(f.path)

    if (slot) {

      texts[slot.key] = bodyFromKnowledgeContent(f.content)

      continue

    }

    extraFiles.push(f)

  }

  return { texts, extraFiles, legacySceneSettingBody }

}



export function mergeWorldKnowledgeExportFiles(

  texts: WorldKnowledgeTexts,

  extraFiles: KnowledgeMarkdownFile[],

): KnowledgeMarkdownFile[] {

  const standard = worldKnowledgeTextsToFiles(texts)

  const standardPaths = new Set(standard.map((f) => f.path))

  const preserved = extraFiles.filter((f) => !standardPaths.has(f.path) && f.content.trim())

  return [...standard, ...preserved]

}



export function worldKnowledgeHasContent(texts: WorldKnowledgeTexts): boolean {

  return Object.values(texts).some((t) => t.trim().length > 0)

}


