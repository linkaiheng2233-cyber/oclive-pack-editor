# exportProfile: vscode-lite · 导出契约（0.5 立项）

**状态**：设计 SSOT · **未实现**导出分叉代码  
**关联**：[`ROADMAP_EMOTION_ASSETS.md`](./ROADMAP_EMOTION_ASSETS.md) M2 · [`WAVE5_ASSETS_ASSESSMENT.md`](../../oclive-vscode/docs/WAVE5_ASSETS_ASSESSMENT.md)

---

## 动机

VS Code 侧栏立绘区高度有限；导出时仅打包常用 3–4 张情绪图可减小 zip 体积，与运行时 `assets/images/{tag}.png` 读取路径一致。

## 建议字段（pack-editor `manifest.json` 或导出选项）

```json
{
  "export_profile": "vscode-lite",
  "emotion_tags": ["neutral", "happy", "sad", "shy"]
}
```

| `export_profile` | 行为 |
|------------------|------|
| `full`（默认） | 导出全部 `emotionImages` |
| `vscode-lite` | 仅导出 `emotion_tags` 列表中的 canonical 标签；缺图时 validation **警告**（非错误） |

## Canonical 标签

与运行时对齐：`happy` · `sad` · `angry` · `neutral` · `excited` · `confused` · `shy`（见 `src/lib/emotionAssets.ts`）。

## 实现检查表（0.5.x）

- [ ] `exportPack.ts` 按 profile 过滤 `emotionImages`
- [ ] `oclive_validation` 可选警告：vscode-lite 缺推荐标签
- [ ] `ROLE_PACK_SPEC.md` 增补 `export_profile` 枚举
- [ ] pack-editor UI：导出对话框增加 profile 下拉

**不阻塞** 0.4.x 渗透插件化与聊天存储 UI。
