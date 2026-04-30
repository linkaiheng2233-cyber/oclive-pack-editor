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
      maxChangePerEventLabel: "单轮可变档案步长（max_change_per_event）",
      identityBindingLabel: "身份绑定",
      identityBinding: {
        perScene: "按场景（per_scene）",
        global: "全局（global）",
      },
      interactionModeLabel: "交互模式",
      interactionMode: {
        immersive: "沉浸（immersive）",
        pureChat: "纯聊（pure_chat）",
      },
      sceneWeightMultiplierLabel: "场景记忆权重倍率",
    },
    author: {
      title: "作者与建议（author.json）",
      desc:
        "可选：面向市场的简介、推荐插件列表；若勾选「导出时附带 suggested_ui」，将把下方「前端设计」当前表单一并写入 author.json（运行时优先于 ui.json 作为插件布局种子）。suggested_plugin_backends 为 JSON 片段，供用户一键应用为会话后端（不写 settings.json）。",
      oneLineSummaryLabel: "一句话简介",
      oneLineSummaryPlaceholder: "例：慢热型同桌，适合日常陪伴",
      detailMarkdownLabel: "详情（Markdown）",
      detailMarkdownPlaceholder: "可选：角色卖点、使用说明、推荐场景…",
      recommendedDirectoryPluginsLabel: "推荐目录插件",
      addRow: "添加一行",
      removeRow: "删除",
      row: {
        pluginIdPlaceholder: "插件 manifest id",
        versionRangePlaceholder: "版本范围（可选）",
        notePlaceholder: "备注",
      },
      includeSuggestedUi: "导出时在 author.json 附带当前「前端设计」为 suggested_ui",
      suggestedPluginBackendsLabel: "suggested_plugin_backends（JSON，可选）",
      suggestedPluginBackendsPlaceholder: '例：{ "memory": "builtin", "llm": "ollama", ... }',
    },
    ui: {
      title: "前端设计（ui.json）",
      desc:
        "定义主程序加载本包时的默认整壳与嵌入插槽布局；导出时写入包根目录 ui.json。用户可在 oclive 插件管理里覆盖；「重置为角色包推荐」可恢复。",
      shellLabel: "整壳界面",
      shellNone: "无（使用内置界面）",
      scanningGlobal: "正在扫描全局插件…",
      noShellPluginsHint:
        "未扫描到整壳插件（需 type: ocliveplugin 且含 shell）。请将插件放入应用数据或工作目录的 plugins/，或导出到含 plugins/ 的目录。",
      common: {
        defaultBuiltin: "默认（内置）",
        left: "左",
        right: "右",
        top: "上",
        bottom: "下",
      },
      theme: {
        primary: "主题 · 主色",
        background: "主题 · 背景",
        font: "主题 · 字体",
        fontSegoeAndYahei: "Segoe UI / 微软雅黑",
        fontMono: "等宽",
      },
      layout: {
        sidebar: "布局 · 侧栏位置",
        defaultLeft: "默认（左）",
        chatInput: "布局 · 输入框位置",
        defaultBottom: "默认（下）",
      },
      slotOrderAria: "{title} 插件顺序",
      slot: {
        defaultVisible: "默认可见",
        empty: "当前插槽无可用插件（请扫描到声明了对应插槽的目录插件）。",
      },
    },
    futureNotePrefix: "需要完整 JSON 或插件字段时，请切换到",
    futureNoteStrong: "高级创作",
    futureNoteSuffix: "直接编辑源码。",
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
  advancedCreation: {
    toolbar: {
      leadPrefix: "高级模式直接编辑文件内容；不懂可先点标题旁的",
      leadSuffix: "。",
      aria: "高级编辑分区",
    },
    tabs: {
      manifest: "角色契约",
      settings: "对话与插件",
      core: "核心档案与寄语",
      coreFile: "core / 公告",
      world: "世界观与知识",
      images: "情绪立绘",
    },
    docks: {
      badges: {
        keypoints: "重点",
        faq: "问答",
      },
      eachItemTitle: "每一项：含义与创作者可改范围",
      scopeStrong: "可改范围：",
    },
    sections: {
      manifest: {
        title: "角色契约（manifest）",
        lead: "管「是谁、叫什么、有哪些场景、和用户关系」等，相当于角色的门面信息。",
        keyMapSummary: "下面这段 JSON，一般在改哪些名字？",
        docks: {
          keypointsAria: "manifest 字段说明",
          keypointsTitle: "manifest · 字段说明与可改范围",
          keypointsNotePrefix: "对照上方 JSON 逐处修改；",
          keypointsNoteStrong: "不要用下方代码块整段替换整个文件",
          keypointsNoteSuffix: "。",
          faqAria: "manifest 常见问题",
          faqTitle: "常见问题 · manifest（改进前 / 改进后对照）",
        },
      },
      settings: {
        title: "对话与插件（settings）",
        lead: "管「用哪个模型、记忆/情绪走哪条插件」等，和 manifest 分工不同。",
        keyMapSummary: "下面这段 JSON，常见要动的键",
        docks: {
          keypointsAria: "settings 字段说明",
          keypointsTitle: "settings · 字段说明与可改范围",
          keypointsNotePrefix: "只改需要的字段；",
          keypointsNoteStrong: "大括号、逗号要与 JSON 结构一致",
          keypointsNoteSuffix: "，不确定时先备份。",
          faqAria: "settings 常见问题",
          faqTitle: "常见问题 · settings（改进前 / 改进后对照）",
        },
      },
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

