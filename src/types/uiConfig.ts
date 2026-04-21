/** 单插槽：`order` 为插件 id 排序；`visible` 为默认可见子集（须 ⊆ order）。 */
export interface SlotConfig {
  order: string[]
  visible: string[]
  /** 插件 id → 默认 `appearance_id`（同一槽多外观时写入包） */
  appearance?: Record<string, string>
}

export interface ThemeConfig {
  primaryColor: string
  backgroundColor: string
  fontFamily: string
}

export interface LayoutConfig {
  /** `left` | `right` */
  sidebar: string
  /** `bottom` | `top` */
  chatInput: string
}

/** 代码内命名（序列化到 `ui.json` 时 `settings.panel` / `role.detail` 用点号键）。 */
export interface UiConfig {
  shell: string
  theme: ThemeConfig
  layout: LayoutConfig
  slots: {
    chat_toolbar: SlotConfig
    settings_panel: SlotConfig
    role_detail: SlotConfig
    sidebar: SlotConfig
    chat_header: SlotConfig
    settings_plugins: SlotConfig
    settings_advanced: SlotConfig
    overlay_floating: SlotConfig
    launcher_palette: SlotConfig
    debug_dock: SlotConfig
  }
}

export function defaultUiConfig(): UiConfig {
  return {
    shell: '',
    theme: {
      primaryColor: '',
      backgroundColor: '',
      fontFamily: '',
    },
    layout: {
      sidebar: '',
      chatInput: '',
    },
    slots: {
      chat_toolbar: { order: [], visible: [] },
      settings_panel: { order: [], visible: [] },
      role_detail: { order: [], visible: [] },
      sidebar: { order: [], visible: [] },
      chat_header: { order: [], visible: [] },
      settings_plugins: { order: [], visible: [] },
      settings_advanced: { order: [], visible: [] },
      overlay_floating: { order: [], visible: [] },
      launcher_palette: { order: [], visible: [] },
      debug_dock: { order: [], visible: [] },
    },
  }
}
