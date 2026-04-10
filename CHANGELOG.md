# Changelog

本文件随 **Git 标签 / Release** 更新；维护者发版步骤见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## [Unreleased]

- **脚本**：新增 **`npm run check`**（`build` + `vitest` + **`contract:json-keys`**），与主仓发版前自检习惯对齐。
- **界面**：全局 **暖色主题**（象牙/卡其，与 oclive-launcher 日间 token 对齐）；根字号公式与 **界面缩放** 行为保持不变。
- **试聊 HTTP**：`runtimeApi` 的 `RuntimeChatMeta` 识别 oclive `--api` 回包 **`personality_source`**（`vector` | `profile`）；试聊消息条展示 **人格·七维 / 人格·档案** 芯片（有该字段时）。
- **简单创作 / 契约文案**：`evolution.personality_source`、**`max_change_per_event`** 与 UI 提示对齐 oclivenewnew **性格档案**设计轴心（核心/可变档案、七维视图）；README、CHANGELOG 同步。
- **文档**：README「与运行时的关系」补充 **`creator_message.txt`** 与启动器职责链接；补充 **性格档案**与 oclivenewnew `personality-archive-notes.md`、`design-axis-evolution.md` 链接；CONTRIBUTING **跨仓约定**（文件名与 oclive-launcher 同步）。

## 0.2.0

### 编写与导出

- **简单创作**：`manifest` / `settings` 支持 **`knowledge.enabled`** 与 **`knowledge.glob`**（与运行时合并语义一致，settings 优先）；`min_runtime_version` 等字段保持与 README 描述一致。
- **合并前检查**：[CONTRIBUTING.md](./CONTRIBUTING.md) 中的「合并前审查要点」；`usePackEditor` 使用 `simpleKnowledgeForSettings` 统一写入 settings 侧 `knowledge`。

### 契约与校验

- **`npm run contract:json-keys`**：对比 `jsonKeys.ts` 与 oclivenewnew `json_keys.rs`。
- **`HOST_RUNTIME_VERSION`**（`src/lib/hostRuntimeVersion.ts`）与 oclivenewnew `Cargo.toml` 版本对齐（当前 **0.2.0**）。

### 其它

- **简单创作性能**：表单变更写入 JSON 使用约 **220ms 防抖**，减轻长文输入卡顿；切换到「检查 / 试聊」、导出或运行检查前会**立即同步**，避免未落盘表单。
- 试聊、E2E smoke、CI（含 wasm 构建）等与 [README.md](./README.md) 一致。
