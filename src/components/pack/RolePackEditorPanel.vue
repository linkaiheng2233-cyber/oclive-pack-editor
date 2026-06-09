<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { open } from '@tauri-apps/api/dialog'
import { isTauriRuntime } from '../../lib/exportFolder'
import { invokeLoadRolePackForEditor, invokeSaveRolePackEditor } from '../../lib/rolePackEditorApi'
import { validateRolePackEditorState } from '../../lib/rolePackEditorValidate'
import { HOST_RUNTIME_VERSION } from '../../lib/hostRuntimeVersion'
import AnchorPresetManager from './AnchorPresetManager.vue'

const { t } = useI18n()

const roleDir = ref<string | null>(null)
const mergedSceneIds = ref<string[]>([])
const editMode = ref<'form' | 'json'>('form')
const manifestJsonText = ref('')
const settingsJsonText = ref('')
const manifestObj = ref<Record<string, unknown>>({})
const settingsObj = ref<Record<string, unknown>>({})
const configJsonText = ref('')
const userIdentitiesIndexText = ref('')
const validationErrors = ref<string[]>([])
const validationUsedWasm = ref<boolean | null>(null)
const statusMessage = ref('')
const statusIsError = ref(false)

const PERSONALITY_KEYS = [
  'stubbornness',
  'clinginess',
  'sensitivity',
  'assertiveness',
  'forgiveness',
  'talkativeness',
  'warmth',
] as const

const PLUGIN_SLOTS = ['memory', 'emotion', 'event', 'prompt', 'llm', 'agent'] as const

const backendOptions: Record<(typeof PLUGIN_SLOTS)[number], { value: string; label: string }[]> = {
  memory: [
    { value: 'builtin', label: 'builtin' },
    { value: 'builtin_v2', label: 'builtin_v2' },
    { value: 'remote', label: 'remote' },
    { value: 'local', label: 'local' },
    { value: 'directory', label: 'directory' },
    { value: 'none', label: 'none' },
  ],
  emotion: [
    { value: 'builtin', label: 'builtin' },
    { value: 'builtin_v2', label: 'builtin_v2' },
    { value: 'remote', label: 'remote' },
    { value: 'directory', label: 'directory' },
    { value: 'none', label: 'none' },
  ],
  event: [
    { value: 'builtin', label: 'builtin' },
    { value: 'builtin_v2', label: 'builtin_v2' },
    { value: 'remote', label: 'remote' },
    { value: 'directory', label: 'directory' },
    { value: 'none', label: 'none' },
  ],
  prompt: [
    { value: 'builtin', label: 'builtin' },
    { value: 'builtin_v2', label: 'builtin_v2' },
    { value: 'remote', label: 'remote' },
    { value: 'directory', label: 'directory' },
    { value: 'none', label: 'none' },
  ],
  llm: [
    { value: 'ollama', label: 'ollama' },
    { value: 'remote', label: 'remote' },
    { value: 'directory', label: 'directory' },
    { value: 'none', label: 'none' },
  ],
  agent: [
    { value: 'builtin', label: 'builtin' },
    { value: 'remote', label: 'remote' },
    { value: 'directory', label: 'directory' },
    { value: 'none', label: 'none' },
  ],
}

function defaultSettings(): Record<string, unknown> {
  return {
    schema_version: 1,
    plugin_backends: {
      memory: 'builtin',
      emotion: 'builtin',
      event: 'builtin',
      prompt: 'builtin',
      llm: 'ollama',
      agent: 'builtin',
    },
  }
}

function ensureSevenPersonality(m: Record<string, unknown>): number[] {
  const raw = m.default_personality
  const out = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
  if (!Array.isArray(raw)) return out
  for (let i = 0; i < 7; i++) {
    const x = Number(raw[i])
    if (Number.isFinite(x)) out[i] = Math.min(1, Math.max(0, x))
  }
  return out
}

function setPersonalityAt(i: number, v: number) {
  const m = { ...manifestObj.value }
  const arr = [...ensureSevenPersonality(m)]
  arr[i] = v
  m.default_personality = arr
  manifestObj.value = m
}

const summaryName = computed(() => String(manifestObj.value.name ?? ''))
const summaryVersion = computed(() => String(manifestObj.value.version ?? ''))
const summaryAuthor = computed(() => String(manifestObj.value.author ?? ''))

