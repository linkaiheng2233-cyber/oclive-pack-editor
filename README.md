# oclive-pack-editor

独立 **角色包编写器**（Vite + Vue 3 + TypeScript + 可选 **Tauri 1.x** 桌面壳）：编辑并导出与 **oclivenewnew** 运行时兼容的 **`roles/{角色id}/`** 目录树或 zip（`.zip` / `.ocpak`，均为 zip 格式）。**不包含**对话引擎或运行时源码；两应用的唯一纽带是磁盘上的角色包。

**当前版本：0.1.0**（`package.json`、`src-tauri/tauri.conf.json`、`Cargo.toml` 已对齐）。

## 与运行时的关系

| 项目 | 说明 |
|------|------|
| **本仓库** | 产出 `manifest.json`、`settings.json`、`core_personality.txt`、可选 `knowledge/world.md`、占位场景、`assets/images/` 情绪图等 |
| **oclivenewnew** | 加载、校验与对话；契约原文在其仓库 **`creator-docs/`** 与 **`roles/README_MANIFEST.md`** |

路径约定（Windows 示例）：与 `oclivenewnew` **同级**放置本仓库，例如 `D:\oclive-pack-editor` 与 `D:\oclivenewnew`。

界面风格参考 **Fluent Design**（与常见 Fluent 桌面工具如 **qfluentwidgets** 一脉：浅色页背景、卡片层次、主色强调按钮），在 `src/style.css` 中通过 CSS 变量统一，并支持系统深色偏好。

## 离线范围

- **核心能力**（编辑、运行全部检查、导出 zip、桌面版选择 **roles 根** 并写入完整目录树）**不依赖外网**；不内嵌 LLM 或对话引擎。
- **桌面壳**为 **Tauri 1.x**（与 oclivenewnew 同大版本线），本地完整打包需安装 **Rust** 与对应平台依赖（见下）。

## 环境依赖

