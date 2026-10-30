# vscode-lite · 当前导出配置

**状态**：当前源码已实现。导出变换以 [`applyExportProfile`](../src/lib/portraitCatalog.ts) 为准，由 [`usePackEditor`](../src/composables/usePackEditor.ts) 在构造导出数据时调用。本文区分编写器的导出选项和角色包的运行时契约。

---

## 用途

面向轻量宿主保留简单立绘槽，去掉额外立绘条目并关闭 Visual Presentation（VP）。它不会按固定的 3–4 张名单裁剪七个简单槽，也不表示目标宿主支持额外的视觉后端。

## 当前行为

| 项目 | `vscode-lite` 的变换 |
|------|----------------------|
| 简单立绘槽 `slotFiles` | 保留已提供的槽位文件，不补图、不强制填满七槽 |
| `portraitEnabled` | 保持用户启用意图，且至少有一个槽位文件才启用 |
| 高级额外条目 `extraEntries` | 导出时置空 |
| VP 配置 `visual` | `enabled: false`，`backend: image` |

默认选项名为 `desktop-full`，另有 `theater`；各配置不保证目标宿主都实现同样的呈现能力。选择导出配置不会改写输入原件。

## Canonical 标签

简单槽 ID 为 `happy_default`、`sad_default`、`angry_default`、`neutral_default`、`excited_default`、`confused_default`、`shy_default`。七个槽是可用的编辑位置，不是强制七图门槛；资产输出仍由立绘目录与实际文件组成。

## 接入与验证

- 当前路径：`applyExportProfile` → `emotionFilesFromCatalog` → 导出目录/压缩包。
- 边界测试：[`portraitCatalog.test.ts`](../src/lib/portraitCatalog.test.ts)。
- 角色包编辑与保存契约：[ROLE_PACK_EDITOR](../creator-docs/ROLE_PACK_EDITOR.md)。

早期草案中的 `export_profile` / `emotion_tags` manifest 示例不作为新增格式要求。是否属于合法包字段，以主仓当前 [ROLE_PACK_SPEC](../../oclivenewnew/creator-docs/role-pack/ROLE_PACK_SPEC.md) 和验证器为准。
