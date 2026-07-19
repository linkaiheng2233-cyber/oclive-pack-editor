# 编写器 · 进度与下一步（更新 2026-07-19）

## 已完成（Sprint A–D + v0.5.0）

| 项 | 说明 |
|----|------|
| Phase 1 壳层 | 侧栏 开始/简单/高级；顶栏检查+导出；Toast |
| Phase 1.5 | 导出 Teleport；检查角色包文案；PackShellMenu 语言/主题 |
| Phase 2 | roles 根绑定 + 扫描下拉；Tauri camelCase；idle 检查守卫；写回确认 |
| 本地草稿 v2 | 槽位文件名 + VP 配置元数据；v1 自动迁移 |
| **Sprint A** | `PortraitCatalogEditor`（7 槽 + 额外条目 + live2d picker）；`visual_presentation` UI |
| **Sprint D** | 分级导出 profile：`desktop-full` / `vscode-lite` / `theater` |
| 导入 roundtrip | zip 导入恢复 `portrait_catalog` + `config.json` visual 字段 |
| 人设 / 记忆解耦 | 高级编辑 `memory_seed.json` 与 `user_identities/`；zip 和磁盘加载均可回填 |
| 无损再导出 | 保留蓝图 `includes` / `groups` / `expert_overlay` / `runtime_config` 与安全卫星文件 |
| 遗留清理 | 删除 `EmotionAssetsControl.vue` |

## 自动化验收（v0.5.0）

| # | 场景 | 结果 | 证据 |
|---|------|------|------|
| 1 | 简单 7 槽 → 导出 → roles 对话立绘 | ✅ | `collectCatalogBinaryAssets` · 主仓 `portrait_catalog_fallback` |
| 2 | 高级 `extra_*` + cluster → catalog >7 条 | ✅ | `buildPortraitCatalogJson` / `portrait_director_catalog` |
| 3 | 分级导出 vscode-lite / theater | ✅ | `applyExportProfile` 单测 |
| 4 | Tauri 检查含 catalog id 重复 | ✅ | `validatePortraitCatalogState` + Tauri export validate 占位路径 |
| 5 | 双仓自动化 | ✅ | pack-editor `npm run build`；主仓结果以其 `AI_VERIFICATION_PROTOCOL.md` 与测试矩阵为准 |
| 6 | 人设 / 记忆 / 卫星文件 roundtrip | ✅ | Vitest 导入导出与路径安全用例；Playwright 高级页 smoke |

**主程序 E2E**：加载带 `portrait_catalog.json` 的包后，`visual_state_id` + `performance_directive` 由主仓 OOCP 与 invoke 热路径矩阵负责断言；场景编号与条数以主仓测试 SSOT 为准。

## 下一步（非阻塞）

- wasm 全量 portrait 路径存在性（需真实导出二进制；当前 Tauri validate 用占位字节）
- Live2D Cubism 实装（主仓 defer，见 `handoff/LIVE2D_CUBISM_DEFER.md`）

## 2026-06-12 · roles 工作区 ↔ 第 3/4 设施

| 链路 | 状态 |
|------|------|
| 导出 zip / 写 roles 文件夹 | `portrait_catalog.json` + `config.json`（`portrait_catalog.enabled` / `visual_presentation`） |
| zip 导入 | catalog path 二进制（含 live2d）+ VP 配置回填 |
| **roles 扫描加载** | `load_role_pack_for_editor` 返回 catalog 文本 + 磁盘 assets → 7 槽 / VP UI |
| 主程序运行时 | `RoleStorage` 读 catalog + `materialize_directive`（主仓 ≥0.4） |
