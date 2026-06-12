# 编写器 · 进度与下一步（更新 2026-06-12）

## 已完成（Sprint A–D）

| 项 | 说明 |
|----|------|
| Phase 1 壳层 | 侧栏 开始/简单/高级；顶栏检查+导出；Toast |
| Phase 1.5 | 导出 Teleport；检查角色包文案；PackShellMenu 语言/主题 |
| Phase 2 | roles 根绑定 + 扫描下拉；Tauri camelCase；idle 检查守卫；写回确认 |
| 本地草稿 v1 | 开始页「继续上次草稿 / 创建新包」；顶栏「保存草稿」 |
| **Sprint A** | `PortraitCatalogEditor`（7 槽 + 额外条目）；替换高级 `EmotionAssetsControl`；`visual_presentation` UI（含 live2d model 路径）；portrait catalog 校验 |
| **Sprint D** | 分级导出 profile：`desktop-full` / `vscode-lite` / `theater`（导出菜单） |
| 导入 roundtrip | zip 导入恢复 `portrait_catalog` + `config.json` visual 字段 |

## 手测清单（v0.4.0）

1. **简单 7 槽**：简单创作选 7 图 → 导出 → 解压到 `roles/` → 主程序对话立绘切换
2. **高级 catalog**：高级 images 追加 `extra_*` 条目 + cluster → 导出 zip >7 条 `portrait_catalog.json`
3. **分级导出**：`vscode-lite` 无 VP；`theater` 默认 live2d backend
4. Tauri：加载 roles → 检查（含 catalog id 重复报错）→ 写入文件夹
5. `npm test` / `npm run build`

## 下一步（非 v0.4 阻塞）

- Live2D 资源绑定 UI（catalog `kind: live2d` 文件 picker）
- 草稿 v2 存槽位元数据（仍不存图片二进制）
- 与主仓 `oclive_validation` wasm 全量 portrait 校验对齐