const tagsString = computed({
  get() {
    const v = manifestObj.value.tags
    if (Array.isArray(v)) return v.map(String).join(', ')
    return ''
  },
  set(s: string) {
    const m = { ...manifestObj.value }
    const parts = s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
    if (parts.length) m.tags = parts
    else delete m.tags
    manifestObj.value = m
  },
})

const licenseString = computed({
  get() {
    const v = manifestObj.value.license
    return v == null ? '' : String(v)
  },
  set(s: string) {
    const m = { ...manifestObj.value }
    if (s.trim()) m.license = s.trim()
    else delete m.license
    manifestObj.value = m
  },
})

const pluginBackends = computed<Record<string, string>>({
  get() {
    const pb = settingsObj.value.plugin_backends
    const o: Record<string, string> = {}
    for (const k of PLUGIN_SLOTS) {
      let v = ''
      if (pb && typeof pb === 'object' && !Array.isArray(pb)) {
        const raw = (pb as Record<string, unknown>)[k]
        if (raw != null) v = String(raw)
      }
      if (!v) v = backendOptions[k][0]!.value
      o[k] = v
    }
    return o
  },
  set(next: Record<string, string>) {
    const s = { ...settingsObj.value }
    const prev =
      typeof s.plugin_backends === 'object' && s.plugin_backends && !Array.isArray(s.plugin_backends)
        ? (s.plugin_backends as Record<string, unknown>)
        : {}
    s.plugin_backends = { ...prev, ...next }
    settingsObj.value = s
  },
})

function setPluginSlot(slot: (typeof PLUGIN_SLOTS)[number], value: string) {
  const cur = { ...pluginBackends.value }
  cur[slot] = value
  pluginBackends.value = cur
}

const interactionMode = computed({
  get() {
    const v = settingsObj.value.interaction_mode
    return v == null ? '' : String(v)
  },
  set(s: string) {
    const next = { ...settingsObj.value }
    if (s.trim()) next.interaction_mode = s.trim()
    else delete next.interaction_mode
    settingsObj.value = next
  },
})

const replyAnchor = computed({
  get() {
    const v = settingsObj.value.reply_quality_anchor
    return typeof v === 'string' ? v : ''
  },
  set(s: string) {
    const next = { ...settingsObj.value }
    next.reply_quality_anchor = s
    settingsObj.value = next
  },
})

let validateTimer: ReturnType<typeof setTimeout> | undefined
function scheduleValidate() {
  if (!roleDir.value) return
  if (validateTimer) clearTimeout(validateTimer)
  validateTimer = setTimeout(() => void runValidate(), 320)
}

async function runValidate() {
  const mj = currentManifestJson()
  const sj = currentSettingsJson()
  const r = await validateRolePackEditorState(mj, sj, mergedSceneIds.value, HOST_RUNTIME_VERSION)
  validationErrors.value = r.errors
  validationUsedWasm.value = r.usedWasm
}

function currentManifestJson(): string {
  if (editMode.value === 'json') return manifestJsonText.value
  return JSON.stringify(manifestObj.value, null, 2) + '\n'
}

function currentSettingsJson(): string | null {
  if (editMode.value === 'json') return settingsJsonText.value
  return JSON.stringify(settingsObj.value, null, 2) + '\n'
}

function syncJsonFromForm() {
  manifestJsonText.value = JSON.stringify(manifestObj.value, null, 2) + '\n'
  settingsJsonText.value = JSON.stringify(settingsObj.value, null, 2) + '\n'
}

function trySyncFormFromJson(): string | null {
  try {
    manifestObj.value = JSON.parse(manifestJsonText.value) as Record<string, unknown>
  } catch (e) {
    return String(t('packEditor.rolePack.err.manifestJson', { msg: String(e) }))
  }
  try {
    settingsObj.value = JSON.parse(settingsJsonText.value) as Record<string, unknown>
  } catch (e) {
    return String(t('packEditor.rolePack.err.settingsJson', { msg: String(e) }))
  }
  return null
}

watch([manifestObj, settingsObj], () => scheduleValidate(), { deep: true })
watch([manifestJsonText, settingsJsonText], () => {
  if (editMode.value === 'json') scheduleValidate()
})

