# 角色包编辑器（编写器）

桌面版 **oclive-pack-editor**（Tauri）侧栏 **「角色包」** 入口：

1. **打开角色包目录**：选择含 **`pipeline.ocblueprint`** 的 v2 角色包根目录（与 `ROLE_PACK_SPEC` 一致）。legacy `manifest.json` 包须先用 `oclive pack migrate-to-blueprint` 迁移。
2. **表单 / JSON**：表单编辑常用字段与七维、`plugin_backends` 六槽 + `agent`（编辑器内拆为「角色门面 meta 视图」与「运行时 settings 视图」）；JSON 模式直接改全文；切回表单前会校验 JSON 语法。
3. **校验**：构建 v2 蓝图并走 **`validate_blueprint_v2_json`**（桌面 Tauri，与 `pack validate` 默认 profile 同源）；浏览器开发时回退 TypeScript 子集检查。
4. **回复质量锚点**：预设与自定义导出至 **`prompts/reply_quality_anchor.md`**（v2 推荐路径），与 `replyQualityAnchorPreset.ts` / 主程序运行时一致。
5. **保存**：校验通过后可写回 **`pipeline.ocblueprint`**（及 `prompts/reply_quality_anchor.md` 等附属文件）；不保留 legacy 三件套。

构建编写器 Tauri 壳时，需在同级目录提供 **oclivenewnew** 仓库（`../../oclivenewnew/crates/oclive_validation`），与 CI 浅克隆布局一致。

权威格式见主仓：`creator-docs/role-pack/ROLE_PACK_SPEC.md`。
