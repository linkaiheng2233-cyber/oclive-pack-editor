<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { isTauriRuntime } from '../../lib/exportFolder'

const props = defineProps<{
  rolesRootPath: string
  selectableRoles: { roleId: string; displayName: string; needsMigration: boolean }[]
  availableRoles: { roleId: string; displayName: string; needsMigration: boolean }[]
  selectedRoleId: string
  workspaceBusy: boolean
  workspaceMessage: string
  workspaceMessageIsError: boolean
  marketComposePaste: string
}>()

const selectedRoleId = defineModel<string>('selectedRoleId', { required: true })
const marketComposePaste = defineModel<string>('marketComposePaste', { required: true })

const emit = defineEmits<{
  pickRolesRoot: []
  scanRoles: []
  loadSelectedRole: []
  createNewPack: []
  importPack: [e: Event]
  applyMarketCompose: []
  goSimple: []
  goAdvanced: []
}>()

const { t } = useI18n()

const isTauri = computed(() => isTauriRuntime())

const roleSelectHint = computed(() => {
  if (!props.rolesRootPath.trim()) return String(t('packEditor.rolesWorkspace.hints.pickRoot'))
  if (!props.availableRoles.length) return String(t('packEditor.rolesWorkspace.hints.empty'))
  if (!props.selectableRoles.length) return String(t('packEditor.rolesWorkspace.hints.onlyLegacy'))
  return ''
})
</script>

<template>
  <div class="roles-workspace view-stack">
    <section class="rw-card" :aria-label="String(t('packEditor.rolesWorkspace.aria'))">
      <p class="section-kicker">{{ t('packEditor.rolesWorkspace.kicker') }}</p>
      <h2 class="rw-h2">{{ t('packEditor.rolesWorkspace.title') }}</h2>
      <p class="rw-lead">{{ t('packEditor.rolesWorkspace.lead') }}</p>

      <div v-if="!isTauri" class="rw-browser-note" role="status">
        {{ t('packEditor.rolesWorkspace.browserNote') }}
      </div>

      <div class="rw-row">
        <label class="rw-label">{{ t('packEditor.rolesWorkspace.rootLabel') }}</label>
        <div class="rw-root-bar">
          <code class="rw-path">{{ rolesRootPath || t('packEditor.rolesWorkspace.rootUnset') }}</code>
          <button type="button" class="rw-btn" :disabled="workspaceBusy || !isTauri" @click="emit('pickRolesRoot')">
            {{ rolesRootPath ? t('packEditor.rolesWorkspace.changeRoot') : t('packEditor.rolesWorkspace.pickRoot') }}
          </button>
        </div>
      </div>

      <div class="rw-row">
        <label class="rw-label" for="rw-role-select">{{ t('packEditor.rolesWorkspace.roleLabel') }}</label>
        <div class="rw-role-bar">
          <select
            id="rw-role-select"
            v-model="selectedRoleId"
            class="rw-select"
            :disabled="workspaceBusy || !selectableRoles.length"
          >
            <option value="">{{ t('packEditor.rolesWorkspace.rolePlaceholder') }}</option>
            <option v-for="r in selectableRoles" :key="r.roleId" :value="r.roleId">
              {{ r.displayName }} ({{ r.roleId }})
            </option>
          </select>
          <button
            type="button"
            class="rw-btn"
            :disabled="workspaceBusy || !rolesRootPath.trim() || !isTauri"
            @click="emit('scanRoles')"
          >
            {{ t('packEditor.rolesWorkspace.refresh') }}
          </button>
          <button
            type="button"
            class="rw-btn rw-btn--primary"
            :disabled="workspaceBusy || !selectedRoleId"
            @click="emit('loadSelectedRole')"
          >
            {{ t('packEditor.rolesWorkspace.openRole') }}
          </button>
        </div>
        <p v-if="roleSelectHint" class="rw-hint">{{ roleSelectHint }}</p>
      </div>

      <p
        v-if="workspaceMessage"
        class="rw-status"
        :class="{ 'rw-status--err': workspaceMessageIsError }"
        role="status"
      >
        {{ workspaceMessage }}
      </p>

      <div class="rw-secondary">
        <label class="rw-btn rw-btn--file">
          <input
            type="file"
            accept=".zip,.ocpak,application/zip"
            class="sr-only"
            @change="emit('importPack', $event)"
          />
          {{ t('packEditor.start.import.button') }}
        </label>
        <button type="button" class="rw-btn rw-btn--accent" @click="emit('createNewPack')">
          {{ t('packEditor.rolesWorkspace.createNew') }}
        </button>
      </div>
    </section>

    <details class="rw-details">
      <summary class="rw-details-sum">{{ t('packEditor.start.kickers.community') }}</summary>
      <section class="market-compose-wrap" :aria-label="String(t('packEditor.start.marketCompose.aria'))">
        <h2 class="mc-h2">{{ t('packEditor.start.marketCompose.title') }}</h2>
        <p class="mc-lead">{{ t('packEditor.start.marketCompose.lead') }}</p>
        <textarea
          v-model="marketComposePaste"
          class="mc-textarea"
          rows="8"
          spellcheck="false"
          :placeholder="String(t('packEditor.start.marketCompose.placeholder'))"
        />
        <div class="mc-actions">
          <button type="button" class="mc-btn primary" @click="emit('applyMarketCompose')">
            {{ t('packEditor.start.marketCompose.apply') }}
          </button>
        </div>
      </section>
    </details>

    <section class="quick-card" :aria-label="String(t('packEditor.start.quickNav.aria'))">
      <p class="section-kicker">{{ t('packEditor.start.kickers.modes') }}</p>
      <p class="quick-lead">
        {{ t('packEditor.start.quickNav.leadPrefix') }}
        <span class="quick-hint-ico" aria-hidden="true">?</span> {{ t('packEditor.start.quickNav.leadSuffix') }}
      </p>
      <div class="quick-actions">
        <button type="button" class="quick-tile" @click="emit('goSimple')">
          <span class="quick-tile-ico" aria-hidden="true">📝</span>
          <span class="quick-tile-title">{{ t('packEditor.start.quickNav.tiles.simple.title') }}</span>
          <span class="quick-tile-desc">{{ t('packEditor.start.quickNav.tiles.simple.desc') }}</span>
        </button>
        <button type="button" class="quick-tile" @click="emit('goAdvanced')">
          <span class="quick-tile-ico" aria-hidden="true">⚙️</span>
          <span class="quick-tile-title">{{ t('packEditor.start.quickNav.tiles.advanced.title') }}</span>
          <span class="quick-tile-desc">{{ t('packEditor.start.quickNav.tiles.advanced.desc') }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.rw-card {
  padding: 1.1rem 1.25rem 1.2rem;
  border-radius: var(--fluent-radius-lg);
  border: 1px solid var(--fluent-border-stroke);
  background: color-mix(in srgb, var(--fluent-bg-card) 88%, transparent);
  box-shadow: var(--fluent-shadow-card);
}

.rw-h2 {
  margin: 0 0 0.45rem;
  font-size: 1.05rem;
}

.rw-lead {
  margin: 0 0 1rem;
  font-size: 0.85rem;
  color: var(--fluent-text-secondary);
  line-height: 1.55;
}

.rw-browser-note {
  margin: 0 0 1rem;
  padding: 0.55rem 0.75rem;
  border-radius: var(--fluent-radius);
  background: color-mix(in srgb, var(--fluent-accent-subtle) 35%, transparent);
  font-size: 0.82rem;
  line-height: 1.45;
}

.rw-row {
  margin-bottom: 0.85rem;
}

.rw-label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--fluent-text-secondary);
}

