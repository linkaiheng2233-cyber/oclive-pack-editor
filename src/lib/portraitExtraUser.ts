import type { PortraitCatalogEntry } from './portraitCatalog'

/** 七种基础情绪簇（与 7 固定槽 tags 对齐）。 */
export const BASE_EMOTION_CLUSTERS = [
  { tag: 'happy', label: '开心' },
  { tag: 'sad', label: '难过' },
  { tag: 'angry', label: '生气' },
  { tag: 'neutral', label: '平静' },
  { tag: 'excited', label: '兴奋' },
  { tag: 'confused', label: '困惑' },
  { tag: 'shy', label: '害羞' },
] as const

export type BuiltinEmotionClusterTag = (typeof BASE_EMOTION_CLUSTERS)[number]['tag']

export const PORTRAIT_INTENSITY_OPTIONS = [
  { value: 'mild' as const, label: '轻微', descPhrase: '轻微程度' },
  { value: 'moderate' as const, label: '中度', descPhrase: '中度程度' },
  { value: 'severe' as const, label: '重度', descPhrase: '重度程度' },
]

export type PortraitIntensity = (typeof PORTRAIT_INTENSITY_OPTIONS)[number]['value']

export type ExtraEmotionUserChoices = {
  clusterMode: 'builtin' | 'custom'
  /** builtin 时为 happy/sad…；custom 时为创作者填写的簇名（中文也可）。 */
  clusterTag: string
  customClusterLabel: string
  intensity: PortraitIntensity
}

export function clusterLabelFromTag(tag: string): string {
  const hit = BASE_EMOTION_CLUSTERS.find((c) => c.tag === tag)
  if (hit) return hit.label
  return tag.trim() || '其他'
}

export function slugifyClusterLabel(label: string): string {
  const t = label.trim().toLowerCase()
  if (!t) return 'custom'
  const ascii = t.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  if (ascii) return ascii.slice(0, 32)
  return `custom_${Array.from(label.trim())
    .slice(0, 8)
    .map((ch) => ch.charCodeAt(0).toString(16))
    .join('')}`
}

export function uniqueExtraEntryId(
  clusterKey: string,
  intensity: PortraitIntensity,
  existingIds: Set<string>,
): string {
  const base = `${clusterKey}_${intensity}`
  if (!existingIds.has(base)) return base
  let n = 2
  while (existingIds.has(`${base}_${n}`)) n++
  return `${base}_${n}`
}

export function resolveClusterKey(choices: ExtraEmotionUserChoices): string {
  if (choices.clusterMode === 'custom') {
    const label = choices.customClusterLabel.trim()
    if (label) return slugifyClusterLabel(label)
    return 'custom'
  }
  return choices.clusterTag.trim() || 'happy'
}

export function resolveClusterDisplayLabel(choices: ExtraEmotionUserChoices): string {
  if (choices.clusterMode === 'custom') {
    return choices.customClusterLabel.trim() || '自定义情绪'
  }
  return clusterLabelFromTag(choices.clusterTag)
}

/** 根据三个白话问题，生成 catalog 条目（仅图片；供 AI 表现导演读 desc）。 */
export function buildExtraEntryFromUserChoices(
  choices: ExtraEmotionUserChoices,
  existingIds: string[],
  file?: File,
): PortraitCatalogEntry {
  const clusterKey = resolveClusterKey(choices)
  const label = resolveClusterDisplayLabel(choices)
  const intensity = PORTRAIT_INTENSITY_OPTIONS.find((o) => o.value === choices.intensity)!
  const id = uniqueExtraEntryId(clusterKey, choices.intensity, new Set(existingIds))
  const desc = `${label}，${intensity.descPhrase}，对话时按此选用`
  const path = file ? `assets/images/${file.name}` : ''
  return {
    id,
    path,
    desc,
    tags: choices.clusterMode === 'builtin' ? [choices.clusterTag] : [clusterKey],
    kind: 'image',
    cluster: clusterKey,
    file,
  }
}

const INTENSITY_FROM_DESC: Record<string, PortraitIntensity> = {
  轻微: 'mild',
  中度: 'moderate',
  重度: 'severe',
}

/** 从已导出的 catalog 条目反推三个问题（加载包 / 导入 zip 时用）。 */
export function inferExtraEntryUserChoices(entry: PortraitCatalogEntry): ExtraEmotionUserChoices {
  const clusterRaw = (entry.cluster ?? entry.tags[0] ?? '').trim()
  if (clusterRaw === 'custom') {
    const label = entry.desc.split('，')[0]?.trim() || ''
    return {
      clusterMode: 'custom',
      clusterTag: 'custom',
      customClusterLabel: label === '自定义情绪' ? '' : label,
      intensity: inferIntensityFromDesc(entry.desc),
    }
  }
  const builtin = BASE_EMOTION_CLUSTERS.find((c) => c.tag === clusterRaw)
  if (builtin) {
    return {
      clusterMode: 'builtin',
      clusterTag: builtin.tag,
      customClusterLabel: '',
      intensity: inferIntensityFromDesc(entry.desc),
    }
  }
  const fromTag = BASE_EMOTION_CLUSTERS.find((c) => entry.tags.includes(c.tag))
  if (fromTag && !clusterRaw) {
    return {
      clusterMode: 'builtin',
      clusterTag: fromTag.tag,
      customClusterLabel: '',
      intensity: inferIntensityFromDesc(entry.desc),
    }
  }
  const customLabel =
    clusterRaw && !builtin
      ? clusterLabelFromTag(clusterRaw) === clusterRaw
        ? entry.desc.split('，')[0]?.trim() || clusterRaw
        : clusterLabelFromTag(clusterRaw)
      : entry.desc.split('，')[0]?.trim() || '其他'
  return {
    clusterMode: 'custom',
    clusterTag: clusterRaw || slugifyClusterLabel(customLabel),
    customClusterLabel: customLabel,
    intensity: inferIntensityFromDesc(entry.desc),
  }
}

function inferIntensityFromDesc(desc: string): PortraitIntensity {
  for (const [word, value] of Object.entries(INTENSITY_FROM_DESC)) {
    if (desc.includes(word)) return value
  }
  if (desc.includes('mild')) return 'mild'
  if (desc.includes('moderate')) return 'moderate'
  if (desc.includes('severe')) return 'severe'
  return 'moderate'
}

export function isDevOnlyExtraEntry(entry: PortraitCatalogEntry): boolean {
  return entry.kind !== 'image'
}
