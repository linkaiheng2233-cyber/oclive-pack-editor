# oclive-pack-editor

独立 **角色包编写器**（Vite + Vue 3 + TypeScript）：只负责编辑并导出与 **oclivenewnew** 运行时兼容的 **`roles/{角色id}/`** 目录树或 zip（`.zip` / `.ocpak`，均为 zip 格式）。**不包含**对话引擎或运行时源码；两应用的唯一纽带是磁盘上的角色包。

## 与运行时的关系

| 项目 | 说明 |
|------|------|
| **本仓库** | 产出 `manifest.json` / `settings.json` 及占位场景、`knowledge/` 占位 |
| **oclivenewnew** | 加载、校验与对话；契约原文在其仓库 **`creator-docs/`** 与 **`roles/README_MANIFEST.md`** |

路径约定（Windows 示例）：与 `oclivenewnew` **同级**放置本仓库，例如 `D:\oclive-pack-editor` 与 `D:\oclivenewnew`。

## 离线范围

- **核心能力**（编辑 JSON、运行全部检查、导出 zip、桌面版选择 **roles 根** 并写入目录树）**不依赖外网**；不内嵌 LLM 或对话引擎。
- **桌面壳**为 **Tauri 1.x**（与 oclivenewnew 对齐），本地构建需安装 **Rust** 与对应平台依赖（见下）。

## 环境依赖

| 用途 | 需要 |
|------|------|
| 前端开发 / 测试 | **Node.js**（建议 LTS）、`npm ci` |
| 桌面开发与打包 | **Rust**（`rustup` stable）、**Tauri 1.x** 平台依赖 |
| Windows | **WebView2**（通常已随系统/Edge）、构建需 **Visual Studio Build Tools**（MSVC、Windows SDK） |
| Linux（含 CI） | `libwebkit2gtk-4.0-dev`、`libgtk-3-dev`、`libayatana-appindicator3-dev`、`librsvg2-dev` 等（与 [Tauri 1 文档](https://v1.tauri.app/v1/guides/getting-started/prerequisites) 一致） |

## 使用

```bash
npm install
npm run dev
```

- 编辑 JSON 后使用 **「运行全部检查」**，再 **导出** zip 或 **写入文件夹（roles 根）**。  
- 可选勾选 **「导出前必须通过全部检查」**（默认开启）；关闭后可在未通过检查时仍导出（不推荐）。  
- 将导出结果置于运行时的 **roles 根目录** 下：该目录应直接包含 `你的角色id/manifest.json`。  
- 在 oclive 进程环境中设置 **`OCLIVE_ROLES_DIR`** 指向 **roles 根**：即直接包含各 `角色id/` 子文件夹的那一层（与 oclivenewnew 仓库内 `roles/` 目录的语义相同；**不要**指到某个角色子文件夹内部）。

详见 oclivenewnew 仓库内 **`creator-docs/getting-started/CREATOR_WORKFLOW.md`**（`OCLIVE_ROLES_DIR` 与加载方式）。

### 桌面版（Tauri）

```bash
npm run tauri:dev    # 开发：先起 Vite，再打开窗口
npm run tauri:build  # 生产安装包 / 可执行文件（需完整 Rust + 平台依赖）
```

编写器独立软件形态与仓库边界见 **[docs/STANDALONE.md](./docs/STANDALONE.md)**。

## 与 oclivenewnew 联调（简要）

1. 在本编写器中导出到某一目录，或解压 zip 使该目录下出现 `{roleId}/manifest.json`。  
2. 将**包含各 `{roleId}/` 文件夹的那一层目录**设为 **`OCLIVE_ROLES_DIR`**。  
3. 在 oclivenewnew 中通过 **`load_role`** 加载；权威校验以运行时为准。

## 脚本

| 命令 | 作用 |
|------|------|
| `npm run dev` | 本地开发（浏览器 / `vite`） |
| `npm run build` | 生产构建（`dist/`，供 Tauri `distDir` 使用） |
| `npm test` | Vitest（导出路径、校验与包检查） |
| `npm run tauri:dev` | Tauri 开发窗口 |
| `npm run tauri:build` | Tauri 打包 |
| `npm run cargo:build` | 仅编译 `src-tauri`（不跑完整 `tauri build` 安装器） |

## 校验策略

编写器内含一层与运行时 **`validate_disk_manifest`** 对齐的**轻量**检查；**权威校验**仍以运行时 **`load_role`** 为准。中期可抽 Rust crate / CLI 与 `role_manifest_validate` 同源，**不合并**两仓库——见运行时 **`creator-docs/role-pack/EDITOR_VALIDATION_ROADMAP.md`**。

## 许可证

MIT，见本仓库根目录 `LICENSE`。
