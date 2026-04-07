<script setup lang="ts">
import AdvancedCreationPanel from './components/pack/AdvancedCreationPanel.vue'
import PackChecksSection from './components/pack/PackChecksSection.vue'
import SimpleCreationPanel from './components/pack/SimpleCreationPanel.vue'
import { usePackEditor } from './composables/usePackEditor'

const {
  manifestText,
  settingsText,
  corePersonalityText,
  worldviewMarkdown,
  validationErrors,
  lastMessage,
  lastMessageIsError,
  requireChecksBeforeExport,
  syncFormWarning,
  creationMode,
  advancedTab,
  simpleM,
  simpleS,
  multiRelationWarning,
  emotionImageSummary,
  folderExportOk,
  runValidate,
  onImportPack,
  onEmotionFilesPick,
  onEmotionFilesAppend,
  clearEmotionImages,
  exportZip,
  exportFolder,
} = usePackEditor()
</script>

<template>
  <div class="app">
    <header class="hdr">
      <h1>oclive 角色包编写器</h1>
      <p class="sub">
        独立工具，仅产出与运行时兼容的目录树；契约见 oclivenewnew 仓库
        <code>creator-docs/</code> 与 <code>roles/README_MANIFEST.md</code>。
      </p>
    </header>

    <section class="import-bar">
      <label class="import-btn">
        <input
          type="file"
          accept=".zip,.ocpak,application/zip"
          class="sr-only"
          @change="onImportPack"
        />
        导入角色包（.zip / .ocpak）
      </label>
      <span class="import-hint">导入后可编辑全部内容并另存为新包。</span>
    </section>

    <section class="mode-bar" aria-label="创作模式">
      <span class="mode-label">创作方式</span>
      <div class="mode-toggle" role="tablist">
        <button
          type="button"
          role="tab"
          :aria-selected="creationMode === 'simple'"
          :class="{ active: creationMode === 'simple' }"
          @click="creationMode = 'simple'"
        >
          简单创作
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="creationMode === 'advanced'"
          :class="{ active: creationMode === 'advanced' }"
          @click="creationMode = 'advanced'"
        >
          高级创作
        </button>
      </div>
      <p class="mode-hint">
        <template v-if="creationMode === 'simple'">
          基础只需<strong>人设描述</strong>与<strong>情绪图片</strong>；场景、身份、世界观、受影响程度等在「进阶」中填写。
        </template>
        <template v-else>
          直接编辑 manifest / settings 与文本资源，适合插件字段、多身份与完整包结构；可导入已有包修改。
        </template>
      </p>
    </section>

    <PackChecksSection
      v-model:require-checks-before-export="requireChecksBeforeExport"
      @run-validate="runValidate"
    />

    <SimpleCreationPanel
      v-if="creationMode === 'simple'"
      v-model:core-personality="corePersonalityText"
      v-model:worldview-markdown="worldviewMarkdown"
      :simple-m="simpleM"
      :simple-s="simpleS"
      :multi-relation-warning="multiRelationWarning"
      :sync-form-warning="syncFormWarning"
      :emotion-summary="emotionImageSummary"
      @emotion-pick="onEmotionFilesPick"
      @emotion-append="onEmotionFilesAppend"
      @emotion-clear="clearEmotionImages"
    />

    <AdvancedCreationPanel
      v-else
      v-model:manifest-text="manifestText"
      v-model:settings-text="settingsText"
      v-model:core-personality="corePersonalityText"
      v-model:worldview-markdown="worldviewMarkdown"
      v-model:advanced-tab="advancedTab"
      :emotion-summary="emotionImageSummary"
      @emotion-pick="onEmotionFilesPick"
      @emotion-append="onEmotionFilesAppend"
      @emotion-clear="clearEmotionImages"
    />

    <div class="actions">
      <button type="button" @click="exportZip(true)">导出 .ocpak（zip）</button>
      <button type="button" @click="exportZip(false)">导出 .zip</button>
      <button
        v-if="folderExportOk"
        type="button"
        class="secondary"
        @click="exportFolder"
      >
        写入文件夹（自选 roles 根目录）
      </button>
    </div>

    <div v-if="validationErrors.length" class="errors-block" role="alert">
      <strong>检查结果</strong>
      <ul>
        <li v-for="(e, i) in validationErrors" :key="i">{{ e }}</li>
      </ul>
    </div>
    <p v-else class="hint muted post-actions-hint">
      点击「运行全部检查」查看错误列表；无错误时此处为空。
    </p>

    <p
      v-if="lastMessage"
      class="feedback-msg"
      :class="{ 'feedback-msg--ok': !lastMessageIsError, 'feedback-msg--err': lastMessageIsError }"
      role="status"
    >
      {{ lastMessage }}
    </p>
  </div>
