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

    <p v-if="lastMessage" class="okmsg">{{ lastMessage }}</p>
  </div>
</template>

<style scoped>
.app {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.25rem 1rem 2rem;
  font-family: system-ui, sans-serif;
}
.hdr h1 {
  font-size: 1.35rem;
  margin: 0 0 0.35rem;
}
.sub {
  margin: 0;
  color: #444;
  font-size: 0.9rem;
  line-height: 1.45;
}
code {
  font-size: 0.88em;
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
  margin-top: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem 1rem;
}
.import-btn {
  display: inline-block;
  padding: 0.45rem 0.85rem;
  border-radius: 6px;
  border: 1px solid #2a6a9e;
  background: #e8f2fa;
  color: #0d3a5c;
  cursor: pointer;
  font-size: 0.9rem;
}
.import-btn:hover {
  background: #dcecf8;
}
.import-hint {
  font-size: 0.85rem;
  color: #555;
}

.mode-bar {
  margin-top: 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f8f8fb;
}
.mode-label {
  display: block;
  font-size: 0.8rem;
  color: #555;
  margin-bottom: 0.4rem;
}
.mode-toggle {
  display: inline-flex;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ccc;
}
.mode-toggle button {
  padding: 0.45rem 1rem;
  border: none;
  background: #fff;
  color: #333;
  cursor: pointer;
  font-size: 0.9rem;
}
.mode-toggle button.active {
  background: #1a1a1a;
  color: #fff;
}
.mode-toggle button:not(.active):hover {
  background: #eee;
}
.mode-hint {
  margin: 0.6rem 0 0;
  font-size: 0.85rem;
  color: #555;
  line-height: 1.45;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.85rem;
  align-items: center;
}
.actions button {
  padding: 0.45rem 0.85rem;
  border-radius: 6px;
  border: 1px solid #333;
  background: #1a1a1a;
  color: #fff;
  cursor: pointer;
  font-size: 0.9rem;
}
.actions button.secondary {
  background: #fff;
  color: #1a1a1a;
}
.actions button:hover {
  opacity: 0.92;
}
.errors-block {
  margin-top: 0.85rem;
  padding: 0.65rem 0.85rem;
  background: #fff4f4;
  border: 1px solid #e8a0a0;
  border-radius: 6px;
  font-size: 0.88rem;
}
.errors-block ul {
  margin: 0.35rem 0 0 1.1rem;
  padding: 0;
}
.hint.muted {
  color: #666;
  font-size: 0.88rem;
}
.post-actions-hint {
  margin-top: 0.65rem;
}
.okmsg {
  margin-top: 0.75rem;
  font-size: 0.88rem;
  color: #1a6b2c;
  line-height: 1.45;
}
</style>
