/** 单条 manifest `ui_slots`（嵌入槽）。 */
export type UiSlotVariantInfo = {
  slot: string
  appearanceId: string
  label?: string | null
}

/** 与编写器 Tauri `list_directory_plugins_for_roles_root` 返回一致。 */
export type DirectoryPluginInfo = {
  id: string
  version: string
  /** manifest `provides`；空数组表示未声明（编写器视为全能力可选）。 */
  provides: string[]
  /** manifest `type`（如 ocliveplugin） */
  pluginType?: string | null
  /** 是否存在 `shell` 段（整壳） */
  isShell: boolean
  /** `ui_slots[].slot` 列表（去重保序） */
  uiSlotNames: string[]
  /** 每条 `ui_slots` 一条（含多外观） */
  uiSlotVariants?: UiSlotVariantInfo[]
}
