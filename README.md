# oclive-pack-editor

[![CI](https://github.com/linkaiheng2233-cyber/oclive-pack-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/linkaiheng2233-cyber/oclive-pack-editor/actions/workflows/ci.yml)

独立 **角色包编写器**（Vite + Vue 3 + TypeScript + 可选 **Tauri 1.x** 桌面壳）：编辑并导出与 **oclivenewnew** 运行时兼容的 **`roles/{角色id}/`** 目录树或 zip（`.zip` / `.ocpak`，均为 zip 格式）。**不包含**对话引擎或运行时源码；两应用的唯一纽带是磁盘上的角色包。

**当前版本：0.1.0**（`package.json`、`src-tauri/tauri.conf.json`、`Cargo.toml` 已对齐）。

## 与运行时的关系

| 项目 | 说明 |
|------|------|
| **本仓库** | 产出 `manifest.json`、`settings.json`、`core_personality.txt`、可选 **`knowledge/**/*.md`**（多文件世界观）、占位场景、`assets/images/` 情绪图等 |
| **oclivenewnew** | 加载、校验与对话；契约原文在其仓库 **`creator-docs/`** 与 **`roles/README_MANIFEST.md`** |

路径约定（Windows 示例）：与 `oclivenewnew` **同级**放置本仓库，例如 `D:\oclive-pack-editor` 与 `D:\oclivenewnew`。

## 新用户：从下载到第一次对话（与另两仓库的关系）

| 步骤 | 说明 |
|------|------|
| 1 | 安装 **Node.js**，按需安装 **Ollama**（试聊 / 完整运行时需要）。 |
| 2 | 克隆 **[oclivenewnew](https://github.com/linkaiheng2233-cyber/oclivenewnew)**（运行时）与本 **编写器**；可选 **[oclive-launcher](https://github.com/linkaiheng2233-cyber/oclive-launcher)** 统一管理路径与 **`OCLIVE_ROLES_DIR`**。 |
| 3 | 在本编写器中编辑或导入角色包，**导出 .zip / .ocpak** 或使用桌面版 **「写入文件夹」**，使 **`{角色id}/manifest.json`** 出现在某一 **roles 根** 下（该根路径即运行时的 **`OCLIVE_ROLES_DIR`**）。也可使用 **oclive-launcher** 的 **「从 zip 安装角色包」** 解压到该根并选择本机 **Ollama 模型**（见 [启动器 README](https://github.com/linkaiheng2233-cyber/oclive-launcher/blob/main/README.md)）。 |
| 4 | 启动 **oclivenewnew**，在应用内从该 roles 根加载角色并开始对话；试聊页见下文「试聊」。 |

权威说明：`oclivenewnew` 仓库 **[creator-docs/getting-started/CREATOR_WORKFLOW.md](https://github.com/linkaiheng2233-cyber/oclivenewnew/blob/main/creator-docs/getting-started/CREATOR_WORKFLOW.md)**；启动器上手路径见 **[oclive-launcher README](https://github.com/linkaiheng2233-cyber/oclive-launcher#新用户从下载到第一次对话推荐路径)**。

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
  - **对话推理（大脑）**（进阶 · 引擎设置）：与 **oclive-launcher** 对齐，选择 **本机 Ollama**（填写 `model`）或 **云端 Remote LLM**（包内 `plugin_backends.llm: remote`）；云端侧车 URL 在启动 oclive 时由启动器注入 `OCLIVE_REMOTE_LLM_URL`，协议见 oclivenewnew `REMOTE_PLUGIN_PROTOCOL.md`。记忆 / 情绪 / 事件 / Prompt 四类后端仍在同页「其他插件后端」中配置。
- **高级创作**：分标签编辑 **manifest.json**、**settings.json**、**core_personality.txt**、**知识 Markdown（`knowledge/*.md`）**、**情绪图片列表**；适合插件字段、多身份与完整包结构。
- **世界观与知识文件（高级 · 世界观）**
  - 支持多个 **`knowledge/*.md`**；简单模式下的「世界观」仍与 **`knowledge/world.md`** 同步。
  - **Front matter 表单**：`id`、`tags`、`scenes`、`event_hints`、`weight`，无需手写 YAML；正文与元数据分离编辑。
  - **运行全部检查** 会附带知识级校验（例如路径、`id` 重复等），与 manifest/settings 结果合并展示。
  - **知识强调预览 / 调参助手**（仅编辑器内近似）：输入关键词可预览命中与原因、正文片段；可选「预览条件：场景」与严格场景开关；**临时权重滑杆**只影响预览排序，满意后再写入真实 `weight`。运行时召回以 oclivenewnew 为准，预览用于创作调参。
- **导入角色包**：支持 **`.zip` / `.ocpak`**，解析后回填上述内容，便于在已有包上修改或另存为新包。导入时会校验 zip 内路径：拒绝含 `..` / `.` 段的非法路径（防 zip-slip）；情绪图仅接受 `{roleId}/assets/images/` 下**单层**文件名（不接受子目录）。

编写器 **不包含**对话引擎本体；**试聊**页可连接本机已启动的 **oclivenewnew HTTP API**（`--api`，默认端口 `8420`），用与导出包一致的 `role_path` 做快速对话。导出后也可将角色目录放入运行时的 **roles 根** 下，由完整 oclive 进程加载测试。

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
| `npm run wasm:build` | （可选）安装 [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/) 后，在**本仓库根目录**执行 `node scripts/wasm-pack-build.mjs`，默认将 `../oclivenewnew/crates/oclive_validation` 输出到 `src/wasm/pkg/`。可用 **`OCLIVE_VALIDATION_CRATE`**、**`OCLIVE_WASM_OUT`** 覆盖路径。未构建时保留占位 stub，回退 TypeScript 校验 |

## 试聊（HTTP API）

1. 在 **oclivenewnew** 侧启动 API：`oclivenewnew --api`（可用 `--port` 或环境变量 **`OCLIVE_API_PORT`**；编写器默认 API 地址为 `http://127.0.0.1:8420`，请与端口一致）。  
2. 打开编写器 **「试聊」**：桌面版可通过 Tauri 调用 **`runtime_api_health` / `runtime_api_chat`**（无 CORS 限制）。浏览器开发时，oclivenewnew 的 API 已对 `127.0.0.1` 启用 **CORS**（`tower_http::cors`），可直接从 Vite 页面请求 `http://127.0.0.1:端口`。  
3. **角色目录**：填写 `roles/{角色id}/` 的绝对路径，或先使用 **「写入文件夹」** 成功一次，编写器会记住 **roles 根** 并与当前 manifest 的 **`id`** 拼成默认路径。  
4. 可选 **自动启动**：在试聊页填写 `oclivenewnew` 可执行文件路径，由 Tauri 侧 **`spawn_oclive_api`** 拉起子进程（端口与主机名与 API 地址栏一致）。首次对某一可执行路径会弹出确认（用户同意后记住）；若该端口已有 TCP 监听，会先尝试 **「检测 API」**：已通过则提示无需重复启动；未通过则提示端口被占用。  
5. **输入**：**Enter** 发送，**Shift+Enter** 换行。**新会话** 会生成新的 `session_id` 并写入请求体；oclivenewnew 以 `{角色id}__sess__{sanitized}` 作为 SQLite 会话命名空间，与主窗口无 `session_id` 的对话隔离。编写器按「API 根 + 角色目录」在 `localStorage` 分桶持久化 `session_id`。响应 JSON 含 `reply` 与回显的 `session_id`。  
6. **错误提示**：当运行时返回结构化错误时，编写器会展示如 `[invalid_role_path] role_path 不是目录（建议：...）`，便于用户自助排障与开发者 issue 归类。

## 源码布局（简要）

| 路径 | 说明 |
|------|------|
| `src/composables/usePackEditor.ts` | 编辑区状态、持久化、导入/导出、校验与简单表单同步 |
| `src/components/pack/` | 检查区、简单/高级创作面板、试聊、情绪图控件 |
| `src/lib/` | zip/文件夹导出、`importPack`、契约校验、`simpleCreation`、`exportPrepare`、`knowledgeFiles` / `knowledgeFrontMatter` / `knowledgeHitPreview`（知识路径、front matter、命中预览）等 |
| `scripts/wasm-pack-build.mjs` | `npm run wasm:build`：调用 wasm-pack 并支持环境变量覆盖路径 |
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

- **默认**：与 `oclivenewnew` 共享 crate **`oclive_validation`** 的 TypeScript 侧检查；若已执行 **`npm run wasm:build`**，则「运行全部检查」优先调用 wasm 中的 **`validateManifestWasm`**（与 Rust **`validate_disk_manifest`** 同源）。  
- **权威校验**仍以运行时 **`load_role`** 为准。路线图见 **`creator-docs/role-pack/EDITOR_VALIDATION_ROADMAP.md`**（两仓库不合并，仅共享校验 crate）。

## 许可证

MIT，见本仓库根目录 `LICENSE`。
