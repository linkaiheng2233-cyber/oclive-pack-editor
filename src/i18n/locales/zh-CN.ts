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

