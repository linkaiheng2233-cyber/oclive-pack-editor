<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AdvancedCreationPanel from './components/pack/AdvancedCreationPanel.vue'
import ChatPanel from './components/pack/ChatPanel.vue'
import PackChecksSection from './components/pack/PackChecksSection.vue'
import SimpleCreationPanel from './components/pack/SimpleCreationPanel.vue'
import { usePackEditor } from './composables/usePackEditor'

const {
  manifestText,
  settingsText,
  corePersonalityText,
  worldviewMarkdown,
  knowledgeMarkdownFiles,
  validationErrors,
  validationLastUsedWasm,
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
  manifestRoleId,
  lastExportedRolesRoot,
  runValidate,
  onImportPack,
  onEmotionFilesPick,
  onEmotionFilesAppend,
  clearEmotionImages,
  addKnowledgeFile,
  updateKnowledgeFile,
  removeKnowledgeFile,
  exportZip,
  exportFolder,
  flushSimpleToJson,
} = usePackEditor()

type EditorViewId = 'start' | 'simple' | 'advanced' | 'check' | 'chat'

const editorView = ref<EditorViewId>('start')

watch(editorView, (v) => {
  if (v === 'check' || v === 'chat') flushSimpleToJson()
})

const editorNav: { id: EditorViewId; label: string; icon: string }[] = [
  { id: 'start', label: '开始', icon: '🏠' },
  { id: 'simple', label: '简单', icon: '📝' },
  { id: 'advanced', label: '高级', icon: '⚙️' },
  { id: 'check', label: '检查', icon: '✓' },
  { id: 'chat', label: '试聊', icon: '💬' },
]

function goEditorView(id: EditorViewId) {
  editorView.value = id
  if (id === 'simple') creationMode.value = 'simple'
  if (id === 'advanced') creationMode.value = 'advanced'
}

const viewTitle = computed(() => {
  const m: Record<EditorViewId, string> = {
    start: '开始',
    simple: '简单创作',
    advanced: '高级创作',
    check: '检查与导出',
    chat: '试聊',
  }
  return m[editorView.value]
})
</script>

