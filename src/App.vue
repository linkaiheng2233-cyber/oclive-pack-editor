<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AdvancedCreationPanel from './components/pack/AdvancedCreationPanel.vue'
import ChatPanel from './components/pack/ChatPanel.vue'
import PackChecksSection from './components/pack/PackChecksSection.vue'
import SimpleCreationPanel from './components/pack/SimpleCreationPanel.vue'
import { usePackEditor } from './composables/usePackEditor'
import { usePackShellPreferences } from './composables/usePackShellPreferences'

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
  creatorMessageToOthers,
  creatorMessageMode,
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
  applyMarketComposeJson,
} = usePackEditor()

const marketComposePaste = ref('')

const { themeCycleLabel, cycleTheme, bumpScale, scaleLabel } = usePackShellPreferences()

function onApplyMarketCompose() {
  const r = applyMarketComposeJson(marketComposePaste.value)
  if (r.ok) {
    marketComposePaste.value = ''
    goEditorView('simple')
  }
}

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
        class="rail-btn rail-btn--accent-editor"
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
        <div class="shell-header-row">
          <div class="shell-header-copy">
            <p class="kicker">oclive · 角色包编写器</p>
            <h1 class="shell-h1">{{ viewTitle }}</h1>
          </div>
          <div class="shell-header-tools" role="toolbar" aria-label="外观与字号">
            <div class="shell-scale" aria-label="界面大小">
              <button type="button" class="shell-tool-btn" title="缩小" aria-label="缩小界面" @click="bumpScale(-1)">
                A−
              </button>
              <span class="shell-scale-value" :title="'相对默认字号：' + scaleLabel">{{ scaleLabel }}</span>
              <button type="button" class="shell-tool-btn" title="放大" aria-label="放大界面" @click="bumpScale(1)">
                A+
              </button>
            </div>
            <button
              type="button"
              class="shell-tool-btn shell-theme-btn"
              :title="'主题：' + themeCycleLabel + '（点击切换）'"
              @click="cycleTheme"
            >
              {{ themeCycleLabel === '跟随系统' ? '◐' : themeCycleLabel === '深色' ? '🌙' : '☀️' }}
              {{ themeCycleLabel }}
            </button>
          </div>
        </div>
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

        <section class="market-compose-wrap" aria-label="从 OCLive 市场导入模块组合">
          <p class="section-kicker">与社区站联动</p>
          <h2 class="mc-h2">从市场「模块组合」导入</h2>
          <p class="mc-lead">
            在 <strong>OCLive 市场</strong> 的「角色包 → 模块组合」中选好片段后，点<strong>复制组合 JSON</strong>，回到此处粘贴到下方文本框，再点<strong>应用到简单创作</strong>。内容会<strong>追加</strong>到人设长文、世界观（Markdown）与「语气与关系提示」，不覆盖你已有正文。
          </p>
          <textarea
            v-model="marketComposePaste"
            class="mc-textarea"
            rows="8"
            spellcheck="false"
            placeholder='粘贴形如 {"version":1,"source":"oclive-plugin-market",...} 的整段 JSON'
          />
          <div class="mc-actions">
            <button type="button" class="mc-btn primary" @click="onApplyMarketCompose">应用到简单创作</button>
          </div>
        </section>

        <section class="quick-card" aria-label="进入创作">
          <p class="section-kicker">创作方式</p>
          <p class="quick-lead">
            简单模式用表单填人设；高级模式直接改文件，不懂可点各页的
            <span class="quick-hint-ico" aria-hidden="true">?</span> 看说明。
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
              <span class="quick-tile-desc">直接编辑 JSON 与知识库；有白话提示</span>
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
          v-model:creator-message-to-others="creatorMessageToOthers"
          v-model:creator-message-mode="creatorMessageMode"
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
          v-model:creator-message-to-others="creatorMessageToOthers"
          v-model:creator-message-mode="creatorMessageMode"
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
  /* 页面底纹在全局 body/:root，避免重复叠渐变 */
  background: transparent;
}

/* 与 oclive-launcher 侧栏：宽度、图标格、毛玻璃与描边一致 */
.editor-rail {
  width: calc(2.75rem + 1rem);
  box-sizing: border-box;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  padding: 1rem 0.5rem;
  border-right: 1px solid var(--fluent-border-stroke);
  background: color-mix(in srgb, var(--fluent-bg-card) 78%, transparent);
  backdrop-filter: blur(10px) saturate(110%);
  -webkit-backdrop-filter: blur(10px) saturate(110%);
  box-shadow:
    var(--fluent-shadow-soft),
    inset -1px 0 0 color-mix(in srgb, var(--fluent-border-stroke) 60%, transparent);
}

