/**
 * OCLive 市场「模块组合」导出 JSON → 编写器简单创作字段。
 * 与 oclive-plugin-market 中 PacksComposeView 导出结构对齐。
 */

export type MarketComposeV1 = {
  version: 1
  source: 'oclive-plugin-market'
  assembled: {
    scene: string
    persona: string
    identity: string
    world: string
    schedule: string
  }
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x)
}

export function parseMarketComposeV1(raw: string): { ok: true; data: MarketComposeV1 } | { ok: false; error: string } {
  let j: unknown
  try {
    j = JSON.parse(raw)
  } catch {
    return { ok: false, error: '内容不是合法的 JSON。' }
  }
  if (!isRecord(j)) return { ok: false, error: '根节点必须是 JSON 对象。' }
  if (j.version !== 1) return { ok: false, error: '仅支持 version === 1 的市场组合格式。' }
  if (j.source !== 'oclive-plugin-market') return { ok: false, error: '缺少或错误的 source 字段。' }
  const a = j.assembled
  if (!isRecord(a)) return { ok: false, error: '缺少 assembled 对象。' }
  const str = (k: string) => (typeof a[k] === 'string' ? (a[k] as string) : '')
  return {
    ok: true,
    data: {
      version: 1,
      source: 'oclive-plugin-market',
      assembled: {
        scene: str('scene'),
        persona: str('persona'),
        identity: str('identity'),
        world: str('world'),
        schedule: str('schedule'),
      },
    },
  }
}

const SEP = '\n\n---\n\n'
const HDR = '（以下内容来自 OCLive 市场模块组合）'

/** 将市场组合合并进编写器当前文案（追加，不覆盖原有内容） */
export function mergeMarketComposeIntoEditor(
  data: MarketComposeV1,
  current: {
    corePersonalityText: string
    worldviewMarkdown: string
    relationPromptHint: string
  },
): { corePersonalityText: string; worldviewMarkdown: string; relationPromptHint: string } {
  const { scene, persona, identity, world, schedule } = data.assembled
  const coreBlocks: string[] = []
  if (scene.trim()) coreBlocks.push(`【场景】\n${scene.trim()}`)
  if (persona.trim()) coreBlocks.push(`【人设】\n${persona.trim()}`)
  if (schedule.trim()) coreBlocks.push(`【日程与生活】\n${schedule.trim()}`)

  let core = current.corePersonalityText
  if (coreBlocks.length) {
    const chunk = `${HDR}\n\n${coreBlocks.join('\n\n')}`
    core = core.trim() ? `${core.trim()}${SEP}${chunk}` : chunk
  }

  let worldMd = current.worldviewMarkdown
  if (world.trim()) {
    const chunk = `${HDR}\n\n【世界观】\n\n${world.trim()}`
    worldMd = worldMd.trim() ? `${worldMd.trim()}${SEP}${chunk}` : chunk
  }

  let hint = current.relationPromptHint
  if (identity.trim()) {
    const chunk = `${HDR}\n【自定义身份】\n${identity.trim()}`
    hint = hint.trim() ? `${hint.trim()}\n\n${chunk}` : chunk
  }

  return {
    corePersonalityText: core,
    worldviewMarkdown: worldMd,
    relationPromptHint: hint,
  }
}
