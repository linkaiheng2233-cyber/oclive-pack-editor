# 角色包编辑器（编写器）

桌面版 **oclive-pack-editor**（Tauri）侧栏 **「角色包」** 入口：

1. **打开角色包目录**：选择含 `manifest.json` 的包根目录（与 `ROLE_PACK_SPEC` 一致）。
2. **表单 / JSON**：表单编辑常用字段与七维、`plugin_backends` 六槽 + `agent`；JSON 模式直接改全文；切回表单前会校验 JSON 语法。
3. **校验**：优先调用与主仓同源的 **`oclive_validation` wasm**（`validateRolePackWasm`）；未构建 wasm 时回退 TypeScript 子集检查。
4. **回复质量锚点**：预设与自定义写入 `settings.json` → `reply_quality_anchor`，与 `replyQualityAnchorPreset.ts` / 主程序导出语义一致。
5. **保存**：校验通过后可写回 `manifest.json` 与 `settings.json`。

构建编写器 Tauri 壳时，需在同级目录提供 **oclivenewnew** 仓库（`../../oclivenewnew/crates/oclive_validation`），与 CI 浅克隆布局一致。

权威格式见主仓：`creator-docs/role-pack/ROLE_PACK_SPEC.md`。
