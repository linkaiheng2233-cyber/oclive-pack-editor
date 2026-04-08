# Changelog

本文件随 **Git 标签 / Release** 更新；维护者发版步骤见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 0.2.0

### 编写与导出

- **简单创作**：`manifest` / `settings` 支持 **`knowledge.enabled`** 与 **`knowledge.glob`**（与运行时合并语义一致，settings 优先）；`min_runtime_version` 等字段保持与 README 描述一致。
- **合并前检查**：[CONTRIBUTING.md](./CONTRIBUTING.md) 中的「合并前审查要点」；`usePackEditor` 使用 `simpleKnowledgeForSettings` 统一写入 settings 侧 `knowledge`。

### 契约与校验

- **`npm run contract:json-keys`**：对比 `jsonKeys.ts` 与 oclivenewnew `json_keys.rs`。
- **`HOST_RUNTIME_VERSION`**（`src/lib/hostRuntimeVersion.ts`）与 oclivenewnew `Cargo.toml` 版本对齐（当前 **0.2.0**）。

### 其它

- 试聊、E2E smoke、CI（含 wasm 构建）等与 [README.md](./README.md) 一致。
