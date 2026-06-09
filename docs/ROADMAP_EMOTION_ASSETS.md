# 编写器 · 情绪立绘日程

**状态**：已规划，**晚于 VS Code 发行版**。

## 背景

- 运行时立绘标签现收敛为 7 类：`happy` / `sad` / `angry` / `neutral` / `excited` / `confused` / `shy`（见 `oclivenewnew` `portrait_emotion_engine.rs` `ALLOWED`）。
- 包内路径约定：`roles/{id}/assets/images/{tag}.png`（与 `emotion-assets.ts` 映射一致）。
- 导出已支持上传 `emotionImages` → zip；**缺少包内可视化编辑与缺图校验 UX**。

## 计划

### M1 · 情绪图片编辑（编写器）

- 列表展示 7 标签 + 可选 `disgust_*` 变体占位说明。
- 拖拽/选择替换单张 PNG（jpg/webp 可选）。
- 导出时写入 `assets/images/`；校验文件名与标签表。
- 缺图时编写器警告，运行时桌面/VS Code emoji 回退（已有）。

### M2 · 情绪族扩展（产品 + 内核）

- 「情绪族」：同一族多张（如 disgust_light/mid/heavy）已部分存在于前端映射。
- 扩 `Emotion` 枚举与 `ALLOWED` 需 **RFC + 主仓版本**，非仅编写器 UI。
- 与 `oclive-pack-editor` 分级导出 `vscode-lite`（可只打包常用 3–4 张）联动。

## 依赖

- VS Code 发行版先接好 `assets/images` 读取（`oclive-vscode` `rolePack.ts`）。
- 分级导出 profile 定义后再做「按发行版裁剪情绪图数量」。

## 参考

- `oclivenewnew/handoff/archive/DEVELOPMENT_STANDARDS.md` §1.4
- `oclivenewnew/src/utils/emotion-assets.ts`
- `oclive-pack-editor/src/lib/exportPack.ts` `emotionImages`
