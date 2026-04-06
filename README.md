# oclive-pack-editor

独立 **角色包编写器**（Vite + Vue 3 + TypeScript）：只负责编辑并导出与 **oclivenewnew** 运行时兼容的 **`roles/{角色id}/`** 目录树或 zip（`.zip` / `.ocpak`，均为 zip 格式）。**不包含**对话引擎或运行时源码；两应用的唯一纽带是磁盘上的角色包。

## 与运行时的关系

| 项目 | 说明 |
|------|------|
| **本仓库** | 产出 `manifest.json` / `settings.json` 及占位场景、`knowledge/` 占位 |
| **oclivenewnew** | 加载、校验与对话；契约原文在其仓库 **`creator-docs/`** 与 **`roles/README_MANIFEST.md`** |

路径约定（Windows 示例）：与 `oclivenewnew` **同级**放置本仓库，例如 `D:\oclive-pack-editor` 与 `D:\oclivenewnew`。

## 使用

```bash
npm install
npm run dev
```

- 编辑 JSON 后先 **校验**，再 **导出** zip 或（浏览器支持时）**写入文件夹**。  
- 将导出结果置于运行时的 **roles 根目录** 下：该目录应直接包含 `你的角色id/manifest.json`。  
- 在 oclive 进程环境中设置 **`OCLIVE_ROLES_DIR`** 指向 **roles 根**：即直接包含各 `角色id/` 子文件夹的那一层（与 oclivenewnew 仓库内 `roles/` 目录的语义相同；**不要**指到某个角色子文件夹内部）。

详见 oclivenewnew 仓库内 **`creator-docs/getting-started/CREATOR_WORKFLOW.md`**（`OCLIVE_ROLES_DIR` 与加载方式）。

## 脚本

| 命令 | 作用 |
|------|------|
| `npm run dev` | 本地开发 |
| `npm run build` | 生产构建 |
| `npm test` | Vitest（导出路径、校验与序列化） |

## 校验策略

编写器内含一层与运行时 **`validate_disk_manifest`** 对齐的**轻量**检查；**权威校验**仍以运行时 **`load_role`** 为准。中期可抽 Rust crate / CLI 与 `role_manifest_validate` 同源，**不合并**两仓库——见运行时 **`creator-docs/role-pack/EDITOR_VALIDATION_ROADMAP.md`**。

## 许可证

MIT，见本仓库根目录 `LICENSE`。
