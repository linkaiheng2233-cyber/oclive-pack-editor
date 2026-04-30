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

