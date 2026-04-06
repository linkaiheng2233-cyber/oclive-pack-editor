# 编写器：Tauri 桌面版规划（离线 + 完整功能 + 角色包测试）

面向目标：**桌面小软件**、**可离线使用**、**功能完整**（按路线图分阶段）、**带角色包测试**。工程仅限本仓库 **`oclive-pack-editor`**，与 **`oclivenewnew`** 不混仓；对接仍靠磁盘上的角色包。

---

## 目标对照

| 目标 | 实施要点 |
|------|----------|
| 桌面小软件 | 使用 **Tauri 1.x**（与 oclivenewnew 对齐）将 Vue + Vite 包进本机窗口；`beforeDevCommand` / `beforeBuildCommand` 指向现有 `npm run dev` / `npm run build`，`distDir` 为 `dist/`。 |
| 离线 | 核心路径不依赖外网：编辑、校验、选 **roles 根** 写盘、打 zip；**不**默认使用 CDN 字体/脚本；**不**内嵌对话/LLM。 |
| 功能完整 | 在 oclivenewnew `creator-docs/roadmap/VISION_ROADMAP_MONTHLY.md` 第 2 月与契约文档约束下，manifest/settings、场景、知识等按里程碑逐项做 UI 与导出。 |
| 角色包测试 | 见下「三层」；与运行时对齐以 **`load_role`** 或未来 **CLI 校验** 为准。 |

---

## 「角色包测试」三层（建议）

1. **自动化单测（CI）**  
   Vitest：`exportPack`、`validation`、`packLayout`、`packChecks` 等——`npm test`。

2. **编写器内「包自检」（离线）**  
   **「运行全部检查」**：JSON 可解析、`validateEditorPack`、场景 id 与 `topic_weights` 键一致；可选 **导出前必须通过**（本地存储偏好）。

3. **与运行时校验对齐（中长期）**  
   可选子进程调用独立 **`oclive-validate-pack` CLI**（Rust crate 另发）。  
   **人工联调**：导出到目录 → 设 **`OCLIVE_ROLES_DIR`** → oclivenewnew **`load_role`**（见根 README）。

---

## 技术选型

- **Tauri**：**1.x**（本仓库 `src-tauri` 与 oclivenewnew 同大版本线，降低维护差异）。  
- **前端**：Vue 3 + Vite + TypeScript；`npm run build` → Tauri `distDir`。  
- **文件**：桌面主路径为 **Tauri dialog + `invoke` 写盘**（`buildRolePackFiles` 与浏览器/File System Access 共用同一套相对路径语义）。

---

## 环境依赖（实现与 CI）

- **Node.js**：`npm ci`、`npm test`、`npm run build`。  
- **Rust**：`cargo build --manifest-path src-tauri/Cargo.toml`（CI 与本地）。  
- **Linux CI**：安装 WebKitGTK / GTK 等与 [Tauri 1 Linux 依赖](https://v1.tauri.app/v1/guides/getting-started/prerequisites) 一致。  
- **Windows 本地打包**：WebView2、MSVC 工具链；详见根 **README.md**。

---

## 实施顺序（建议）

1. ✅ 在仓库根接入 Tauri（`beforeDevCommand` / `beforeBuildCommand`、Vite `dist`）。  
2. ✅ 离线「选 roles 根目录 → 写入 `{roleId}/**`」（IPC + `buildRolePackFiles`）。  
3. ✅ 「运行全部检查」面板 + 错误列表 + 可选导出前强制校验。  
4. ✅ 编写器 **CI**：`npm test` + `npm run build` + Playwright 冒烟 + `cargo build`（Linux + Tauri 系统库；`workflow_dispatch`；Rust 依赖缓存）。  
5. ✅ 根 `README` 与 **STANDALONE.md**：离线范围、`OCLIVE_ROLES_DIR`、Rust/Tauri 前置、源码布局、联调自检、简单/高级/导入/导出校验与 zip 安全导入说明。  
6. ✅ 前端结构：`usePackEditor` + `components/pack/`；`exportPrepare` 统一导出前置解析；`importPack` 路径校验与单测。

---

## 风险

- 本机需安装 **Rust** 才能 `tauri build`；README 已写明。  
- 「功能完整」宜按 checklist 分迭代，避免首版范围失控。

---

## Plan 模式

若使用 Cursor **Plan** 模式，可将本文件任务拆为可勾选项；**实现时仅改 `oclive-pack-editor`，不改 `oclivenewnew`**（除非契约文档需同步）。