.rw-root-bar,
.rw-role-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
}

.rw-path {
  flex: 1;
  min-width: min(100%, 12rem);
  padding: 0.4rem 0.55rem;
  border-radius: var(--fluent-radius);
  background: var(--fluent-bg-subtle);
  font-size: 0.75rem;
  word-break: break-all;
}

.rw-select {
  flex: 1;
  min-width: min(100%, 14rem);
  padding: 0.4rem 0.55rem;
  border-radius: var(--fluent-radius);
  border: 1px solid var(--pack-glass-border);
  background: var(--pack-glass-fill-strong);
  color: var(--fluent-text-primary);
  font-size: 0.8125rem;
}

.rw-btn {
  padding: 0.4rem 0.75rem;
  border-radius: var(--fluent-radius);
  border: 1px solid var(--pack-glass-border);
  background: var(--pack-glass-fill-strong);
  color: var(--fluent-text-primary);
  font-size: 0.78rem;
  cursor: pointer;
}

.rw-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.rw-btn--primary {
  background: var(--fluent-accent);
  border-color: var(--fluent-accent);
  color: #fff;
}

.rw-btn--accent {
  border-color: color-mix(in srgb, var(--rail-accent-editor) 40%, var(--pack-glass-border));
}

.rw-btn--file {
  cursor: pointer;
}

.rw-hint,
.rw-status {
  margin: 0.45rem 0 0;
  font-size: 0.78rem;
  color: var(--fluent-text-secondary);
}

.rw-status--err {
  color: var(--fluent-danger-text, #c62828);
}

.rw-secondary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--pack-glass-border);
}

.rw-details {
  margin-top: 0.75rem;
  padding: 0.65rem 0.85rem;
  border-radius: var(--fluent-radius-lg);
  border: 1px solid var(--fluent-border-stroke);
  background: color-mix(in srgb, var(--fluent-bg-card) 72%, transparent);
}

.rw-details-sum {
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--fluent-text-secondary);
}

.section-kicker {
  margin: 0 0 0.6rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--fluent-accent);
}

.mc-h2 {
  margin: 0 0 0.5rem;
  font-size: 1.05rem;
  font-weight: 600;
}

.mc-lead {
  margin: 0 0 0.85rem;
  font-size: 0.8125rem;
  color: var(--fluent-text-secondary);
  line-height: 1.55;
}

.mc-textarea {
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 0.65rem;
  padding: 0.6rem 0.75rem;
  font-size: 0.78rem;
  font-family: ui-monospace, monospace;
  border-radius: var(--fluent-radius);
  border: 1px solid var(--fluent-border-control);
  background: var(--fluent-bg-subtle);
  color: var(--fluent-text-primary);
  min-height: 140px;
}

.mc-btn.primary {
  padding: 0.5rem 1rem;
  border-radius: var(--fluent-radius);
  border: none;
  background: var(--fluent-accent);
  color: #fff;
  cursor: pointer;
  font-weight: 600;
}

.quick-card {
  margin-top: 1rem;
  padding: 1rem 1.15rem 1.2rem;
  border-radius: var(--fluent-radius-lg);
  border: 1px solid var(--fluent-border-stroke);
  background: color-mix(in srgb, var(--fluent-bg-card) 82%, transparent);
  box-shadow: var(--fluent-shadow-card);
}

.quick-lead {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: var(--fluent-text-secondary);
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 0.65rem;
}

.quick-tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.85rem 1rem;
  border-radius: var(--fluent-radius-lg);
  border: 1px solid var(--fluent-border-stroke);
  background: var(--pack-glass-fill-subtle);
  cursor: pointer;
  text-align: left;
}

.quick-tile-title {
  font-weight: 600;
  font-size: 0.9rem;
}

.quick-tile-desc {
  font-size: 0.78rem;
  color: var(--fluent-text-secondary);
}
</style>