.rail-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 2.75rem;
  gap: 0.3rem;
  padding: 0.1rem 0;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--fluent-text-secondary);
  cursor: pointer;
  font-size: 0.65rem;
  font-weight: 500;
  transition:
    color 0.15s ease,
    transform 0.12s ease;
}

.rail-btn:hover {
  color: var(--fluent-text-primary);
}

.rail-btn:hover .rail-ico {
  background: var(--fluent-bg-subtle);
  color: var(--fluent-text-primary);
}

.rail-btn.active {
  color: var(--fluent-text-primary);
}

.rail-btn.active .rail-ico {
  background: color-mix(in srgb, var(--fluent-accent-subtle) 70%, rgba(255, 255, 255, 0.12));
  color: var(--fluent-accent);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--fluent-accent) 26%, transparent),
    0 0 10px color-mix(in srgb, var(--fluent-accent) 20%, transparent);
}

.rail-btn--accent-editor.active .rail-ico {
  background: var(--rail-accent-editor-bg);
  color: var(--rail-accent-editor);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--rail-accent-editor) 28%, transparent),
    0 0 10px color-mix(in srgb, var(--rail-accent-editor) 18%, transparent);
}

.rail-btn:focus-visible {
  outline: none;
}

.rail-btn:focus-visible .rail-ico {
  box-shadow: 0 0 0 2px var(--fluent-border-focus);
}

.rail-ico {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  flex-shrink: 0;
  border-radius: var(--fluent-radius);
  font-size: 1.25rem;
  line-height: 1;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    box-shadow 0.2s ease;
}

.rail-lbl {
  line-height: 1.15;
  text-align: center;
  max-width: 2.75rem;
}

.editor-main {
  flex: 1;
  min-width: 0;
  max-width: min(1080px, calc(100vw - 4.75rem));
  padding: clamp(0.85rem, 2.2vw, 1.25rem) clamp(0.75rem, 3vw, 1.35rem) clamp(1.5rem, 4vw, 2.5rem);
  margin: 0 auto;
  width: 100%;
}

.shell-header {
  margin-bottom: 1.25rem;
  padding: 1.1rem 1.25rem 1.2rem;
  border-radius: var(--fluent-radius-lg);
  background: color-mix(in srgb, var(--fluent-bg-card) 82%, transparent);
  backdrop-filter: blur(9px) saturate(106%);
  -webkit-backdrop-filter: blur(9px) saturate(106%);
  border: 1px solid var(--fluent-border-stroke);
  border-left: 3px solid var(--rail-accent-editor);
  box-shadow: var(--fluent-shadow-card);
}

.shell-header-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  margin-bottom: 0.35rem;
}

.shell-header-copy {
  flex: 1;
  min-width: min(100%, 14rem);
}

.shell-header-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem 0.65rem;
}

.shell-scale {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.35rem;
  border-radius: var(--fluent-radius-lg);
  border: 1px solid var(--pack-glass-border);
  background: var(--pack-glass-fill-subtle);
  box-shadow: var(--fluent-shadow-soft), var(--pack-glass-inset);
}

.shell-scale-value {
  min-width: 2.75rem;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--fluent-text-secondary);
  font-variant-numeric: tabular-nums;
}

.shell-tool-btn {
  padding: 0.35rem 0.55rem;
  min-height: 30px;
  border-radius: var(--fluent-radius);
  border: 1px solid var(--pack-glass-border);
  background: var(--pack-glass-fill-strong);
  backdrop-filter: var(--pack-glass-blur);
  -webkit-backdrop-filter: var(--pack-glass-blur);
  color: var(--fluent-text-primary);
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 500;
  font-family: var(--fluent-font);
  box-shadow: var(--fluent-shadow-soft), var(--pack-glass-inset);
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.1s ease;
}

.shell-tool-btn:hover {
  background: var(--fluent-bg-subtle);
  border-color: var(--fluent-text-secondary);
}

.shell-tool-btn:focus-visible {
  outline: none;
  box-shadow:
    var(--fluent-shadow-soft),
    var(--pack-glass-inset),
    0 0 0 2px rgba(255, 255, 255, 0.92),
    0 0 0 4px var(--fluent-border-focus);
}

