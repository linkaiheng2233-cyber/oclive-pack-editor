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
      maxChangePerEventLabel: "Max change per event (max_change_per_event)",
      identityBindingLabel: "Identity binding",
      identityBinding: {
        perScene: "Per scene (per_scene)",
        global: "Global (global)",
      },
      interactionModeLabel: "Interaction mode",
      interactionMode: {
        immersive: "Immersive (immersive)",
        pureChat: "Pure chat (pure_chat)",
      },
      sceneWeightMultiplierLabel: "Scene memory weight multiplier",
    },
    author: {
      title: "Author & suggestions (author.json)",
      desc:
        "Optional: marketplace-facing summary and recommended plugins. If “Include suggested_ui on export” is checked, the “UI design” form below will also be written into author.json as suggested_ui (runtime prefers it over ui.json as a layout seed). suggested_plugin_backends is a JSON fragment for one-click session backend apply (not written into settings.json).",
      oneLineSummaryLabel: "One-line summary",
      oneLineSummaryPlaceholder: "e.g. A slow-to-warm desk mate, great for daily companionship",
      detailMarkdownLabel: "Details (Markdown)",
      detailMarkdownPlaceholder: "Optional: selling points, usage notes, recommended scenarios…",
      recommendedDirectoryPluginsLabel: "Recommended directory plugins",
      addRow: "Add a row",
      removeRow: "Remove",
      row: {
        pluginIdPlaceholder: "Plugin manifest id",
        versionRangePlaceholder: "Version range (optional)",
        notePlaceholder: "Note",
      },
      includeSuggestedUi: "Include current “UI design” as suggested_ui in author.json on export",
      suggestedPluginBackendsLabel: "suggested_plugin_backends (JSON, optional)",
      suggestedPluginBackendsPlaceholder: 'e.g. { "memory": "builtin", "llm": "ollama", ... }',
    },
    ui: {
      title: "UI design (ui.json)",
      desc:
        "Defines the default shell and embedded slot layout when the main app loads this pack. Export writes ui.json into the pack root. Users can override it in oclive plugin manager; “Reset to role pack suggestion” can restore it.",
      shellLabel: "Shell UI",
      shellNone: "None (use built-in UI)",
      scanningGlobal: "Scanning global plugins…",
      noShellPluginsHint:
        "No shell plugins found (requires type: ocliveplugin and contains shell). Put plugins into app data or working directory plugins/, or export into a folder that contains plugins/.",
      common: {
        defaultBuiltin: "Default (built-in)",
        left: "Left",
        right: "Right",
        top: "Top",
        bottom: "Bottom",
      },
      theme: {
        primary: "Theme · primary",
        background: "Theme · background",
        font: "Theme · font",
        fontSegoeAndYahei: "Segoe UI / Microsoft YaHei",
        fontMono: "Monospace",
      },
      layout: {
        sidebar: "Layout · sidebar position",
        defaultLeft: "Default (left)",
        chatInput: "Layout · chat input position",
        defaultBottom: "Default (bottom)",
      },
      slotOrderAria: "{title} plugin order",
      slot: {
        defaultVisible: "Visible by default",
        empty: "No available plugins for this slot (scan a directory plugin that declares this slot).",
      },
    },
    futureNotePrefix: "If you need full JSON or plugin fields, switch to ",
    futureNoteStrong: "Advanced creation",
    futureNoteSuffix: " and edit the source directly.",
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
  advancedCreation: {
    toolbar: {
      leadPrefix: "In advanced mode you edit file contents directly. If unsure, click the ",
      leadSuffix: " next to each heading first.",
      aria: "Advanced editor sections",
    },
    tabs: {
      manifest: "Role contract",
      settings: "Chat & plugins",
      core: "Core profile & message",
      coreFile: "core / message",
      world: "World & knowledge",
      images: "Emotion assets",
    },
    docks: {
      badges: {
        keypoints: "Key points",
        faq: "FAQ",
      },
      eachItemTitle: "Each item: meaning & creator scope",
      scopeStrong: "Scope: ",
    },
    sections: {
      manifest: {
        title: "Role contract (manifest)",
        lead:
          "Controls “who it is, what it’s called, which scenes it has, and the user relation”, i.e. the role’s public-facing info.",
        keyMapSummary: "In this JSON, which names do you usually change?",
        docks: {
          keypointsAria: "manifest field notes",
          keypointsTitle: "manifest · field notes & editable scope",
          keypointsNotePrefix: "Edit the JSON above item by item; ",
          keypointsNoteStrong: "do not replace the entire file with the code blocks below",
          keypointsNoteSuffix: ".",
          faqAria: "manifest FAQ",
          faqTitle: "FAQ · manifest (before / after examples)",
        },
      },
      settings: {
        title: "Chat & plugins (settings)",
        lead:
          "Controls “which model to use, which plugins handle memory/emotion”, etc. It has a different responsibility from manifest.",
        keyMapSummary: "In this JSON, which keys do you commonly change?",
        docks: {
          keypointsAria: "settings field notes",
          keypointsTitle: "settings · field notes & editable scope",
          keypointsNotePrefix: "Change only what you need; ",
          keypointsNoteStrong: "keep braces and commas consistent with the JSON structure",
          keypointsNoteSuffix: ". If unsure, back up first.",
          faqAria: "settings FAQ",
          faqTitle: "FAQ · settings (before / after examples)",
        },
      },
      core: {
        coreTitle: "Core personality (core_personality.txt)",
        coreLead:
          "Write personality and speaking habits in natural language; no code needed. The runtime “mutable personality profile” is maintained by the model and should not be hand-written in the pack.",
        coreDocks: {
          keypointsAria: "Core personality editable scope",
          keypointsTitle: "Core personality · editable scope",
          scopeTitle: "Editable scope",
          faqAria: "Core personality FAQ",
          faqTitle: "FAQ · Core personality (before / after examples)",
          faqNotePrefix: "Use the text above as reference. The snippets below are ",
          faqNoteStrong: "reference fragments",
          faqNoteSuffix: "; no need to copy everything.",
        },
        creatorMsgTitle: "Message to players (optional)",
        creatorMsgLead:
          "Fill in the editor only. Players read it read-only in launcher, etc. Shared with simple creation.",
        creatorMsgModeAria: "Creator message export mode",
        creatorMsgModes: {
          unified: "One line for the whole pack (exports the first non-empty line only)",
          perModule: "Multiple lines (one message per line)",
        },
        creatorMsgDocks: {
          keypointsAria: "Player message editable scope",
          keypointsTitle: "Player message · modes & editable scope",
          scopeTitle: "Modes & editable scope",
          notePrefix: "Pair with the radio choice above; export results differ between ",
          noteStrongUnified: "one-line pack message",
          noteMiddle: " and ",
          noteStrongPerModule: "multi-line messages",
          noteSuffix: ".",
          faqAria: "Player message FAQ",
          faqTitle: "FAQ · Player message (before / after examples)",
        },
      },
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

