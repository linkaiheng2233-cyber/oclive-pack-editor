/**
 * manifest.json 可选字段 `creator_message_to_downloader`（与 oclive_validation json_keys 一致）。
 * 高级创作中直接读写 manifest 文本，避免与简单表单双源漂移。
 */

export function readManifestCreatorMessageToDownloader(manifestJson: string): string {
  try {
    const m = JSON.parse(manifestJson) as Record<string, unknown>
    const v = m.creator_message_to_downloader
    return typeof v === 'string' ? v : ''
  } catch {
    return ''
  }
}

export function patchManifestCreatorMessageToDownloader(
  manifestJson: string,
  value: string,
): string {
  let m: Record<string, unknown>
  try {
    m = JSON.parse(manifestJson) as Record<string, unknown>
  } catch {
    m = {}
  }
  const t = value.trim()
  if (t) {
    m.creator_message_to_downloader = t
  } else {
    delete m.creator_message_to_downloader
  }
  return JSON.stringify(m, null, 2) + '\n'
}