.shell-tool-btn:active {
  transform: scale(0.98);
}

.shell-theme-btn {
  padding: 0.35rem 0.65rem;
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
  font-size: 1.55rem;
  font-weight: 650;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.sub {
  margin: 0.65rem 0 0;
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
  padding: 1rem 1.15rem 1.125rem;
  border-radius: var(--fluent-radius-lg);
  background: color-mix(in srgb, var(--fluent-bg-card) 82%, transparent);
  backdrop-filter: blur(9px) saturate(106%);
  -webkit-backdrop-filter: blur(9px) saturate(106%);
  border: 1px solid var(--fluent-border-stroke);
  box-shadow: var(--fluent-shadow-card);
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
  background: var(--pack-glass-fill-strong);
  backdrop-filter: var(--pack-glass-blur);
  -webkit-backdrop-filter: var(--pack-glass-blur);
  color: var(--fluent-accent);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: var(--fluent-shadow-soft), var(--pack-glass-inset);
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.1s ease;
}

.import-btn:hover {
  background: var(--fluent-accent-subtle);
  border-color: var(--fluent-accent-hover);
  color: var(--fluent-accent-hover);
}

.import-btn:focus-visible {
  outline: none;
  box-shadow:
    var(--fluent-shadow-soft),
    var(--pack-glass-inset),
    0 0 0 2px rgba(255, 255, 255, 0.92),
    0 0 0 4px var(--fluent-border-focus);
}

.import-btn:active {
  transform: scale(0.985);
}

.import-hint {
  font-size: 0.8125rem;
  color: var(--fluent-text-secondary);
}

.market-compose-wrap {
  margin-top: 1rem;
  padding: 1rem 1.15rem 1.2rem;
  border-radius: var(--fluent-radius-lg);
  background: color-mix(in srgb, var(--fluent-bg-card) 82%, transparent);
  backdrop-filter: blur(9px) saturate(106%);
  -webkit-backdrop-filter: blur(9px) saturate(106%);
  border: 1px solid var(--fluent-border-stroke);
  box-shadow: var(--fluent-shadow-card);
}

.mc-h2 {
  margin: 0 0 0.5rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--fluent-text-primary);
}

.mc-lead {
  margin: 0 0 0.85rem;
  font-size: 0.8125rem;
  color: var(--fluent-text-secondary);
  line-height: 1.55;
  max-width: 62ch;
}

.mc-textarea {
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 0.65rem;
  padding: 0.6rem 0.75rem;
  font-size: 0.78rem;
  font-family: ui-monospace, monospace;
  line-height: 1.45;
  border-radius: var(--fluent-radius);
  border: 1px solid var(--fluent-border-control);
  background: var(--fluent-bg-subtle);
  color: var(--fluent-text-primary);
  resize: vertical;
  min-height: 140px;
}

.mc-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.mc-btn.primary {
  padding: 0.5rem 1rem;
  min-height: 32px;
  border-radius: var(--fluent-radius);
  border: none;
  background: var(--fluent-accent);
  color: #fff;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: var(--fluent-font);
  box-shadow:
    var(--fluent-shadow-soft),
    0 1px 0 color-mix(in srgb, #fff 18%, transparent);
  transition:
    background 0.15s ease,
    transform 0.1s ease,
    box-shadow 0.15s ease;
}

.mc-btn.primary:hover {
  background: var(--fluent-accent-hover);
}

.mc-btn.primary:focus-visible {
  outline: none;
  box-shadow:
    var(--fluent-shadow-soft),
    0 0 0 2px rgba(255, 255, 255, 0.92),
    0 0 0 4px var(--fluent-border-focus);
}

.mc-btn.primary:active {
  transform: scale(0.985);
}

.quick-card {
  margin-top: 1rem;
  padding: 1rem 1.15rem 1.2rem;
  border-radius: var(--fluent-radius-lg);
  background: color-mix(in srgb, var(--fluent-bg-card) 82%, transparent);
  backdrop-filter: blur(9px) saturate(106%);
  -webkit-backdrop-filter: blur(9px) saturate(106%);
  border: 1px solid var(--fluent-border-stroke);
  border-left: 3px solid color-mix(in srgb, var(--rail-accent-editor) 65%, var(--fluent-border-stroke));
  box-shadow: var(--fluent-shadow-card);
}

.quick-lead {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: var(--fluent-text-secondary);
  line-height: 1.5;
}

.quick-hint-ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.05rem;
  height: 1.05rem;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--fluent-border-control) 85%, transparent);
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--fluent-text-secondary);
  vertical-align: middle;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 11rem), 1fr));
  gap: 0.75rem;
}

