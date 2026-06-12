# 编写器 · 进度与下一步（更新 2026-06-13）

## 已完成

| 项 | 说明 |
|----|------|
| Phase 1 壳层 | 侧栏 开始/简单/高级；顶栏检查+导出；Toast |
| Phase 1.5 | 导出 Teleport；检查角色包文案；PackShellMenu 语言/主题 |
| Phase 2 | roles 根绑定 + 扫描下拉；Tauri camelCase；idle 检查守卫；写回确认 |
| 本地草稿 v1 | 开始页「继续上次草稿 / 创建新包」；顶栏「保存草稿」；离开简单/高级时静默自动保存 |

## 手测清单（发版前）

1. Tauri：`D:\oclivenewnew\roles` → 刷新 → 加载 mumu → 简单编辑 → 检查 → 写入（覆盖/另存）
2. 创建新包 → 编辑 → 保存草稿 → 回开始页 → 继续草稿
3. zip 导入 → `packSession=loaded` → 检查
4. `npm test` / `npm run build`

## Phase 3 待做（需产品反馈）

1. **简单创作**：默认区已含 id/名字/性格/模型；进阶折叠内字段是否再减
2. **高级创作**：config.json Tab、includes/groups 只读提示
3. **术语**：FAQ / label 口语化
4. **Phase 4**：三发行版 smoke + `npm run check`
