/** 与 App 内选择情绪图、导出到 assets/images/ 的扩展名约定一致。 */

const EMOTION_IMAGE_NAME_RE = /\.(png|jpe?g|webp|gif)$/i

export function isEmotionImageFileName(name: string): boolean {
  return EMOTION_IMAGE_NAME_RE.test(name)
}

export function filterEmotionImageFiles(files: Iterable<File>): File[] {
  return Array.from(files).filter((f) => isEmotionImageFileName(f.name))
}
