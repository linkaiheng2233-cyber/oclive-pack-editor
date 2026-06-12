import { parsePackDocuments } from './packChecks'
import { validateRoleIdForExport } from './exportErrorMessages'

export type ExportPayload =
  | {
      ok: true
      roleId: string
      manifest: Record<string, unknown>
      settings: Record<string, unknown>
    }
  | { ok: false; message: string }

/**
 * 从当前编辑区文本得到导出所需 roleId 与对象；与 zip / 写文件夹共用。
 */
export function prepareExportPayload(
  manifestText: string,
  settingsText: string,
): ExportPayload {
  const parsed = parsePackDocuments(manifestText, settingsText)
  if (!parsed.ok) {
    return { ok: false, message: parsed.errors.join(' ') }
  }
  const { manifest, settings } = parsed
  const roleId = String(manifest.id ?? '').trim()
  const idErr = validateRoleIdForExport(roleId)
  if (idErr) {
    return { ok: false, message: idErr }
  }
  return { ok: true, roleId, manifest, settings }
}
