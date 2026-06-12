<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { isTauriRuntime } from '../../lib/exportFolder'
import type { PackDraftMeta } from '../../lib/draftStorage'

const props = defineProps<{
  rolesRootPath: string
  selectableRoles: { roleId: string; displayName: string; needsMigration: boolean }[]
  availableRoles: { roleId: string; displayName: string; needsMigration: boolean }[]
  selectedRoleId: string
  workspaceBusy: boolean
  workspaceMessage: string
  workspaceMessageIsError: boolean
  marketComposePaste: string
  draftMeta: PackDraftMeta | null
}>()

const selectedRoleId = defineModel<string>('selectedRoleId', { required: true })
const marketComposePaste = defineModel<string>('marketComposePaste', { required: true })

const emit = defineEmits<{
  pickRolesRoot: []
  scanRoles: []
  loadSelectedRole: []
  createNewPack: []
  continueDraft: []
  discardDraft: []
  importPack: [e: Event]
  applyMarketCompose: []
}>()

const { t } = useI18n()

const isTauri = computed(() => isTauriRuntime())

const roleSelectHint = computed(() => {
  if (!props.rolesRootPath.trim()) return String(t('packEditor.rolesWorkspace.hints.pickRoot'))
  if (!props.availableRoles.length) return String(t('packEditor.rolesWorkspace.hints.empty'))
  if (!props.selectableRoles.length) return String(t('packEditor.rolesWorkspace.hints.onlyLegacy'))
  return ''
})

function formatDraftTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}
</script>

<template>
  <div class="roles-workspace view-stack">
    <section class="rw-card rw-entry-card" :aria-label="String(t('packEditor.draft.aria'))">
      <p class="section-kicker">{{ t('packEditor.draft.kicker') }}</p>
      <h2 class="rw-h2">{{ t('packEditor.draft.title') }}</h2>
      <p class="rw-lead">{{ t('packEditor.draft.lead') }}</p>

      <div v-if="draftMeta" class="rw-draft-box">
        <div class="rw-draft-info">
          <span class="rw-draft-name">{{ draftMeta.roleName }}</span>
          <span class="rw-draft-meta">
            {{ draftMeta.roleId }} · {{ formatDraftTime(draftMeta.savedAt) }} ·
            {{ draftMeta.creationMode === 'simple' ? t('packEditor.nav.simple') : t('packEditor.nav.advanced') }}
          </span>
        </div>
        <div class="rw-draft-actions">
          <button type="button" class="rw-btn rw-btn--primary" @click="emit('continueDraft')">
            {{ t('packEditor.draft.continue') }}
          </button>
          <button type="button" class="rw-btn" @click="emit('discardDraft')">
            {{ t('packEditor.draft.discard') }}
          </button>
        </div>
      </div>
      <p v-else class="rw-hint rw-draft-empty">{{ t('packEditor.draft.empty') }}</p>

      <div class="rw-entry-actions">
        <button type="button" class="rw-btn rw-btn--accent rw-btn--wide" @click="emit('createNewPack')">
          {{ t('packEditor.draft.createNew') }}
        </button>
      </div>
      <p class="rw-hint rw-entry-note">{{ t('packEditor.draft.afterPick') }}</p>
    </section>

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

.rw-btn--wide {
  width: 100%;
  justify-content: center;
}

.rw-entry-card {
  margin-bottom: 0.75rem;
}

.rw-draft-box {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.85rem;
  padding: 0.65rem 0.75rem;
  border-radius: var(--fluent-radius);
  border: 1px solid var(--pack-glass-border);
  background: var(--pack-glass-fill-subtle);
}

.rw-draft-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: min(100%, 12rem);
}

.rw-draft-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.rw-draft-meta {
  font-size: 0.75rem;
  color: var(--fluent-text-secondary);
}

.rw-draft-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.rw-draft-empty {
  margin-bottom: 0.75rem;
}

.rw-entry-actions {
  margin-bottom: 0.45rem;
}

.rw-entry-note {
  margin-top: 0;
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
</style>
