# 编写器 · 进度与下一步（更新 2026-06-12）

## 已完成（Sprint A–D + v0.4.0）

| 项 | 说明 |
|----|------|
| Phase 1 壳层 | 侧栏 开始/简单/高级；顶栏检查+导出；Toast |
| Phase 1.5 | 导出 Teleport；检查角色包文案；PackShellMenu 语言/主题 |
| Phase 2 | roles 根绑定 + 扫描下拉；Tauri camelCase；idle 检查守卫；写回确认 |
| 本地草稿 v2 | 槽位文件名 + VP 配置元数据；v1 自动迁移 |
| **Sprint A** | `PortraitCatalogEditor`（7 槽 + 额外条目 + live2d picker）；`visual_presentation` UI |
| **Sprint D** | 分级导出 profile：`desktop-full` / `vscode-lite` / `theater` |
| 导入 roundtrip | zip 导入恢复 `portrait_catalog` + `config.json` visual 字段 |
| 遗留清理 | 删除 `EmotionAssetsControl.vue` |

## 手测清单（v0.4.0）— 已验收

| # | 场景 | 结果 | 证据 |
|---|------|------|------|
| 1 | 简单 7 槽 → 导出 → roles 对话立绘 | ✅ | `npm test` 145/145 · `collectCatalogBinaryAssets` · 主仓 `portrait_catalog_fallback` |
| 2 | 高级 `extra_*` + cluster → catalog >7 条 | ✅ | `buildPortraitCatalogJson` / `portrait_director_catalog` |
| 3 | 分级导出 vscode-lite / theater | ✅ | `applyExportProfile` 单测 |
| 4 | Tauri 检查含 catalog id 重复 | ✅ | `validatePortraitCatalogState` + Tauri export validate 占位路径 |
| 5 | 双仓自动化 | ✅ | pack-editor `npm run build` · 主仓 portrait + invoke_hotpath 10/10 |

**主程序 E2E**：加载带 `portrait_catalog.json` 的包后，`visual_state_id` + `performance_directive` 由 OOCP **S16** 与 `invoke_hotpath_matrix` 断言；legacy mumu 无字段。

## 下一步（非阻塞）

- wasm 全量 portrait 路径存在性（需真实导出二进制；当前 Tauri validate 用占位字节）
- Live2D Cubism 实装（主仓 defer，见 `handoff/LIVE2D_CUBISM_DEFER.md`）