watch(editMode, (m) => {
  if (m === 'json') syncJsonFromForm()
  else {
    const err = trySyncFormFromJson()
    if (err) {
      statusMessage.value = err
      statusIsError.value = true
      editMode.value = 'json'
      return
    }
    statusMessage.value = ''
    void runValidate()
  }
})

async function onOpenPack() {
  statusMessage.value = ''
  if (!isTauriRuntime()) {
    statusMessage.value = String(t('packEditor.rolePack.err.needTauri'))
    statusIsError.value = true
    return
  }
  const picked = await open({ directory: true, multiple: false })
  if (picked === null) return
  const path = Array.isArray(picked) ? picked[0] : picked
  try {
    const load = await invokeLoadRolePackForEditor(path)
    roleDir.value = path
    mergedSceneIds.value = load.mergedSceneIds ?? []
    manifestJsonText.value = load.manifestText.endsWith('\n') ? load.manifestText : `${load.manifestText}\n`
    if (load.settingsText != null && load.settingsText !== '') {
      settingsJsonText.value = load.settingsText.endsWith('\n') ? load.settingsText : `${load.settingsText}\n`
    } else {
      settingsJsonText.value = `${JSON.stringify(defaultSettings(), null, 2)}\n`
    }
    configJsonText.value = load.configText?.endsWith('\n')
      ? load.configText
      : load.configText
        ? `${load.configText}\n`
        : '{\n  "reply_post_processor": {\n    "enabled": false,\n    "backend": "builtin",\n    "builtin": { "profile": "standard" }\n  }\n}\n'
    userIdentitiesIndexText.value = load.userIdentitiesIndexText?.endsWith('\n')
      ? load.userIdentitiesIndexText
      : load.userIdentitiesIndexText
        ? `${load.userIdentitiesIndexText}\n`
        : '{\n  "schema_version": 1,\n  "default_identity_id": "default",\n  "identities": []\n}\n'
    const formErr = trySyncFormFromJson()
    if (formErr) {
      editMode.value = 'json'
      statusMessage.value = formErr
      statusIsError.value = true
    } else {
      editMode.value = 'form'
      statusMessage.value = String(t('packEditor.rolePack.opened'))
      statusIsError.value = false
    }
    await runValidate()
  } catch (e) {
    statusMessage.value = e instanceof Error ? e.message : String(e)
    statusIsError.value = true
  }
}

async function onSave() {
  if (!roleDir.value) {
    statusMessage.value = String(t('packEditor.rolePack.err.noPack'))
    statusIsError.value = true
    return
  }
  if (editMode.value === 'json') {
    const err = trySyncFormFromJson()
    if (err) {
      statusMessage.value = err
      statusIsError.value = true
      return
    }
  } else {
    syncJsonFromForm()
  }
  await runValidate()
  if (validationErrors.value.length) {
    statusMessage.value = String(t('packEditor.rolePack.err.validationBlocks'))
    statusIsError.value = true
    return
  }
  try {
    await invokeSaveRolePackEditor(
      roleDir.value,
      currentManifestJson(),
      currentSettingsJson() ?? '{}',
      configJsonText.value,
      userIdentitiesIndexText.value,
    )
    statusMessage.value = String(t('packEditor.rolePack.saved'))
    statusIsError.value = false
  } catch (e) {
    statusMessage.value = e instanceof Error ? e.message : String(e)
    statusIsError.value = true
  }
}

function patchManifest(key: string, value: unknown) {
  manifestObj.value = { ...manifestObj.value, [key]: value }
}

function dimLabel(key: string): string {
  return String(t(`packEditor.rolePack.personality.dims.${key}`))
}
</script>

