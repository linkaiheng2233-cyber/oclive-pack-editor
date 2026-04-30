export default {
  common: {
    language: "语言",
    system: "跟随系统",
    zhCN: "中文",
    enUS: "English",
  },
  helpHint: {
    ariaLabel: "查看说明",
  },
  simpleCreation: {
    syncWarning: "简单表单未与 JSON 完全同步：{detail}",
    base: {
      title: "基础：核心档案与情绪图",
      desc:
        "这一页用大白话填表，保存后就会写进包里：核心性格档案（包内长文）决定 AI 怎么演，情绪图决定立绘用哪些文件（文件名要和 oclive 约定一致，如 happy.png），运行时读 core_personality.txt 与 assets/images/。",
      corePersonalityLabel: "核心性格档案（长文）",
      faqTitle: "常见问题 · 基础区（核心档案、立绘、寄语）",
    },
    creatorMessage: {
      title: "创作者公告（可选，仅在此编写）",
      desc:
        "下载包的用户只在启动器里只读查看；对话里的 AI 不读这份文件。导出为 creator_message.txt，每行最多 160 字。",
      modeAria: "创作者公告导出方式",
      modes: {
        unified: "整包一句",
        perModule: "按行多条（每行对应一个模块/来源，多模块拼接时启动器会逐条列出）",
      },
      bodyLabelUnified: "给后来者的一句话",
      bodyLabelPerModule: "每行一条（可多条）",
      placeholders: {
        unified: "例如：别怕改设定，第三次导出就顺了。",
        perModule: "第一行：场景模块作者留话\n第二行：核心档案模块…\n（空行会被忽略）",
      },
    },
    advanced: {
      foldTitle: "进阶：场景、用户身份、世界观、角色受影响程度等",
    },
    manifest: {
      title: "角色信息（manifest）",
      roleIdLabel: "角色 ID（文件夹名）",
      displayNameLabel: "显示名称",
      versionLabel: "版本",
      authorLabel: "作者",
      descriptionLabel: "简介",
      minRuntimeLabel: "最低 oclive 版本（可选）",
      minRuntimePlaceholder: "semver，如 0.2.0；与编写器 HOST_RUNTIME_VERSION / 运行时对齐，留空则不限制",
      scenesLabel: "场景 ID（英文逗号分隔）",
      personalityVectorTitle: "性格七维（0～1）",
      personalityVectorProfileHint:
        "当前为「档案」人格来源：七维在运行时多为从正文归纳的视图；下方数字仍会写入包内作默认与参考。",
      userRelationTitle: "用户身份（简单模式仅保留一个）",
      multiRelationWarning:
        "当前包内有多个身份键，简单创作保存时会合并为下方这一套；保留多身份请改用高级创作。",
      relationKeyLabel: "身份键（如 friend）",
      relationDisplayNameLabel: "对外称呼说明",
      relationPromptHintLabel: "语气与关系提示",
      relationInitialFavorabilityLabel: "初始好感（0～100）",
      relationFavorMultiplierLabel: "好感倍率",
      worldviewLabel: "世界观（Markdown，写入 knowledge/world.md）",
      worldviewPlaceholder: "可选。有内容时会生成 world.md；留空则使用占位说明。",
      knowledgeTitle: "知识库检索（manifest / settings）",
      knowledgeLead:
        "与运行时 knowledge 块一致；导出时写入 manifest.json 与 settings.json（合并加载时 settings 优先）。glob 须以 knowledge/ 开头。",
      knowledgeEnabledLabel: "启用知识库 Markdown 检索",
      knowledgeGlobLabel: "glob 模式",
      faqTitle: "常见问题 · 角色信息（manifest）",
    },
    directoryPlugins: {
      scanning: "正在扫描插件目录…",
      noneGlobalHint:
        "未检测到目录插件。可将插件放入本应用数据目录下的 plugins/、环境变量 PLUGINS_GLOBAL_PATH 指向的目录，或工作目录的 plugins/；导出角色包后也会扫描与 roles 同级的 plugins/。",
      globalListingHint:
        "当前正列出全局 plugins/；在「检查与导出」写入文件夹后，将优先扫描与 roles 同级的 plugins/。",
      noneGlobalHintShort:
        "未检测到目录插件。可将插件放入应用数据 plugins/、PLUGINS_GLOBAL_PATH 或工作目录 plugins/；导出后亦会扫描与 roles 同级的 plugins/。",
      globalListingHintShort:
        "当前列出全局 plugins/；导出到含 roles 的目录后将改为扫描同级 plugins/。",
    },
    settings: {
      title: "引擎设置（settings）",
      brain: {
        title: "对话推理（大脑）",
        lead:
          "与 oclive-launcher「对话推理」一致：包内声明 plugin_backends.llm；本机走 Ollama，云端需在启动 oclive 时配置 OCLIVE_REMOTE_LLM_URL（启动器里填 URL）。",
        modeLabel: "推理方式",
        modes: {
          ollama: "本机 Ollama",
          remote: "云端 Remote LLM（HTTP JSON-RPC）",
          directory: "目录插件（JSON-RPC）",
        },
        ollamaModelLabel: "Ollama 模型名（model）",
        remoteNote:
          "导出包将包含 \"llm\": \"remote\"。请使用启动器选择「云端 Remote LLM」并填写侧车地址；协议见 oclivenewnew REMOTE_PLUGIN_PROTOCOL.md。",
        modelNoteLabel: "模型名备注（可选，写入 model）",
        modelNotePlaceholder: "可选，如文档说明用",
        directoryPluginIdLabel: "目录插件 ID（plugin_backends.directory_plugins.llm）",
        pickManifestId: "请选择 manifest id",
        modelNotePlaceholderShort: "可选",
      },
      schemaVersionLabel: "schema 版本",
      eventImpactFactorLabel: "事件影响系数（角色受影响程度）",
      personalitySourceLabel: "人格来源（personality_source）",
      personalitySource: {
        vector: "经典（vector）：七维增量为主",
        profile: "档案（profile）：核心长文 + 运行时可变档案",
      },
      remotePresenceDefaultEnabled: "异地心声默认开启（建议）",
      otherBackends: {
        title: "其他插件后端（memory / emotion / event / prompt）",
        desc: "主对话 LLM 已在上方「对话推理」中选择；此处为记忆、情绪、事件、Prompt 四类后端。",
        directoryPluginIdLabel: "目录插件 ID",
        pickManifestId: "请选择 manifest id",
      },
      faqTitle: "常见问题 · 引擎设置（settings）",
    },
    slots: {
      chatToolbar: "聊天工具栏",
      settingsPanel: "设置扩展",
      roleDetail: "角色详情扩展",
      sidebar: "侧边栏扩展",
      chatHeader: "聊天页顶部",
      settingsPlugins: "插件管理页",
      settingsAdvanced: "设置 · 常规扩展",
      overlayFloating: "全局浮层",
      launcherPalette: "启动器 / 快捷键浮层",
      debugDock: "调试面板扩展",
    },
  },
  packEditor: {
    aria: {
      nav: "功能导航",
    },
    header: {
      kicker: "oclive · 角色包编写器",
      toolsAria: "外观与语言",
      scaleAria: "界面大小",
      shrink: "缩小",
      shrinkAria: "缩小界面",
      enlarge: "放大",
      enlargeAria: "放大界面",
      relativeScaleTitle: "相对默认字号：{label}",
      themeTitle: "主题：{label}（点击切换）",
    },
    nav: {
      start: "开始",
      simple: "简单",
      advanced: "高级",
      check: "检查",
      chat: "试聊",
      feedback: "反馈",
    },
    titles: {
      start: "开始",
      simple: "简单创作",
      advanced: "高级创作",
      check: "检查与导出",
      chat: "试聊",
      feedback: "反馈工作台",
    },
  },
};