<template>
  <div class="app fluent-page editor-shell">
    <aside class="editor-rail" aria-label="功能导航">
      <button
        v-for="item in editorNav"
        :key="item.id"
        type="button"
        class="rail-btn"
        :class="{ active: editorView === item.id }"
        @click="goEditorView(item.id)"
      >
        <span class="rail-ico" aria-hidden="true">{{ item.icon }}</span>
        <span class="rail-lbl">{{ item.label }}</span>
      </button>
    </aside>

    <div class="editor-main">
      <nav class="mobile-nav" aria-label="功能导航">
        <button
          v-for="item in editorNav"
          :key="'m-' + item.id"
          type="button"
          class="mobile-nav-btn"
          :class="{ active: editorView === item.id }"
          @click="goEditorView(item.id)"
        >
          {{ item.icon }} {{ item.label }}
        </button>
      </nav>

      <header class="shell-header">
        <p class="kicker">oclive · 角色包编写器</p>
        <h1 class="shell-h1">{{ viewTitle }}</h1>
        <p v-if="editorView === 'start'" class="sub">
          独立工具，仅产出与运行时兼容的目录树；契约见 oclivenewnew 仓库
          <code>creator-docs/</code> 与 <code>roles/README_MANIFEST.md</code>。
        </p>
        <p v-else class="sub sub-muted">使用左侧导航在不同功能间切换，避免单页堆砌。</p>
      </header>

      <!-- 开始：导入 + 入口 -->
      <div v-show="editorView === 'start'" class="view-stack">
        <section class="import-wrap" aria-label="导入角色包">
          <p class="section-kicker">快速开始</p>
          <div class="import-bar">
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
          </div>
        </section>

        <section class="quick-card" aria-label="进入创作">
          <p class="section-kicker">创作方式</p>
          <p class="quick-lead">
            按需进入对应页面：简单模式侧重人设与情绪图；高级模式直接编辑 JSON 与资源路径。
          </p>
          <div class="quick-actions">
            <button type="button" class="quick-tile" @click="goEditorView('simple')">
              <span class="quick-tile-ico" aria-hidden="true">📝</span>
              <span class="quick-tile-title">简单创作</span>
              <span class="quick-tile-desc">人设、情绪图、进阶字段折叠</span>
            </button>
            <button type="button" class="quick-tile" @click="goEditorView('advanced')">
              <span class="quick-tile-ico" aria-hidden="true">⚙️</span>
              <span class="quick-tile-title">高级创作</span>
              <span class="quick-tile-desc">manifest / settings / 分标签编辑</span>
            </button>
            <button type="button" class="quick-tile quick-tile-accent" @click="goEditorView('check')">
              <span class="quick-tile-ico" aria-hidden="true">✓</span>
              <span class="quick-tile-title">检查与导出</span>
              <span class="quick-tile-desc">校验契约、导出 zip / 写入文件夹</span>
            </button>
            <button type="button" class="quick-tile" @click="goEditorView('chat')">
              <span class="quick-tile-ico" aria-hidden="true">💬</span>
              <span class="quick-tile-title">试聊</span>
              <span class="quick-tile-desc">连接本机 oclive HTTP API，快速对话</span>
            </button>
          </div>
        </section>
      </div>

      <!-- 简单创作 -->
      <div v-show="editorView === 'simple'" class="view-stack">
        <SimpleCreationPanel
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
      </div>

      <!-- 高级创作 -->
      <div v-show="editorView === 'advanced'" class="view-stack">
        <AdvancedCreationPanel
          v-model:manifest-text="manifestText"
          v-model:settings-text="settingsText"
          v-model:core-personality="corePersonalityText"
          v-model:knowledge-files="knowledgeMarkdownFiles"
          v-model:advanced-tab="advancedTab"
          :emotion-summary="emotionImageSummary"
          @add-knowledge-file="addKnowledgeFile"
          @update-knowledge-file="updateKnowledgeFile"
          @remove-knowledge-file="removeKnowledgeFile"
          @emotion-pick="onEmotionFilesPick"
          @emotion-append="onEmotionFilesAppend"
          @emotion-clear="clearEmotionImages"
        />
      </div>

      <!-- 试聊 -->
      <div v-show="editorView === 'chat'" class="view-stack">
        <ChatPanel :role-id="manifestRoleId" :last-roles-root="lastExportedRolesRoot" />
      </div>

      <!-- 检查与导出 -->
      <div v-show="editorView === 'check'" class="view-stack view-stack--check">
        <PackChecksSection
          v-model:require-checks-before-export="requireChecksBeforeExport"
          :validation-last-used-wasm="validationLastUsedWasm"
          @run-validate="runValidate"
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
    </div>
  </div>
</template>

<style scoped>
.app {
  margin: 0;
  padding: 0;
  max-width: none;
  font-family: var(--fluent-font);
  color: var(--fluent-text-primary);
}

.editor-shell {
  display: flex;
  min-height: 100vh;
  background: var(--fluent-bg-page);
}

.editor-rail {
  width: 80px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.85rem 0.45rem;
  border-right: 1px solid var(--fluent-border-stroke);
  background: var(--fluent-bg-card);
  box-shadow: var(--fluent-shadow-soft);
}

.rail-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.45rem 0.2rem;
  border: none;
  border-radius: var(--fluent-radius-lg);
  background: transparent;
  color: var(--fluent-text-secondary);
  cursor: pointer;
  font-size: 0.65rem;
  font-weight: 500;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.rail-btn:hover {
  background: var(--fluent-bg-subtle);
  color: var(--fluent-text-primary);
}

