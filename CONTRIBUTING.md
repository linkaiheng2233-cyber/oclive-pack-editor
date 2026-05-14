# 参与贡献与发版说明

感谢关注 **oclive-pack-editor**。本仓库为独立 **角色包编写器**（Vite + Vue + TypeScript + 可选 Tauri 1.x 桌面壳），与 **oclivenewnew** 运行时通过磁盘上的角色包契约协作，无运行时源码嵌套。

## 日常开发

- 环境：**Node.js**（建议 LTS）、**Rust**（桌面壳与 `wasm-pack` 构建）、Windows 上 **WebView2**。
- 安装依赖：`npm ci` 或 `npm install`。
- 开发：`npm run tauri:dev`（桌面）或 `npm run dev:browser`（浏览器）；详见 [README.md](README.md)。
- 自检：`npm test`、`npm run build`；若改动桌面壳：`npm run cargo:build` 或 `npm run tauri:build`（与 CI 一致）。**`src-tauri` 依赖 `oclive_validation` 路径 `../../oclivenewnew/crates/oclive_validation`**，请在本编写器**上一级目录**克隆 **oclivenewnew**（与 CI `cd .. && git clone …` 布局一致），否则 `cargo build` 会报找不到 crate。

合并前请保证前端构建与单测通过；若改动导出或 Tauri 命令，建议在目标平台上实际跑一遍「导入 / 导出 / 写入文件夹」。**CI** 在 **Ubuntu 与 Windows** 上会各跑一遍 **Playwright 冒烟**（`npm run test:e2e`，需先同 job 内 `npm run build`）。

## 跨仓约定：随包寄语文件名

包内随包寄语默认为 **`creator_message.txt`**（与 **oclive-launcher** 的 `ROLE_PACK_CREATOR_MESSAGE_FILENAME` / `role_creator_message.rs` 同名）。若改名须同步三处；展示与 **`launcherEchoRoleId`** 由启动器负责，**oclivenewnew 不读此文件**。详见 [oclive-launcher README — 随包寄语与职责边界](https://github.com/linkaiheng2233-cyber/oclive-launcher/blob/main/README.md#随包寄语与职责边界)。

## 发版检查清单（维护者）

在创建 **GitHub Release** 或对外分发安装包前，建议按顺序确认：

1. **版本号**  
   - `package.json` 的 `version` 与 `src-tauri/tauri.conf.json` 里 `package.version`（及展示文案若引用）一致。  
   - **Tauri**：`@tauri-apps/cli` / `@tauri-apps/api` 与 `src-tauri/Cargo.toml` 中 `tauri` 依赖保持项目约定的一致范围（见既有 `package.json`）。

2. **与 oclive 运行时版本对齐（必做）**  
   - `src/lib/hostRuntimeVersion.ts` 中的 **`HOST_RUNTIME_VERSION`** 必须与 **oclivenewnew** 仓库 **`src-tauri/Cargo.toml`** 顶层的 **`[package] version`** 一致。  
   - 每次 **bump oclive（oclivenewnew）发版** 时，在编写器侧同步更新 **`HOST_RUNTIME_VERSION`**，并跑一遍「运行全部检查」与导出前校验（含 `manifest.min_runtime_version` 语义）。

3. **JSON 顶层键白名单（发版或 bump 上游后建议跑）**  
   - 运行 `npm run contract:json-keys`：对比 `src/lib/jsonKeys.ts` 与 oclivenewnew **`crates/oclive_validation/src/json_keys.rs`**（默认读取相邻克隆路径 `../oclivenewnew/...`，可用环境变量覆盖，见脚本内说明）。  
   - 若上游新增或重命名键，请同步更新 `jsonKeys.ts`、相关校验测试，并视需要更新 README。

4. **Wasm 校验（与 CI 一致）**  
   - CI 会浅克隆 **oclivenewnew** 并执行 **`npm run wasm:build`**（需 **`wasm32-unknown-unknown`** 与 **wasm-pack**）。本地发版前若依赖 wasm 路径的「运行全部检查」，请先在同一环境执行 **`npm run wasm:build`**，再 **`npm test`**。  
   - 未构建 wasm 时编写器会回退到 TypeScript 校验；占位说明见 [README.md](README.md) 脚本表。

5. **CHANGELOG**  
   - 更新根目录 [CHANGELOG.md](./CHANGELOG.md) 对应版本小节（可与 tag 同步）。

6. **Release 资产**  
   - 推送 **`v*`** 标签（如 `v0.2.0`）会触发 [.github/workflows/release.yml](./.github/workflows/release.yml)，在 Windows 上执行 **`npm run tauri:build`** 并上传 **`bundle/`** 为 Artifact（亦可于 Actions 里 **手动运行** 该 workflow）。  
   - 另可将构建产物手动上传到 GitHub **Releases**；资产命名可与 README 或仓库惯例对齐（如带平台与版本前缀）。

7. **冒烟**  
   - 在干净或接近用户环境的机器上：安装或解压 → 打开编写器 → 简单创作 / 导出 zip → 放入 oclive **roles 根** 并加载（见 README「与 oclivenewnew 联调」）。

## 合并前审查要点（代码）

提交 PR 或合并前建议快速对照：

- **简单创作**：`simpleCreation.ts` 与 `usePackEditor.ts` 中 manifest/settings 同步逻辑一致；`knowledge` 块在两侧写入且与 `knowledgeFromPackRecords`（settings 优先）一致。  
- **校验**：改动 `jsonKeys` / 校验路径时运行 `npm test` 与 `npm run contract:json-keys`（需相邻 `oclivenewnew` 克隆或设置脚本中的路径变量）。  
- **类型与导出**：`exportPrepare` / `exportPack` 若涉及新文件类型，补 Vitest 覆盖。  
- **试聊**：若动到 `runtimeApi` / `ChatPanel`，确认本机 oclive `--api` 仍可连（见 README）。

## 相关文档

- [README.md](README.md)：功能、命令、试聊、CI、校验策略。  
- oclivenewnew **`creator-docs/role-pack/PACK_VERSIONING.md`**：版本与包字段契约。