.quick-tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  padding: 1rem 1rem 1.1rem;
  border-radius: var(--fluent-radius-lg);
  border: 1px solid var(--pack-glass-border);
  background: var(--pack-glass-fill-subtle);
  backdrop-filter: var(--pack-glass-blur);
  -webkit-backdrop-filter: var(--pack-glass-blur);
  cursor: pointer;
  font-family: var(--fluent-font);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease,
    transform 0.1s ease;
}

.quick-tile:hover {
  border-color: color-mix(in srgb, var(--fluent-accent) 35%, var(--pack-glass-border));
  box-shadow: var(--fluent-shadow-soft), var(--pack-glass-inset);
  background: var(--pack-glass-fill-strong);
}

.quick-tile:focus-visible {
  outline: none;
  border-color: color-mix(in srgb, var(--fluent-accent) 45%, var(--pack-glass-border));
  box-shadow:
    var(--fluent-shadow-soft),
    var(--pack-glass-inset),
    0 0 0 2px rgba(255, 255, 255, 0.92),
    0 0 0 4px var(--fluent-border-focus),
    0 0 14px color-mix(in srgb, var(--fluent-accent) 18%, transparent);
}

.quick-tile:active {
  transform: scale(0.992);
}

.quick-tile-accent {
  border-color: color-mix(in srgb, var(--fluent-accent) 28%, var(--fluent-border-stroke));
  background: color-mix(in srgb, var(--fluent-accent-subtle) 55%, transparent);
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
  box-shadow:
    var(--fluent-shadow-soft),
    0 1px 0 color-mix(in srgb, #fff 18%, transparent);
  transition:
    background 0.15s ease,
    transform 0.1s ease,
    box-shadow 0.15s ease;
}

.actions button:hover {
  background: var(--fluent-accent-hover);
}

.actions button:focus-visible {
  outline: none;
  box-shadow:
    var(--fluent-shadow-soft),
    0 0 0 2px rgba(255, 255, 255, 0.92),
    0 0 0 4px var(--fluent-border-focus);
}

.actions button:active:not(:disabled) {
  transform: scale(0.985);
}

.actions button.secondary {
  background: var(--pack-glass-fill-strong);
  backdrop-filter: var(--pack-glass-blur);
  -webkit-backdrop-filter: var(--pack-glass-blur);
  color: var(--fluent-text-primary);
  border-color: var(--pack-glass-border);
  box-shadow: var(--fluent-shadow-soft), var(--pack-glass-inset);
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
  padding: 0.4rem 0.65rem;
  border-radius: var(--fluent-radius-lg);
  border: 1px solid var(--pack-glass-border);
  background: var(--pack-glass-fill-strong);
  backdrop-filter: var(--pack-glass-blur);
  -webkit-backdrop-filter: var(--pack-glass-blur);
  color: var(--fluent-text-primary);
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: var(--fluent-shadow-soft), var(--pack-glass-inset);
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.mobile-nav-btn:hover {
  background: var(--fluent-bg-subtle);
}

.mobile-nav-btn.active {
  border-color: color-mix(in srgb, var(--rail-accent-editor) 42%, var(--pack-glass-border));
  background: var(--rail-accent-editor-bg);
  color: var(--rail-accent-editor);
  font-weight: 600;
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--rail-accent-editor) 28%, transparent),
    0 0 10px color-mix(in srgb, var(--rail-accent-editor) 14%, transparent);
}

@media (max-width: 720px) {
  .editor-rail {
    display: none;
  }

  .editor-main {
    max-width: min(1080px, calc(100vw - 1.25rem));
    padding-left: clamp(0.65rem, 4vw, 1rem);
    padding-right: clamp(0.65rem, 4vw, 1rem);
  }

  .shell-header-tools {
    width: 100%;
    justify-content: flex-start;
  }

  .mobile-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin-bottom: 0.85rem;
    padding: 0.35rem 0;
    border-bottom: 1px solid var(--pack-glass-border);
    background: var(--pack-glass-fill);
    backdrop-filter: var(--pack-glass-blur);
    -webkit-backdrop-filter: var(--pack-glass-blur);
  }

  .editor-main {
    padding: 1rem 0.85rem 2rem;
  }
}
</style>
