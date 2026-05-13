<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  directoryPluginJsonRpcInvoke,
  loadVueTestWorkspaceRoot,
  saveVueTestWorkspaceRoot,
} from '../../lib/vueTestRunnerApi'

const { t } = useI18n()

const workspaceRoot = ref('')
const busy = ref(false)
const lastError = ref<string | null>(null)
const healthJson = ref<string>('')
const files = ref<string[]>([])
const selectedFile = ref('')
const runResult = ref<string>('')

const scanRoot = computed(() => {
  const w = workspaceRoot.value.trim()
  if (!w) return ''
  return `${w.replace(/[/\\]+$/, '')}/src`
})

async function runHealth() {
  lastError.value = null
  busy.value = true
  try {
    const roots = workspaceRoot.value.trim() ? [workspaceRoot.value.trim()] : []
    if (!roots.length) {
      throw new Error(String(t('packEditor.frontendTests.errNoWorkspace')))
    }
    const r = await directoryPluginJsonRpcInvoke('health', { cwd: roots[0]! }, roots)
    healthJson.value = JSON.stringify(r, null, 2)
  } catch (e) {
    lastError.value = e instanceof Error ? e.message : String(e)
    healthJson.value = ''
  } finally {
    busy.value = false
  }
}

async function refreshList() {
  lastError.value = null
  busy.value = true
  files.value = []
  try {
    const w = workspaceRoot.value.trim()
    if (!w) {
      throw new Error(String(t('packEditor.frontendTests.errNoWorkspace')))
    }
    saveVueTestWorkspaceRoot(w)
    const root = scanRoot.value
    const r = (await directoryPluginJsonRpcInvoke(
      'list_test_files',
      { root },
      [w],
    )) as { files?: string[] }
    files.value = Array.isArray(r.files) ? r.files : []
  } catch (e) {
    lastError.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}

async function runAll() {
  lastError.value = null
  busy.value = true
  runResult.value = ''
  try {
    const w = workspaceRoot.value.trim()
    if (!w) {
      throw new Error(String(t('packEditor.frontendTests.errNoWorkspace')))
    }
    const r = await directoryPluginJsonRpcInvoke(
      'run_test',
      { cwd: w, runAll: true, timeoutMs: 600_000 },
      [w],
    )
    runResult.value = JSON.stringify(r, null, 2)
  } catch (e) {
    lastError.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}

async function runSelected() {
  lastError.value = null
  const spec = selectedFile.value.trim()
  if (!spec) {
    lastError.value = String(t('packEditor.frontendTests.errNoSelection'))
    return
  }
  busy.value = true
  runResult.value = ''
  try {
    const w = workspaceRoot.value.trim()
    if (!w) {
      throw new Error(String(t('packEditor.frontendTests.errNoWorkspace')))
    }
    const r = await directoryPluginJsonRpcInvoke(
      'run_test',
      { cwd: w, specPath: spec, runAll: false, timeoutMs: 600_000 },
      [w],
    )
    runResult.value = JSON.stringify(r, null, 2)
  } catch (e) {
    lastError.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  workspaceRoot.value = loadVueTestWorkspaceRoot()
})
</script>

<template>
  <section class="ft-panel" :aria-label="String(t('packEditor.frontendTests.aria'))">
    <p class="ft-lead">{{ t('packEditor.frontendTests.lead') }}</p>
    <p class="ft-hint">{{ t('packEditor.frontendTests.hintPluginsPath') }}</p>

    <label class="ft-field">
      <span class="ft-label">{{ t('packEditor.frontendTests.workspaceLabel') }}</span>
      <input
        v-model="workspaceRoot"
        type="text"
        class="ft-input"
        spellcheck="false"
        :placeholder="String(t('packEditor.frontendTests.workspacePlaceholder'))"
      />
    </label>

    <div class="ft-actions">
      <button type="button" class="ft-btn" :disabled="busy" @click="runHealth">
        {{ t('packEditor.frontendTests.btnHealth') }}
      </button>
      <button type="button" class="ft-btn" :disabled="busy" @click="refreshList">
        {{ t('packEditor.frontendTests.btnList') }}
      </button>
      <button type="button" class="ft-btn primary" :disabled="busy" @click="runAll">
        {{ t('packEditor.frontendTests.btnRunAll') }}
      </button>
      <button type="button" class="ft-btn" :disabled="busy || !selectedFile.trim()" @click="runSelected">
        {{ t('packEditor.frontendTests.btnRunOne') }}
      </button>
    </div>

    <p v-if="lastError" class="ft-err" role="alert">{{ lastError }}</p>
    <p v-if="scanRoot" class="ft-muted">{{ t('packEditor.frontendTests.scanRoot', { path: scanRoot }) }}</p>

    <div v-if="files.length" class="ft-list-wrap">
      <label class="ft-label" for="ft-file-select">{{ t('packEditor.frontendTests.filesLabel') }}</label>
      <select id="ft-file-select" v-model="selectedFile" class="ft-select" size="8">
        <option disabled value="">{{ t('packEditor.frontendTests.pickFile') }}</option>
        <option v-for="f in files" :key="f" :value="f">{{ f }}</option>
      </select>
    </div>

    <div v-if="healthJson" class="ft-block">
      <h3 class="ft-h3">{{ t('packEditor.frontendTests.healthTitle') }}</h3>
      <pre class="ft-pre">{{ healthJson }}</pre>
    </div>

    <div v-if="runResult" class="ft-block">
      <h3 class="ft-h3">{{ t('packEditor.frontendTests.resultTitle') }}</h3>
      <pre class="ft-pre">{{ runResult }}</pre>
    </div>
  </section>
</template>

<style scoped>
.ft-panel {
  max-width: 920px;
  margin: 0 auto;
  padding: 12px 8px 24px;
}
.ft-lead {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 650;
}
.ft-hint {
  margin: 0 0 14px;
  font-size: 12px;
  color: var(--text-secondary, #9aa0b4);
  line-height: 1.45;
}
.ft-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}
.ft-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #9aa0b4);
}
.ft-input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-light, #2e3240);
  background: var(--bg-primary, #12141c);
  color: var(--text-primary, #e8eaf0);
  font: inherit;
}
.ft-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.ft-btn {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-light, #2e3240);
  background: var(--bg-elevated, #1a1d28);
  color: var(--text-primary, #e8eaf0);
  font: inherit;
  cursor: pointer;
}
.ft-btn.primary {
  border-color: transparent;
  background: var(--accent, #5b7cff);
  color: #fff;
}
.ft-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.ft-err {
  color: var(--danger, #f87171);
  font-size: 13px;
}
.ft-muted {
  font-size: 12px;
  color: var(--text-secondary, #9aa0b4);
  word-break: break-all;
}
.ft-list-wrap {
  margin: 12px 0;
}
.ft-select {
  width: 100%;
  box-sizing: border-box;
  margin-top: 6px;
  font: inherit;
  font-size: 12px;
}
.ft-block {
  margin-top: 16px;
}
.ft-h3 {
  margin: 0 0 6px;
  font-size: 13px;
}
.ft-pre {
  margin: 0;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--border-light, #2e3240);
  background: #0d0f14;
  color: #c9d1dc;
  font-size: 11px;
  line-height: 1.35;
  max-height: 420px;
  overflow: auto;
  white-space: pre-wrap;
}
</style>
