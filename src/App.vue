<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { DEFAULT_MANIFEST_JSON, DEFAULT_SETTINGS_JSON } from './defaults'
import {
  buildRolePackZipBlob,
  suggestedZipName,
  triggerDownload,
} from './lib/exportPack'
import { pickRolesRootAndWritePack, isFolderExportSupported } from './lib/exportFolder'
import { parseJson, runAllPackChecks } from './lib/packChecks'

const STORAGE_REQUIRE_CHECKS = 'oclive-pack-editor-require-checks-before-export'

const manifestText = ref(DEFAULT_MANIFEST_JSON)
const settingsText = ref(DEFAULT_SETTINGS_JSON)
const validationErrors = ref<string[]>([])
const lastMessage = ref('')
const requireChecksBeforeExport = ref(true)

onMounted(() => {
  try {
    const v = localStorage.getItem(STORAGE_REQUIRE_CHECKS)
    if (v === 'false') requireChecksBeforeExport.value = false
  } catch {
    /* ignore */
  }
})

function persistRequireChecks(): void {
  try {
    localStorage.setItem(STORAGE_REQUIRE_CHECKS, requireChecksBeforeExport.value ? 'true' : 'false')
  } catch {
    /* ignore */
  }
}

const folderExportOk = computed(() => isFolderExportSupported())

function runValidate(): void {
  const r = runAllPackChecks(manifestText.value, settingsText.value)
  validationErrors.value = r.errors
}

function checksPassForExport(): boolean {
  if (!requireChecksBeforeExport.value) return true
  const r = runAllPackChecks(manifestText.value, settingsText.value)
  validationErrors.value = r.errors
  return r.ok
}

function manifestObject(): Record<string, unknown> | null {
  const m = parseJson<Record<string, unknown>>(manifestText.value, 'manifest')
  return m.ok ? m.value : null
}

function settingsObject(): Record<string, unknown> | null {
  const s = parseJson<Record<string, unknown>>(settingsText.value, 'settings')
  return s.ok ? s.value : null
}

async function exportZip(ocpak: boolean) {
  lastMessage.value = ''
  if (!checksPassForExport()) {
    lastMessage.value = '请先通过全部检查或关闭「导出前必须通过全部检查」后再导出。'
    return
  }
  const manifest = manifestObject()
  const settings = settingsObject()
  if (!manifest || !settings) return
  const roleId = String(manifest.id ?? '').trim()
  if (!roleId) {
    lastMessage.value = 'manifest.id 为空'
    return
  }
  const blob = await buildRolePackZipBlob(roleId, manifest, settings)
  triggerDownload(blob, suggestedZipName(roleId, ocpak))
  lastMessage.value = `已下载 ${suggestedZipName(roleId, ocpak)}。解压后使文件夹内出现「${roleId}/manifest.json」，将**含该文件夹的父目录**设为 OCLIVE_ROLES_DIR（父目录即为 roles 根）。`
}

async function exportFolder() {
  lastMessage.value = ''
  if (!checksPassForExport()) {
    lastMessage.value = '请先通过全部检查或关闭「导出前必须通过全部检查」后再导出。'
    return
  }
  const manifest = manifestObject()
  const settings = settingsObject()
  if (!manifest || !settings) return
  const roleId = String(manifest.id ?? '').trim()
  if (!roleId) {
    lastMessage.value = 'manifest.id 为空'
    return
  }
  try {
    const wrote = await pickRolesRootAndWritePack(roleId, manifest, settings)
    if (!wrote) return
    lastMessage.value = `已写入 ${roleId}/ 到所选目录。请将该目录作为 OCLIVE_ROLES_DIR（roles 根）。`
  } catch (e) {
    lastMessage.value = `写入失败：${e instanceof Error ? e.message : String(e)}`
  }
}
</script>

<template>
  <div class="app">
    <header class="hdr">
      <h1>oclive 角色包编写器</h1>
      <p class="sub">
        独立工具，仅产出与运行时兼容的目录树；契约原文见 oclivenewnew 仓库
        <code>creator-docs/</code> 与 <code>roles/README_MANIFEST.md</code>。
      </p>
    </header>

    <section class="panel checks">
      <h2>角色包检查</h2>
      <p class="check-desc">
        聚合 JSON 解析、<code>validateEditorPack</code> 与场景键 / topic_weights 一致性。
      </p>
      <div class="check-row">
        <button type="button" @click="runValidate">运行全部检查</button>
        <label class="chk">
          <input
            v-model="requireChecksBeforeExport"
            type="checkbox"
            @change="persistRequireChecks"
          />
          导出前必须通过全部检查
        </label>
      </div>
    </section>

    <section class="grid">
      <div class="panel">
        <h2>manifest.json</h2>
        <textarea v-model="manifestText" spellcheck="false" class="ta" aria-label="manifest.json" />
      </div>
      <div class="panel">
        <h2>settings.json</h2>
        <textarea v-model="settingsText" spellcheck="false" class="ta" aria-label="settings.json" />
      </div>
    </section>

    <div class="actions">
      <button type="button" @click="exportZip(true)">导出 .ocpak（zip）</button>
      <button type="button" @click="exportZip(false)">导出 .zip</button>
      <button
        v-if="folderExportOk"
        type="button"
        class="secondary"
        @click="exportFolder"
      >
        写入文件夹（roles 根）
      </button>
    </div>

    <div v-if="validationErrors.length" class="errors" role="alert">
      <strong>检查结果</strong>
      <ul>
        <li v-for="(e, i) in validationErrors" :key="i">{{ e }}</li>
      </ul>
    </div>
    <p v-else class="hint muted">点击「运行全部检查」查看错误列表；无错误时此处为空。</p>

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
.checks {
  margin-top: 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fafafa;
}
.checks h2 {
  font-size: 1rem;
  margin: 0 0 0.35rem;
}
.check-desc {
  margin: 0 0 0.65rem;
  font-size: 0.88rem;
  color: #555;
  line-height: 1.45;
}
.check-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1rem;
}
.chk {
  font-size: 0.88rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  user-select: none;
}
.grid {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}
@media (min-width: 800px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }
}
.panel h2 {
  font-size: 0.95rem;
  margin: 0 0 0.35rem;
}
.ta {
  width: 100%;
  min-height: 280px;
  padding: 0.6rem 0.65rem;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  line-height: 1.4;
  border: 1px solid #ccc;
  border-radius: 6px;
  resize: vertical;
  box-sizing: border-box;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.85rem;
  align-items: center;
}
button {
  padding: 0.45rem 0.85rem;
  border-radius: 6px;
  border: 1px solid #333;
  background: #1a1a1a;
  color: #fff;
  cursor: pointer;
  font-size: 0.9rem;
}
button.secondary {
  background: #fff;
  color: #1a1a1a;
}
button:hover {
  opacity: 0.92;
}
.errors {
  margin-top: 0.85rem;
  padding: 0.65rem 0.85rem;
  background: #fff4f4;
  border: 1px solid #e8a0a0;
  border-radius: 6px;
  font-size: 0.88rem;
}
.errors ul {
  margin: 0.35rem 0 0 1.1rem;
  padding: 0;
}
.hint.muted {
  color: #666;
  font-size: 0.88rem;
  margin-top: 0.65rem;
}
.okmsg {
  margin-top: 0.75rem;
  font-size: 0.88rem;
  color: #1a6b2c;
  line-height: 1.45;
}
</style>