| 用途 | 需要 |
|------|------|
| 前端开发 / 测试 | **Node.js**（建议 LTS）、`npm ci` |
| 桌面开发与打包 | **Rust**（`rustup` stable）、**Tauri 1.x** 平台依赖 |
| Windows | **WebView2**（通常已随系统/Edge）、`tauri build` 需 **Visual Studio Build Tools**（MSVC、Windows SDK） |
| Linux（含 CI） | `libwebkit2gtk-4.0-dev`、`libgtk-3-dev`、`libayatana-appindicator3-dev`、`librsvg2-dev` 等（与 [Tauri 1 前置说明](https://v1.tauri.app/v1/guides/getting-started/prerequisites) 一致） |

## 创作模式

- **简单创作**
  - **基础**：人设长文（写入 `core_personality.txt`）与 **情绪图片**（导出至 `assets/images/`，文件名需与 oclive 情绪资源命名一致）。
  - **进阶**（可折叠）：场景、用户身份、**世界观**（`knowledge/world.md`）、**事件影响系数**（角色受影响程度）等，对应背后的 `manifest.json` / `settings.json`。
- **高级创作**：分标签编辑 **manifest.json**、**settings.json**、**core_personality.txt**、**世界观 Markdown**、**情绪图片列表**；适合插件字段、多身份与完整包结构。
- **导入角色包**：支持 **`.zip` / `.ocpak`**，解析后回填上述内容，便于在已有包上修改或另存为新包。导入时会校验 zip 内路径：拒绝含 `..` / `.` 段的非法路径（防 zip-slip）；情绪图仅接受 `{roleId}/assets/images/` 下**单层**文件名（不接受子目录）。

编写器 **不提供** 内嵌运行时联调；导出后请将角色目录放入运行时的 **roles 根** 下，由 oclive 加载测试。

## 使用

**Windows**：安装依赖后，双击根目录 **`start.bat`** 会**先询问打开方式**（Tauri 桌面窗口 / 仅浏览器），不会同时打开两种界面。命令行可直接指定：`start.bat tauri`、`start.bat web`。

```bash
npm install
npm run tauri:dev    # 桌面窗口：Vite 在后台，不自动打开系统浏览器
npm run dev:browser  # 仅浏览器：Vite + 自动打开浏览器
npm run dev          # 仅启动 Vite（不自动开浏览器；供 Tauri 子进程或手动打开 http://localhost:5173）
```

1. 可选 **「运行全部检查」** 查看 manifest / settings 与契约一致性。  
2. 勾选 **「导出前校验包内容」**（默认开启）：关闭后可在未通过检查时仍导出 zip 或写入文件夹，便于半成品或插件扩展包到 oclive 中实测。  
3. **导出** `.ocpak` / `.zip`（浏览器下载到本机任意位置），或使用 **「写入文件夹（自选 roles 根目录）」**（Tauri 或支持 File System Access 的 Chromium）。  
4. 将解压或写入得到的 **`{roleId}/`** 文件夹放进运行时的 **roles 根**（与 zip 内结构一致：**不要**多套一层目录）。  
5. 在 oclive 进程环境中设置 **`OCLIVE_ROLES_DIR`** 指向 **roles 根**：即直接包含各 `角色id/` 子文件夹的那一层（与 oclivenewnew 仓库内 `roles/` 目录的语义相同；**不要**指到某个角色子文件夹内部）。

详见 oclivenewnew 仓库内 **`creator-docs/getting-started/CREATOR_WORKFLOW.md`**（`OCLIVE_ROLES_DIR` 与加载方式）。

### 桌面版（Tauri）

```bash
npm run tauri:dev    # 开发：先起 Vite，再打开窗口
npm run tauri:build  # 生产安装包 / 可执行文件（需完整 Rust + 平台依赖）
```

`src-tauri/tauri.conf.json` 引用的图标位于 **`src-tauri/icons/`**。若仓库中尚未包含图标文件，请准备一张方形 PNG（建议 ≥512×512），执行 `npx tauri icon path/to/icon.png` 生成全套资源后再打包。

编写器独立软件形态与仓库边界见 **[docs/STANDALONE.md](./docs/STANDALONE.md)**。

## 与 oclivenewnew 联调（简要）

1. 在本编写器中导出 zip 并解压，或使用「写入文件夹」指向某一目录，使该目录作为 roles 根且其下出现 `{roleId}/manifest.json`。  
2. 将 **该 roles 根** 配置为 **`OCLIVE_ROLES_DIR`**。  
3. 在 oclivenewnew 中通过 **`load_role`** 加载；权威校验以运行时为准。

## 脚本

| 命令 | 作用 |
|------|------|
| `start.bat`（Windows） | 交互选 Tauri 或浏览器；`start.bat tauri` / `start.bat web` 跳过询问 |
| `npm run dev` | 仅起 Vite（无 `--open`；`tauri dev` 的前置命令与此相同，避免双开浏览器） |
| `npm run dev:browser` | 浏览器开发 + 自动打开 `localhost:5173` |
| `npm run build` | 生产构建（`dist/`，供 Tauri `distDir` 使用） |
| `npm test` | Vitest（导出路径、校验与包检查） |
| `npm run test:e2e` | Playwright 冒烟（需先 `npm run build`；首次可执行 `npm run test:e2e:install` 安装浏览器） |
| `npm run tauri:dev` | Tauri 开发窗口 |
| `npm run tauri:build` | Tauri 打包（安装包 / 可执行文件） |
| `npm run cargo:build` | 仅编译 `src-tauri`（不跑完整 `tauri build` 安装器） |

## 源码布局（简要）

| 路径 | 说明 |
|------|------|
| `src/composables/usePackEditor.ts` | 编辑区状态、持久化、导入/导出、校验与简单表单同步 |
| `src/components/pack/` | 检查区、简单/高级创作面板、情绪图控件 |
| `src/lib/` | zip/文件夹导出、`importPack`、契约校验、`simpleCreation`、`exportPrepare` 等 |
| `e2e/` | Playwright 冒烟用例；`playwright.config.ts` 使用 `vite preview` |

## 实现要点（维护者）

- **JSON 解析**：`parsePackDocuments`（`src/lib/packChecks.ts`）为单一入口；**运行全部检查**（`runAllPackChecks`）与 **导出前置**（`prepareExportPayload` → `exportPrepare.ts`）都基于它，避免对同一段 manifest/settings 文本重复 `JSON.parse`。
- **导出前置**：`usePackEditor` 内 `tryBuildExportPayload()` 统一「简单模式写回 → 可选全量检查 → 取 roleId」；底部 **操作反馈** 区分成功（绿）与失败（红），由 `lastMessage` + `lastMessageIsError` 驱动。
- **无障碍**：高级创作 Tab 条支持 **左右方向键** 切换、`Home` / `End` 跳首尾（焦点在 Tab 列表上时）。
- **开发双开浏览器**：`beforeDevCommand` 使用 `npm run dev`（`vite` 无 `--open`）；需要自动打开浏览器时用 **`npm run dev:browser`** 或 **`start.bat`** 选「仅浏览器」。

## 发布 / 联调前自检

1. `npm ci`（或 `npm install`）  
2. `npm test` → `npm run build`  
3. 若需 E2E：`npm run test:e2e:install` 后 `npm run test:e2e`（仅验证静态页；日常改 UI 不必跑）  
4. 桌面壳：`npm run tauri:dev` 验证窗口与「写入文件夹」；发布安装包用 `npm run tauri:build`  

将导出得到的 `{roleId}/` 放入 oclive 的 **roles 根**，并设置 **`OCLIVE_ROLES_DIR`** 后在运行时侧验证（见上文「与 oclivenewnew 联调」）。

## CI

推送或 PR 至 `main` / `master` 时，GitHub Actions 会执行 **`npm test`**、**`npm run build`**、**Playwright 冒烟**（`npm run test:e2e`）与 **`cargo build --manifest-path src-tauri/Cargo.toml`**（Linux + Tauri 系统依赖）。也可在 Actions 中 **手动运行** 同一工作流。

## 校验策略

编写器内含一层与运行时 **`validate_disk_manifest`** 对齐的**轻量**检查；**权威校验**仍以运行时 **`load_role`** 为准。中期可抽 Rust crate / CLI 与 `role_manifest_validate` 同源，**不合并**两仓库——见运行时 **`creator-docs/role-pack/EDITOR_VALIDATION_ROADMAP.md`**。

## 许可证

MIT，见本仓库根目录 `LICENSE`。