.rail-btn.active {
  background: var(--fluent-accent-subtle);
  color: var(--fluent-accent);
}

.rail-ico {
  font-size: 1.2rem;
  line-height: 1;
}

.rail-lbl {
  line-height: 1.15;
  text-align: center;
}

.editor-main {
  flex: 1;
  min-width: 0;
  max-width: 1080px;
  padding: 1.1rem 1.25rem 2.5rem;
  margin: 0 auto;
  width: 100%;
}

.shell-header {
  margin-bottom: 1.25rem;
  padding: 1.1rem 1.25rem 1.2rem;
  border-radius: var(--fluent-radius-lg);
  background: linear-gradient(
    135deg,
    var(--fluent-bg-card) 0%,
    var(--fluent-bg-subtle) 55%,
    var(--fluent-bg-card) 100%
  );
  border: 1px solid var(--fluent-border-stroke);
  box-shadow: var(--fluent-shadow-card);
}

.kicker {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--fluent-accent);
}

.shell-h1 {
  margin: 0.35rem 0 0;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.sub {
  margin: 0.5rem 0 0;
  color: var(--fluent-text-secondary);
  font-size: 0.875rem;
  line-height: 1.55;
  max-width: 52rem;
}

.sub-muted {
  opacity: 0.95;
}

.view-stack {
  animation: viewIn 0.2s ease;
}

@keyframes viewIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.view-stack--check .actions {
  margin-top: 0.5rem;
}

.import-wrap {
  padding: 1rem 1.125rem 1.125rem;
  border-radius: var(--fluent-radius-lg);
  background: var(--fluent-bg-card);
  border: 1px solid var(--fluent-border-stroke);
  box-shadow: var(--fluent-shadow-soft);
}

.section-kicker {
  margin: 0 0 0.6rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--fluent-accent);
}

.import-bar {
  margin-top: 0;
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

.quick-card {
  margin-top: 1rem;
  padding: 1rem 1.125rem 1.2rem;
  border-radius: var(--fluent-radius-lg);
  background: var(--fluent-bg-card);
  border: 1px solid var(--fluent-border-stroke);
  box-shadow: var(--fluent-shadow-card);
}

.quick-lead {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: var(--fluent-text-secondary);
  line-height: 1.5;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.quick-tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  padding: 1rem 1rem 1.1rem;
  border-radius: var(--fluent-radius-lg);
  border: 1px solid var(--fluent-border-stroke);
  background: var(--fluent-bg-subtle);
  cursor: pointer;
  font-family: var(--fluent-font);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}

.quick-tile:hover {
  border-color: var(--fluent-accent);
  box-shadow: var(--fluent-shadow-soft);
  background: var(--fluent-bg-card);
}

.quick-tile-accent {
  border-color: rgba(0, 120, 212, 0.35);
  background: var(--fluent-accent-subtle);
}

.quick-tile-ico {
  font-size: 1.5rem;
  margin-bottom: 0.35rem;
}

.quick-tile-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--fluent-text-primary);
  margin-bottom: 0.25rem;
}

.quick-tile-desc {
  font-size: 0.78rem;
  color: var(--fluent-text-secondary);
  line-height: 1.4;
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

.mobile-nav {
  display: none;
}

.mobile-nav-btn {
  padding: 0.35rem 0.55rem;
  border-radius: var(--fluent-radius);
  border: 1px solid var(--fluent-border-stroke);
  background: var(--fluent-bg-card);
  color: var(--fluent-text-primary);
  font-size: 0.78rem;
  cursor: pointer;
}

.mobile-nav-btn.active {
  border-color: var(--fluent-accent);
  background: var(--fluent-accent-subtle);
  color: var(--fluent-accent);
}

@media (max-width: 720px) {
  .editor-rail {
    display: none;
  }

  .mobile-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.85rem;
  }

  .editor-main {
    padding: 1rem 0.85rem 2rem;
  }
}
</style>
