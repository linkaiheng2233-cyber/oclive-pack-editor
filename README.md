# oclive-pack-editor

独立 **角色包编写器**（Vite + Vue 3 + TypeScript + **Tauri 2** 桌面壳）：面向创作者的 **简单创作** 流程（人设、立绘、世界观 → 导出 `.ocpak` / 写入 `roles/`），并保留 **高级创作**（manifest / settings / 场景 JSON 等）。产物与 **oclivenewnew** 运行时兼容；**不包含**对话引擎源码。

[![CI](https://github.com/linkaiheng2233-cyber/oclive-pack-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/linkaiheng2233-cyber/oclive-pack-editor/actions/workflows/ci.yml)

**当前版本：0.5.0**（`package.json`、`src-tauri/tauri.conf.json`、`Cargo.toml` 已对齐）。

**贡献与发版**（本地命令、`HOST_RUNTIME_VERSION`、`wasm:build`、顶层键对比脚本）：见 [CONTRIBUTING.md](./CONTRIBUTING.md)。**变更记录**：[CHANGELOG.md](./CHANGELOG.md)。

## 与 A.I.Live 主应用的关系

| 能力 | 在哪做 |
|------|--------|
| 角色人设、只读 `memory_seed.json`、`user_identities/*.md` 身份模板、`meta` / `slot_registry`（六槽 + agent）、场景与知识 Markdown、情绪图、导出 zip / 写入 `roles/` | **本编写器** |
| **专家模型路由**（`blueprint/includes/expert_routing.json`）、架构图 **`groups`**、蓝图 **`includes[]`** 合并 | **A.I.Live（oclivenewnew）** → 插件与后端管理 → 架构图 |
| 对话、记忆持久化、`load_role` 最终校验 | **A.I.Live** |

**保存注意事项**：侧栏「角色包」保存时会更新编写器管理的 `meta` / slot 字段，同时保留未知 meta 字段、多实例 `slot_registry` 以及 `includes`、`groups`、`expert_overlay`、`runtime_config`（避免冲掉主应用写入的扩展字段）。v3 / dual-core 蓝图当前不进入编写器编辑流程；请在主应用完成配置后使用编写器之外的工具管理，避免误作 v2 导入。

**专家路由配置**：请在 **A.I.Live** 主应用配置（`blueprint/includes/expert_routing.json`）；本编写器不编辑该文件。详见 [creator-docs/ROLE_PACK_EDITOR.md](./creator-docs/ROLE_PACK_EDITOR.md)。

## 与运行时的关系

| 项目 | 说明 |
|------|------|
| **本仓库** | 产出 **`pipeline.ocblueprint`**（v2 SSOT）、`core_personality.txt`、可选只读 **`memory_seed.json`**、**`user_identities/*.md`**、**`knowledge/**/*.md`**（多文件世界观）、占位场景、`assets/images/` 情绪图等；可选 **`prompts/reply_quality_anchor.md`**、**`creator_message.txt`**（创作者公告；**oclivenewnew 运行时一般不读取**，仅部分归档工具展示） |
| **oclivenewnew** | 加载、校验与对话；契约原文在其仓库 **`creator-docs/`** 与 **`roles/README_MANIFEST.md`** |

## 与「插件市场 / 模块条目 / Profile（特征码）」的边界

编写器只负责**角色包内容**（v2 蓝图 / 知识 / 素材 / 导出），不负责插件市场与一键部署。

- **插件市场条目（`type: "plugin" | "module" | "profile"`）**：由 `oclivenewnew` 的「插件与后端管理」负责同步索引、安装依赖插件、权限确认与应用后端覆盖。
- **Profile（特征码/一键部署）**：属于运行时侧的「环境配置 + 依赖声明」能力；编写器不解析/不应用 Profile，只在角色包里提供 `plugin_backends` 等字段供运行时读取。

**性格档案**：本编写器编辑包内 **核心性格档案**（`core_personality.txt`）与 **`evolution`**（含 **`personality_source`**、`max_change_per_event`）。若选用 **`profile`**，运行时的 **可变性格档案**由 oclive 在数据库中维护，**不可**在包内手写；设计说明见 oclivenewnew **[personality-archive-notes.md](https://github.com/linkaiheng2233-cyber/oclivenewnew/blob/main/docs/personality-archive-notes.md)**，思路变化见 **[design-axis-evolution.md](https://github.com/linkaiheng2233-cyber/oclivenewnew/blob/main/docs/design-axis-evolution.md)**。

**版本对齐**：`src/lib/hostRuntimeVersion.ts` 中的 **`HOST_RUNTIME_VERSION`** 应与 **oclivenewnew** `distros/desktop-tauri/Cargo.toml` 的 **`version`** 一致；导出前校验会检查 **`meta.min_runtime_version`** 与 v2 蓝图契约（见 [PACK_VERSIONING.md](https://github.com/linkaiheng2233-cyber/oclivenewnew/blob/main/creator-docs/role-pack/PACK_VERSIONING.md)）。

**角色包编辑器**（桌面壳）：侧栏「角色包」可直接打开磁盘上的 v2 包目录，表单/JSON 双模式编辑、`validate_blueprint_v2_json` 校验、锚点预设；说明见 [creator-docs/ROLE_PACK_EDITOR.md](./creator-docs/ROLE_PACK_EDITOR.md)。

## 角色包反馈（半私密收件箱）

用户在 **oclivenewnew** 主程序里可以对正在使用的角色包提交 **「半私密反馈」**（本机保存，不公开）。  
创作者可在本编写器的 **试聊面板** 中点 **「查看反馈（半私密）」** 拉取并处理（标记已处理、写处理备注）。

反馈协议与字段说明见：  
- oclivenewnew 文档 **[ROLE_FEEDBACK_V1.md](https://github.com/linkaiheng2233-cyber/oclivenewnew/blob/main/creator-docs/role-pack/ROLE_FEEDBACK_V1.md)**

路径约定（Windows 示例）：与 `oclivenewnew` **同级**放置本仓库，例如 `D:\oclive-pack-editor` 与 `D:\oclivenewnew`。

## 新用户：编写器 + 运行时（推荐）

| 步骤 | 说明 |
|------|------|
| 1 | 安装 **Node.js**，按需安装 **Ollama**（试聊 / 完整运行时需要）。 |
| 2 | 同级克隆 **[oclivenewnew](https://github.com/linkaiheng2233-cyber/oclivenewnew)**（A.I.Live 运行时）与本 **编写器**。 |
| 3 | 在本编写器中编辑或导入角色包，**导出 .zip / .ocpak** 或 **「写入文件夹」**，使 **`{角色id}/pipeline.ocblueprint`** 位于 **roles 根** 下；主仓默认根为 `oclivenewnew/distros/chat-pro/roles/`，也可设置环境变量 **`OCLIVE_ROLES_DIR`** 指向其他根。 |
| 4 | 启动 **oclivenewnew**（`npm run tauri:dev` 或 Release），加载角色并对话；编写器内试聊见下文。 |
| 5 | （可选）在 **A.I.Live** 中配置专家路由与架构图分组，保存后回到编写器编辑人设时，扩展蓝图字段会被保留。 |

权威说明：**[CREATOR_WORKFLOW.md](https://github.com/linkaiheng2233-cyber/oclivenewnew/blob/main/creator-docs/getting-started/CREATOR_WORKFLOW.md)**。旧版 **oclive-launcher** 已退役，见 [启动器 README](https://github.com/linkaiheng2233-cyber/oclive-launcher/blob/main/README.md)（归档只读）。

界面风格参考 **Fluent Design**（与常见 Fluent 桌面工具如 **qfluentwidgets** 一脉：浅色页背景、卡片层次、主色强调按钮），在 `src/style.css` 中通过 CSS 变量统一，并支持系统深色偏好；日间为 **象牙/卡其暖色**，与 **oclive-launcher** 对齐以便跨应用习惯一致。

## 离线范围

- **核心能力**（编辑、运行全部检查、导出 zip、桌面版选择 **roles 根** 并写入完整目录树）**不依赖外网**；不内嵌 LLM 或对话引擎。
- **桌面壳**为 **Tauri 2**（与 oclivenewnew 同大版本线），权限通过 `src-tauri/capabilities/main.json` 收敛；本地完整打包需安装 **Rust** 与对应平台依赖（见下）。

## 环境依赖

| 用途 | 需要 |
|------|------|
| 前端开发 / 测试 | **Node.js 20+**、`npm ci` |
| 桌面开发与打包 | **Rust**（`rustup` stable）、**Tauri 2** 平台依赖 |
| Windows | **WebView2**（通常已随系统/Edge）、`tauri build` 需 **Visual Studio Build Tools**（MSVC、Windows SDK） |
| Linux（含 CI） | `libwebkit2gtk-4.1-dev`、`libsoup-3.0-dev`、`libgtk-3-dev`、`libayatana-appindicator3-dev`、`librsvg2-dev` 等（与 [Tauri 2 前置说明](https://v2.tauri.app/start/prerequisites/) 一致） |

## 创作模式

- **简单创作**
  - **基础**：**核心性格档案**长文（写入 `core_personality.txt`）与 **情绪图片**（导出至 `assets/images/`，文件名需与 oclive 情绪资源命名一致）。
  - **进阶**（可折叠）：场景、用户身份、**世界观**（`knowledge/world.md`）、**事件影响系数**、**人格来源**（`evolution.personality_source`）、**单轮可变档案步长**（`max_change_per_event`）等，对应 blueprint **meta** 与运行时视图字段。
  - **对话推理（大脑）**（进阶 · 引擎设置）：与 **oclive-launcher** 对齐，选择 **本机 Ollama**（填写 `model`）或 **云端 Remote LLM**（包内 `slot_registry` 中 llm 槽为 remote）；云端侧车 URL 在启动 oclive 时由启动器注入 `OCLIVE_REMOTE_LLM_URL`，协议见 oclivenewnew `REMOTE_PLUGIN_PROTOCOL.md`。记忆 / 情绪 / 事件 / Prompt 四类后端仍在同页「其他插件后端」中配置。
- **高级创作**：分标签编辑 **角色门面 / 运行时 JSON 视图**、**core_personality.txt**、只读初始记忆 **`memory_seed.json`**、用户身份模板 **`user_identities/*.md` + `index.json`**、**知识 Markdown（`knowledge/*.md`）**、**情绪图片列表**；适合插件字段、多身份与完整包结构。初始记忆只随包分发，不等同于运行时生成的长期/短期记忆。
- **世界观与知识文件（高级 · 世界观）**
  - 支持多个 **`knowledge/*.md`**；简单模式下的「世界观」仍与 **`knowledge/world.md`** 同步。
  - **Front matter 表单**：`id`、`tags`、`scenes`、`event_hints`、`weight`，无需手写 YAML；正文与元数据分离编辑。
  - **运行全部检查** 会附带知识级校验（例如路径、`id` 重复等），与 manifest/settings 结果合并展示。
  - **知识强调预览 / 调参助手**（仅编辑器内近似）：输入关键词可预览命中与原因、正文片段；可选「预览条件：场景」与严格场景开关；**临时权重滑杆**只影响预览排序，满意后再写入真实 `weight`。运行时召回以 oclivenewnew 为准，预览用于创作调参。
- **导入角色包**：支持 **`.zip` / `.ocpak`**，解析后回填上述内容，便于在已有包上修改或另存为新包。导入后会保留编写器不直接编辑的安全文件与蓝图扩展字段，避免再次导出时静默丢失。导入时会校验 zip 内路径：拒绝含 `..` / `.` 段的非法路径（防 zip-slip）；情绪图仅接受 `{roleId}/assets/images/` 下**单层**文件名（不接受子目录）。

**简单创作已覆盖（表单 → JSON）**：`manifest` 侧 `id` / `name` / `version` / `author` / `description` / `min_runtime_version`（可选）/ `scenes` / `default_personality` / 单槽 `user_relations` + `default_relation` / **`knowledge.enabled` 与 `knowledge.glob`**（与 `settings.knowledge` 同步写入，合并时 settings 优先）；`settings` 侧 `schema_version` / `model` / `evolution.event_impact_factor` / **`evolution.personality_source`** / **`evolution.max_change_per_event`**（`ai_analysis_interval`、`max_total_change` 等其余演化字段保留原 JSON）/ `identity_binding` / `interaction_mode` / `memory_config.scene_weight_multiplier`（`topic_weights` 等保留）/ `remote_presence.default_enabled` / `plugin_backends`。**仍须高级创作或手写 JSON 的典型项**：多身份并存、`life_trajectory` / `life_schedule`、`dev_only`、`autonomous_scene`、逐场景 `topic_weights` 精调等（见 oclivenewnew `PACK_VERSIONING.md`）。

编写器 **不包含**对话引擎本体；**试聊**页可连接本机已启动的 **oclivenewnew HTTP API**（`--api`，默认端口 `8420`），用与导出包一致的 `role_path` 做快速对话。导出后也可将角色目录放入运行时的 **roles 根** 下，由完整 oclive 进程加载测试。

## 使用

**Windows**：安装依赖后，双击 **`scripts/start.bat`** 会**先询问打开方式**（Tauri 桌面窗口 / 仅浏览器），不会同时打开两种界面。命令行可直接指定：`scripts/start.bat tauri`、`scripts/start.bat web`。

```bash
npm install
npm run tauri:dev    # 桌面窗口：Vite 在后台，不自动打开系统浏览器
npm run dev:browser  # 仅浏览器：Vite + 自动打开浏览器
npm run dev          # 仅启动 Vite（不自动开浏览器；供 Tauri 子进程或手动打开 http://localhost:5173）
```

1. 可选 **「运行全部检查」** 查看 v2 蓝图契约一致性。  
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

1. 在本编写器中导出 zip 并解压，或使用「写入文件夹」指向某一目录，使该目录作为 roles 根且其下出现 `{roleId}/pipeline.ocblueprint`。  
2. 将 **该 roles 根** 配置为 **`OCLIVE_ROLES_DIR`**。  
3. 在 oclivenewnew 中通过 **`load_role`** 加载；权威校验以运行时为准。

## 脚本

| 命令 | 作用 |
|------|------|
| `scripts/start.bat`（Windows） | 交互选 Tauri 或浏览器；`scripts/start.bat tauri` / `scripts/start.bat web` 跳过询问 |
| `npm run dev` | 仅起 Vite（无 `--open`；`tauri dev` 的前置命令与此相同，避免双开浏览器） |
| `npm run dev:browser` | 浏览器开发 + 自动打开 `localhost:5173` |
| `npm run build` | 生产构建（`dist/`，供 Tauri `distDir` 使用） |
| `npm test` | Vitest（**186** 项：导入/导出 roundtrip、记忆与身份模板、路径安全、v2 校验与包检查） |
| `npm run test:e2e` | Playwright 冒烟（需先 `npm run build`；首次可执行 `npm run test:e2e:install` 安装浏览器） |
| `npm run tauri:dev` | Tauri 开发窗口 |
| `npm run tauri:build` | Tauri 打包（安装包 / 可执行文件） |
| `npm run cargo:build` | 仅编译 `src-tauri`（不跑完整 `tauri build` 安装器） |
| `npm run wasm:build` | （可选）安装 [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/) 后，在**本仓库根目录**执行 `node scripts/wasm-pack-build.mjs`，默认将相邻 **`../oclivenewnew/kernel/crates/oclive_validation_wasm`** 输出到 `src/wasm/pkg/`。可用 **`OCLIVE_VALIDATION_WASM_CRATE`**、**`OCLIVE_VALIDATION_CRATE`**、**`OCLIVE_WASM_OUT`** 覆盖路径。未构建时保留占位 stub，回退 TypeScript 校验 |
| `npm run contract:json-keys` | 对比 `jsonKeys.ts` 与相邻克隆的 **oclivenewnew** `kernel/crates/oclive_validation/src/json_keys.rs` 顶层键；不一致时非零退出（见 [CONTRIBUTING.md](./CONTRIBUTING.md)） |

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
- **开发双开浏览器**：`beforeDevCommand` 使用 `npm run dev`（`vite` 无 `--open`）；需要自动打开浏览器时用 **`npm run dev:browser`** 或 **`scripts/start.bat`** 选「仅浏览器」。

## 发布 / 联调前自检

1. `npm ci`（或 `npm install`）  
2. `npm test` → `npm run build`  
3. 若需 E2E：`npm run test:e2e:install` 后 `npm run test:e2e`（仅验证静态页；日常改 UI 不必跑）  
4. 桌面壳：`npm run tauri:dev` 验证窗口与「写入文件夹」；发布安装包用 `npm run tauri:build`  

将导出得到的 `{roleId}/` 放入 oclive 的 **roles 根**，并设置 **`OCLIVE_ROLES_DIR`** 后在运行时侧验证（见上文「与 oclivenewnew 联调」）。

## CI

推送或 PR 至 `main` / `master` 时，GitHub Actions 会 **浅克隆 `oclivenewnew`** 并执行 **`npm run wasm:build`**（需 **`wasm32-unknown-unknown`** 与 **wasm-pack**），再 **`npm test`**、**`npm run build`**、**Playwright 冒烟**（`npm run test:e2e`，**Ubuntu 与 Windows 矩阵各跑一遍**）与 **`cargo build --manifest-path src-tauri/Cargo.toml`**（双系统 + Tauri；Linux 额外安装 WebKit 构建依赖）。也可在 Actions 中 **手动运行** 同一工作流。

## 校验策略

- **默认**：与 `oclivenewnew` 共享 crate **`oclive_validation`** 的 TypeScript 侧检查；若已执行 **`npm run wasm:build`**，则「运行全部检查」优先调用 wasm 中的 **`validateManifestWasm`**（与 Rust **`validate_disk_manifest`** 同源）。  
- **权威校验**仍以运行时 **`load_role`** 为准。路线图见 **`creator-docs/role-pack/EDITOR_VALIDATION_ROADMAP.md`**（两仓库不合并，仅共享校验 crate）。

## 许可证

MIT，见本仓库根目录 `LICENSE`。
