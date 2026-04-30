export default {
  common: {
    language: "Language",
    system: "System",
    zhCN: "中文",
    enUS: "English",
  },
  helpHint: {
    ariaLabel: "View help",
  },
  simpleCreation: {
    syncWarning: "Simple form is not fully synced with JSON: {detail}",
    base: {
      title: "Base: core profile & emotion assets",
      desc:
        "Use plain language to fill the form. When you save, it writes into the pack: the core personality text determines how the AI behaves, and emotion assets decide which images are used (filenames must match oclive conventions, e.g. happy.png). Runtime reads core_personality.txt and assets/images/.",
      corePersonalityLabel: "Core personality (long text)",
      faqTitle: "FAQ · Base (core profile, assets, creator message)",
    },
    creatorMessage: {
      title: "Creator message (optional; edit here only)",
      desc:
        "Users read it in the launcher (read-only). The chat AI does not read it. Exported as creator_message.txt, max 160 chars per line.",
      modeAria: "Creator message export mode",
      modes: {
        unified: "One line for the whole pack",
        perModule:
          "Multiple lines (each line for one module/source; when combined, the launcher lists them line by line)",
      },
      bodyLabelUnified: "One sentence for future users",
      bodyLabelPerModule: "One line each (multiple lines allowed)",
      placeholders: {
        unified: "e.g. Don’t be afraid to iterate. The third export will feel smooth.",
        perModule:
          "Line 1: message from the scenes module author\nLine 2: core profile module…\n(blank lines will be ignored)",
      },
    },
    advanced: {
      foldTitle: "Advanced: scenes, user identity, worldview, impact strength, etc.",
    },
    manifest: {
      title: "Role info (manifest)",
      roleIdLabel: "Role ID (folder name)",
      displayNameLabel: "Display name",
      versionLabel: "Version",
      authorLabel: "Author",
      descriptionLabel: "Description",
      minRuntimeLabel: "Minimum oclive version (optional)",
      minRuntimePlaceholder:
        "semver, e.g. 0.2.0; align with HOST_RUNTIME_VERSION / runtime. Empty = no limit.",
    },
    slots: {
      chatToolbar: "Chat toolbar",
      settingsPanel: "Settings extension",
      roleDetail: "Role detail extension",
      sidebar: "Sidebar extension",
      chatHeader: "Chat header",
      settingsPlugins: "Plugin manager page",
      settingsAdvanced: "Settings · general extension",
      overlayFloating: "Global overlay",
      launcherPalette: "Launcher / hotkey palette",
      debugDock: "Debug panel extension",
    },
  },
  packEditor: {
    aria: {
      nav: "Feature navigation",
    },
    header: {
      kicker: "oclive · Role Pack Editor",
      toolsAria: "Appearance and language",
      scaleAria: "UI scale",
      shrink: "Shrink",
      shrinkAria: "Shrink UI",
      enlarge: "Enlarge",
      enlargeAria: "Enlarge UI",
      relativeScaleTitle: "Relative to default font size: {label}",
      themeTitle: "Theme: {label} (click to switch)",
    },
    nav: {
      start: "Start",
      simple: "Simple",
      advanced: "Advanced",
      check: "Checks",
      chat: "Chat",
      feedback: "Feedback",
    },
    titles: {
      start: "Start",
      simple: "Simple creation",
      advanced: "Advanced creation",
      check: "Checks & export",
      chat: "Try chat",
      feedback: "Feedback workspace",
    },
  },
};

