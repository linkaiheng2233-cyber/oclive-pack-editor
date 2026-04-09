/** 与 oclive-launcher / Rust `write_role_creator_message` 一致 */
export const ROLE_PACK_CREATOR_MESSAGE_MAX_CHARS = 160

export const ROLE_PACK_CREATOR_MESSAGE_FILENAME = 'creator_message.txt'

/** 取首行并截断至最大字数（与导出 zip 写入逻辑一致） */
export function clipRolePackCreatorMessageLine(raw: string): string {
  const first =
    raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? ''
  return [...first].slice(0, ROLE_PACK_CREATOR_MESSAGE_MAX_CHARS).join('')
}

/** 单行截断（用于「按模块各一句」模式下每一行） */
export function clipCreatorMessageSingleLine(line: string): string {
  const t = line.trim().split(/\r?\n/)[0]?.trim() ?? ''
  return [...t].slice(0, ROLE_PACK_CREATOR_MESSAGE_MAX_CHARS).join('')
}

export type CreatorMessageExportMode = 'unified' | 'per_module'

/** 生成写入 `creator_message.txt` 的正文；无内容时返回 `undefined`（不写文件） */
export function buildCreatorMessageFileContent(
  raw: string,
  mode: CreatorMessageExportMode,
): string | undefined {
  if (mode === 'unified') {
    const line = clipRolePackCreatorMessageLine(raw)
    return line ? `${line}\n` : undefined
  }
  const lines = raw
    .split(/\r?\n/)
    .map((l) => clipCreatorMessageSingleLine(l))
    .filter((l) => l.length > 0)
  return lines.length > 0 ? `${lines.join('\n')}\n` : undefined
}