<template>
  <div class="role-pack-editor">
    <p class="lead">{{ t('packEditor.rolePack.lead') }}</p>
    <div class="toolbar">
      <button type="button" class="btn primary" @click="onOpenPack">{{ t('packEditor.rolePack.openDir') }}</button>
      <button type="button" class="btn" :disabled="!roleDir" @click="onSave">{{ t('packEditor.rolePack.save') }}</button>
      <div class="mode-toggle" role="group" :aria-label="String(t('packEditor.rolePack.modeAria'))">
        <button type="button" class="btn" :class="{ active: editMode === 'form' }" @click="editMode = 'form'">
          {{ t('packEditor.rolePack.modeForm') }}
        </button>
        <button type="button" class="btn" :class="{ active: editMode === 'json' }" @click="editMode = 'json'">
          {{ t('packEditor.rolePack.modeJson') }}
        </button>
      </div>
    </div>
    <p v-if="roleDir" class="path-line"><code>{{ roleDir }}</code></p>
    <div v-if="roleDir && editMode === 'form'" class="form-grid">
      <section class="card">
        <h3 class="h3">{{ t('packEditor.rolePack.manifestCard') }}</h3>
        <p class="summary">{{ summaryName }} · v{{ summaryVersion }} · {{ summaryAuthor }}</p>
        <label class="field"><span class="lbl">{{ t('packEditor.rolePack.fields.name') }}</span>
          <input
            class="inp"
            type="text"
            :value="String(manifestObj.name ?? '')"
            @input="patchManifest('name', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label class="field"><span class="lbl">{{ t('packEditor.rolePack.fields.version') }}</span>
          <input
            class="inp"
            type="text"
            :value="String(manifestObj.version ?? '')"
            @input="patchManifest('version', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label class="field"><span class="lbl">{{ t('packEditor.rolePack.fields.author') }}</span>
          <input
            class="inp"
            type="text"
            :value="String(manifestObj.author ?? '')"
            @input="patchManifest('author', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label class="field"><span class="lbl">{{ t('packEditor.rolePack.fields.description') }}</span>
          <input
            class="inp"
            type="text"
            :value="String(manifestObj.description ?? '')"
            @input="patchManifest('description', ($event.target as HTMLInputElement).value)"
          />
        </label>
        <label class="field"><span class="lbl">{{ t('packEditor.rolePack.fields.tags') }}</span>
          <input v-model="tagsString" class="inp" type="text" />
        </label>
        <label class="field"><span class="lbl">{{ t('packEditor.rolePack.fields.license') }}</span>
          <input v-model="licenseString" class="inp" type="text" />
        </label>
      </section>
      <section class="card">
        <h3 class="h3">{{ t('packEditor.rolePack.personality.title') }}</h3>
        <div v-for="(key, idx) in PERSONALITY_KEYS" :key="key" class="slider-row">
          <label class="slider-lbl">{{ dimLabel(key) }}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="ensureSevenPersonality(manifestObj)[idx]"
            @input="setPersonalityAt(idx, Number(($event.target as HTMLInputElement).value))"
          />
          <span class="num">{{ ensureSevenPersonality(manifestObj)[idx].toFixed(2) }}</span>
        </div>
      </section>
      <section class="card">
        <h3 class="h3">{{ t('packEditor.rolePack.settingsCard') }}</h3>
        <label class="field"><span class="lbl">{{ t('packEditor.rolePack.fields.interactionMode') }}</span>
          <select v-model="interactionMode" class="inp">
            <option value="">{{ t('packEditor.rolePack.fields.interactionUnset') }}</option>
            <option value="immersive">immersive</option>
            <option value="pure_chat">pure_chat</option>
          </select>
        </label>
        <div v-for="slot in PLUGIN_SLOTS" :key="slot" class="field">
          <span class="lbl">plugin_backends.{{ slot }}</span>
          <select class="inp" :value="pluginBackends[slot]" @change="setPluginSlot(slot, ($event.target as HTMLSelectElement).value)">
            <option v-for="opt in backendOptions[slot]" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <AnchorPresetManager v-model="replyAnchor" />
      </section>
      <section class="card">
        <h3 class="h3">{{ t('packEditor.rolePack.configCard') }}</h3>
        <p class="hint-sm">{{ t('packEditor.rolePack.configHint') }}</p>
        <textarea v-model="configJsonText" class="json-ta compact" spellcheck="false" rows="8" />
      </section>
      <section class="card">
        <h3 class="h3">{{ t('packEditor.rolePack.userIdentitiesCard') }}</h3>
        <p class="hint-sm">{{ t('packEditor.rolePack.userIdentitiesHint') }}</p>
        <textarea v-model="userIdentitiesIndexText" class="json-ta compact" spellcheck="false" rows="8" />
      </section>
    </div>
    <div v-else-if="roleDir && editMode === 'json'" class="json-split">
      <div class="json-pane">
        <h4 class="h4">{{ t('packEditor.rolePack.manifestCard') }}</h4>
        <textarea v-model="manifestJsonText" class="json-ta" spellcheck="false" />
      </div>
      <div class="json-pane">
        <h4 class="h4">{{ t('packEditor.rolePack.settingsCard') }}</h4>
        <textarea v-model="settingsJsonText" class="json-ta" spellcheck="false" />
      </div>
    </div>
    <p v-else class="hint">{{ t('packEditor.rolePack.pickHint') }}</p>

    <footer v-if="roleDir" class="footer" role="region" :aria-label="String(t('packEditor.rolePack.validationAria'))">
      <p v-if="validationUsedWasm !== null" class="wasm-line">
        {{ validationUsedWasm ? t('packEditor.check.lastRustWasm') : t('packEditor.check.lastTypeScript') }}
      </p>
      <p v-if="validationErrors.length === 0" class="ok">{{ t('packEditor.rolePack.validationOk') }}</p>
      <ul v-else class="err-list">
        <li v-for="(e, i) in validationErrors" :key="i">{{ e }}</li>
      </ul>
      <p v-if="statusMessage" class="status" :class="{ err: statusIsError }">{{ statusMessage }}</p>
    </footer>
  </div>
