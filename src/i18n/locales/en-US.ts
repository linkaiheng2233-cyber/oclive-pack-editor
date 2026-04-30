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
      scenesLabel: "Scene IDs (comma-separated)",
      personalityVectorTitle: "Personality vector (0–1)",
      personalityVectorProfileHint:
        "Current personality source is “profile”. In runtime, the vector is often a derived view summarized from texts. The numbers below are still written into the pack as defaults and references.",
      userRelationTitle: "User relation (simple mode keeps one only)",
      multiRelationWarning:
        "This pack currently contains multiple relation keys. When saved in simple mode, they will be merged into the single set below. Use advanced creation to keep multiple relations.",
      relationKeyLabel: "Relation key (e.g. friend)",
      relationDisplayNameLabel: "Public label / naming",
      relationPromptHintLabel: "Tone & relation hint",
      relationInitialFavorabilityLabel: "Initial favorability (0–100)",
      relationFavorMultiplierLabel: "Favorability multiplier",
      worldviewLabel: "Worldview (Markdown; writes to knowledge/world.md)",
      worldviewPlaceholder:
        "Optional. If filled, world.md will be generated; if empty, a placeholder will be used.",
      knowledgeTitle: "Knowledge retrieval (manifest / settings)",
      knowledgeLead:
        "Matches the runtime “knowledge” block. Export writes into manifest.json and settings.json (when merged, settings wins). glob must start with knowledge/.",
      knowledgeEnabledLabel: "Enable Markdown knowledge retrieval",
      knowledgeGlobLabel: "glob pattern",
      faqTitle: "FAQ · Role info (manifest)",
    },
    directoryPlugins: {
      scanning: "Scanning plugin directory…",
      noneGlobalHint:
        "No directory plugins detected. Put plugins into the app data plugins/ folder, a folder pointed by PLUGINS_GLOBAL_PATH, or the working directory plugins/ folder. After exporting the role pack, we also scan plugins/ next to roles/.",
      globalListingHint:
        "Currently listing global plugins/. After exporting (write to folder) in “Checks & export”, scanning will prefer plugins/ next to roles/.",
      noneGlobalHintShort:
        "No directory plugins detected. Put plugins into plugins/ (app data / PLUGINS_GLOBAL_PATH / working directory). After export, plugins/ next to roles/ is also scanned.",
      globalListingHintShort:
        "Currently listing global plugins/. After exporting into a folder containing roles/, scanning will switch to sibling plugins/.",
    },
    settings: {
      title: "Engine settings (settings)",
      brain: {
        title: "Chat inference (brain)",
        lead:
          "Matches the launcher “Chat inference”: declares plugin_backends.llm in the pack. Local uses Ollama; remote requires OCLIVE_REMOTE_LLM_URL when launching oclive (fill URL in the launcher).",
        modeLabel: "Inference mode",
        modes: {
          ollama: "Local Ollama",
          remote: "Remote LLM (HTTP JSON-RPC)",
          directory: "Directory plugin (JSON-RPC)",
        },
        ollamaModelLabel: "Ollama model name (model)",
        remoteNote:
          'Exported pack will include "llm": "remote". Use the launcher to select Remote LLM and fill the sidecar URL. Protocol: oclivenewnew REMOTE_PLUGIN_PROTOCOL.md.',
        modelNoteLabel: "Model note (optional; writes to model)",
        modelNotePlaceholder: "Optional, e.g. for documentation",
        directoryPluginIdLabel: "Directory plugin ID (plugin_backends.directory_plugins.llm)",
        pickManifestId: "Pick a manifest id",
        modelNotePlaceholderShort: "Optional",
      },
      schemaVersionLabel: "Schema version",
      eventImpactFactorLabel: "Event impact factor (how strongly the role is affected)",
      personalitySourceLabel: "Personality source (personality_source)",
      personalitySource: {
        vector: "Vector (classic): mainly personality-vector deltas",
        profile: "Profile: core long text + runtime mutable profile",
      },
      remotePresenceDefaultEnabled: "Enable remote presence by default (recommended)",
      otherBackends: {
        title: "Other plugin backends (memory / emotion / event / prompt)",
        desc:
          "Main chat LLM is selected in “Chat inference” above. This section configures the four backends: memory, emotion, event, prompt.",
        directoryPluginIdLabel: "Directory plugin ID",
        pickManifestId: "Pick a manifest id",
      },
      faqTitle: "FAQ · Engine settings (settings)",
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

