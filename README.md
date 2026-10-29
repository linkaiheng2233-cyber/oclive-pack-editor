# A.I.Live 角色包编写器

**把人设、立绘、场景与知识整理成可以交给 OCLive Host 使用的角色包。**

A visual role-pack editor for A.I.Live / OCLive, with supported character-card import, validation and export.

[公开内测发布](https://github.com/linkaiheng2233-cyber/oclive-pack-editor/releases/tag/v0.5.0) · [使用与格式说明](creator-docs/ROLE_PACK_EDITOR.md) · [变更记录](CHANGELOG.md)

本仓独立提供 Vue / TypeScript 前端和 Tauri 桌面壳。当前公开版本为 **0.5.0 内测版**；源码、已上传安装包与本地后续开发分别维护，具体文件以 Release 附件为准。

## 你可以做什么

- 用**简单创作**填写人设、立绘、世界观和常用设置；需要时进入按文件组织的高级创作。
- 按支持范围导入、转换外部 Character Card，并查看转换报告，复核不能等价映射的内容。
- 校验并导出 `.ocpak` / `.zip`，或写入自己选择的角色包目录。

编写器负责角色内容；实际对话、记忆与最终加载由 [A.I.Live 运行时](https://github.com/linkaiheng2233-cyber/oclivenewnew)负责。导出成功不代表模型表现或所有目标 Host 已验收。

## 第一次使用

1. 从[发布页](https://github.com/linkaiheng2233-cyber/oclive-pack-editor/releases/tag/v0.5.0)获取适合平台的公开内测附件，或按下文从源码启动。
2. 新建角色包或导入支持的角色卡，填写内容并检查立绘、身份与转换报告。
3. 导出包，在运行时按[创作者流程](https://github.com/linkaiheng2233-cyber/oclivenewnew/blob/main/creator-docs/getting-started/CREATOR_WORKFLOW.md)导入或放入角色包根目录。
4. 在目标 Host 中实际运行、测试和调整。

## 从源码启动

```bash
git clone https://github.com/linkaiheng2233-cyber/oclive-pack-editor.git
cd oclive-pack-editor
npm ci
npm run dev:browser
```

桌面开发需另行准备 Rust 与 Tauri 平台依赖，然后使用 `npm run tauri:dev`。浏览器和桌面模式的本地文件访问能力不同，详见[编写器说明](creator-docs/ROLE_PACK_EDITOR.md)。

## 开发与契约

```bash
npm run check
```

本地构建、WASM 校验和契约对照要求见 [CONTRIBUTING.md](CONTRIBUTING.md)。角色包语义由主仓的[格式规范](https://github.com/linkaiheng2233-cyber/oclivenewnew/blob/main/creator-docs/role-pack/ROLE_PACK_SPEC.md)与[内容边界](https://github.com/linkaiheng2233-cyber/oclivenewnew/blob/main/handoff/ROLE_PACK_BOUNDARY.md)维护，本页不复制另一套字段规范。

## 反馈与许可

欢迎提交 [Issue](https://github.com/linkaiheng2233-cyber/oclive-pack-editor/issues)。复现问题时请注明版本、操作步骤和输入格式，不要上传私人角色资料或密钥。

软件许可见 [LICENSE](LICENSE)。角色素材、转换来源与外部模型的许可分别核对。


<!-- Preserve previously published section bookmarks. -->
<a id="与-ailive-主应用的关系"></a>
<a id="与运行时的关系"></a>
<a id="与插件市场--模块条目--profile特征码的边界"></a>
<a id="新用户编写器--运行时推荐"></a>
<a id="离线范围"></a>
<a id="环境依赖"></a>
<a id="创作模式"></a>
<a id="使用"></a>
<a id="桌面版tauri"></a>
<a id="与-oclivenewnew-联调简要"></a>
<a id="脚本"></a>
<a id="源码布局简要"></a>
<a id="实现要点维护者"></a>
<a id="发布--联调前自检"></a>
<a id="ci"></a>
<a id="校验策略"></a>
<a id="许可证"></a>

旧版章节书签保留在此。[整理前的首页](https://github.com/linkaiheng2233-cyber/oclive-pack-editor/blob/20f3eb26ff98214ce74a2234f7f1b6181b41de77/README.md)可用于查阅历史说明；现行入口以本页与所链文档为准。