</template>

<style scoped>
.role-pack-editor {
  padding: 0.5rem 0 2rem;
  max-width: 960px;
}
.lead {
  margin-top: 0;
  opacity: 0.9;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.75rem;
}
.btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.14));
  background: var(--surface-2, rgba(255, 255, 255, 0.06));
  color: inherit;
  cursor: pointer;
}
.btn.primary {
  border-color: rgba(100, 180, 255, 0.5);
}
.btn.active {
  background: rgba(100, 180, 255, 0.2);
}
.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.mode-toggle {
  display: flex;
  gap: 0.25rem;
  margin-left: auto;
}
.path-line {
  font-size: 12px;
  word-break: break-all;
}
.form-grid {
  display: grid;
  gap: 1rem;
}
@media (min-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
  .form-grid .card:last-child {
    grid-column: 1 / -1;
  }
}
.card {
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.12));
  background: var(--surface-1, rgba(255, 255, 255, 0.04));
}
.h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}
.summary {
  margin: 0 0 0.75rem;
  font-size: 13px;
  opacity: 0.9;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-bottom: 0.5rem;
}
.lbl {
  font-size: 12px;
  opacity: 0.85;
}
.inp {
  font: inherit;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.14));
  background: var(--surface-2, rgba(255, 255, 255, 0.06));
  color: inherit;
}
.slider-row {
  display: grid;
  grid-template-columns: 1fr 5fr 48px;
  gap: 0.35rem;
  align-items: center;
  margin-bottom: 0.35rem;
}
.slider-lbl {
  font-size: 11px;
  opacity: 0.9;
}
.num {
  font-size: 11px;
  text-align: right;
}
.json-split {
  display: grid;
  gap: 1rem;
}
@media (min-width: 800px) {
  .json-split {
    grid-template-columns: 1fr 1fr;
  }
}
.h4 {
  margin: 0 0 0.35rem;
  font-size: 13px;
}
.json-ta {
  width: 100%;
  min-height: 320px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.14));
  background: rgba(0, 0, 0, 0.25);
  color: inherit;
}
.hint {
  opacity: 0.8;
}
.footer {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
}
.wasm-line {
  font-size: 12px;
  opacity: 0.85;
  margin: 0 0 0.35rem;
}
.ok {
  color: #7dffb3;
  margin: 0;
}
.err-list {
  margin: 0;
  padding-left: 1.2rem;
  color: #ffb4b4;
}
.status {
  margin: 0.5rem 0 0;
  font-size: 13px;
}
.status.err {
  color: #ffb4b4;
}
.hint-sm {
  font-size: 12px;
  opacity: 0.85;
  margin: 0 0 0.5rem;
}
.json-ta.compact {
  min-height: 120px;
  width: 100%;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.14));
  background: var(--surface-2, rgba(255, 255, 255, 0.06));
  color: inherit;
}
</style>