</template>

<style scoped>
.app {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.25rem 1rem 2.5rem;
  font-family: var(--fluent-font);
  color: var(--fluent-text-primary);
}

.hdr {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--fluent-border-stroke);
  margin-bottom: 0.25rem;
}
.hdr h1 {
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0 0 0.5rem;
}
.sub {
  margin: 0;
  color: var(--fluent-text-secondary);
  font-size: 0.875rem;
  line-height: 1.5;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.import-bar {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem 1rem;
}
.import-btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: var(--fluent-radius);
  border: 1px solid var(--fluent-accent);
  background: var(--fluent-bg-card);
  color: var(--fluent-accent);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: var(--fluent-shadow-soft);
  transition: background 0.15s ease, border-color 0.15s ease;
}
.import-btn:hover {
  background: var(--fluent-accent-subtle);
  border-color: var(--fluent-accent-hover);
  color: var(--fluent-accent-hover);
}
.import-hint {
  font-size: 0.8125rem;
  color: var(--fluent-text-secondary);
}

.mode-bar {
  margin-top: 1rem;
  padding: 1rem 1.125rem;
  border: 1px solid var(--fluent-border-stroke);
  border-radius: var(--fluent-radius-lg);
  background: var(--fluent-bg-card);
  box-shadow: var(--fluent-shadow-card);
}
.mode-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--fluent-text-secondary);
  margin-bottom: 0.5rem;
}
.mode-toggle {
  display: inline-flex;
  padding: 2px;
  border-radius: var(--fluent-radius);
  background: var(--fluent-bg-subtle);
  border: 1px solid var(--fluent-border-stroke);
  gap: 2px;
}
.mode-toggle button {
  padding: 0.4rem 1rem;
  border: none;
  border-radius: calc(var(--fluent-radius) - 1px);
  background: transparent;
  color: var(--fluent-text-primary);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.12s ease, color 0.12s ease;
}
.mode-toggle button.active {
  background: var(--fluent-bg-card);
  color: var(--fluent-accent);
  box-shadow: var(--fluent-shadow-soft);
}
.mode-toggle button:not(.active):hover {
  background: rgba(0, 0, 0, 0.04);
}
@media (prefers-color-scheme: dark) {
  .mode-toggle button:not(.active):hover {
    background: rgba(255, 255, 255, 0.06);
  }
}
.mode-hint {
  margin: 0.75rem 0 0;
  font-size: 0.8125rem;
  color: var(--fluent-text-secondary);
  line-height: 1.5;
}
.mode-hint strong {
  color: var(--fluent-text-primary);
  font-weight: 600;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
  align-items: center;
}
.actions button {
  padding: 0.5rem 1rem;
  min-height: 32px;
  border-radius: var(--fluent-radius);
  border: 1px solid transparent;
  background: var(--fluent-accent);
  color: #fff;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: var(--fluent-font);
  transition: background 0.15s ease;
}
.actions button:hover {
  background: var(--fluent-accent-hover);
}
.actions button.secondary {
  background: var(--fluent-bg-card);
  color: var(--fluent-text-primary);
  border-color: var(--fluent-border-control);
  box-shadow: var(--fluent-shadow-soft);
}
.actions button.secondary:hover {
  background: var(--fluent-bg-subtle);
  border-color: var(--fluent-text-secondary);
}
.errors-block {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: var(--fluent-danger-bg);
  border: 1px solid var(--fluent-danger-border);
  border-radius: var(--fluent-radius-lg);
  font-size: 0.875rem;
  color: var(--fluent-danger-text);
}
.errors-block strong {
  color: var(--fluent-danger-text);
}
.errors-block ul {
  margin: 0.35rem 0 0 1.1rem;
  padding: 0;
}
.hint.muted {
  color: var(--fluent-text-secondary);
  font-size: 0.875rem;
}
.post-actions-hint {
  margin-top: 0.75rem;
}
.feedback-msg {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.5;
  padding: 0.5rem 0.75rem;
  border-radius: var(--fluent-radius-lg);
}
.feedback-msg--ok {
  color: var(--fluent-success-text);
  background: rgba(16, 124, 16, 0.08);
  border: 1px solid rgba(16, 124, 16, 0.35);
}
.feedback-msg--err {
  color: var(--fluent-danger-text);
  background: var(--fluent-danger-bg);
  border: 1px solid var(--fluent-danger-border);
}
</style>
