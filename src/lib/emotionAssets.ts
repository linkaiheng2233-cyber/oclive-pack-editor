/** 与 App 内选择情绪图、导出到 assets/images/ 的扩展名约定一致。 */

const EMOTION_IMAGE_NAME_RE = /\.(png|jpe?g|webp|gif)$/i

/** 运行时 7 类立绘标签（与 oclivenewnew portrait_emotion_engine ALLOWED 对齐）。 */
export const CANONICAL_EMOTION_TAGS = [
  'happy',
  'sad',
  'angry',
  'neutral',
  'excited',
  'confused',
  'shy',
] as const

export type CanonicalEmotionTag = (typeof CANONICAL_EMOTION_TAGS)[number]

export function isEmotionImageFileName(name: string): boolean {
  return EMOTION_IMAGE_NAME_RE.test(name)
}

export function filterEmotionImageFiles(files: Iterable<File>): File[] {
  return Array.from(files).filter((f) => isEmotionImageFileName(f.name))
}

/** Whether any uploaded filename maps to a canonical tag (e.g. happy.png). */
export function hasEmotionTagAsset(fileNames: Iterable<string>, tag: CanonicalEmotionTag): boolean {
  const lower = tag.toLowerCase()
  for (const name of fileNames) {
    const base = name.replace(/\.[^.]+$/, '').toLowerCase()
    if (base === lower || base.startsWith(`${lower}_`) || base.startsWith(`${lower}-`)) {
      return true
    }
  }
  return false
}
