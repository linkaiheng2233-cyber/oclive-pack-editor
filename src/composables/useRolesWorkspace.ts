import { computed, onMounted, ref } from 'vue'
import { open } from '@tauri-apps/api/dialog'
import { invoke } from '@tauri-apps/api/tauri'
import {
  applyLoadedPackToEditor,
  blueprintHasEditorExtensions,
  type ApplyLoadedPackTargets,
} from '../lib/applyLoadedPackToEditor'
import { isTauriRuntime } from '../lib/exportFolder'
import {
  invokeListRolePacksUnderRolesRoot,
  invokeLoadRolePackForEditor,
  type RolePackListEntry,
} from '../lib/rolePackEditorApi'
import { parseJson } from '../lib/packChecks'
import {
  DEFAULT_CORE_PERSONALITY_TEXT,
  DEFAULT_MANIFEST_JSON,
  DEFAULT_SETTINGS_JSON,
} from '../defaults'
import { emptyAuthorRecRow } from '../lib/authorPack'

const ROLES_ROOT_KEY = 'oclive-pack-editor-roles-root'
const LEGACY_LAST_ROLES_ROOT_KEY = 'oclive-pack-editor-last-roles-root'

export type PackSession = 'idle' | 'new' | 'loaded'

function readStoredRolesRoot(): string {
  try {
    const primary = localStorage.getItem(ROLES_ROOT_KEY)
    if (primary?.trim()) return primary.trim()
    const legacy = localStorage.getItem(LEGACY_LAST_ROLES_ROOT_KEY)
    if (legacy?.trim()) return legacy.trim()
  } catch {
    /* ignore */
  }
  return ''
}

function persistRolesRoot(path: string): void {
  const trimmed = path.trim()
  if (!trimmed) return
  try {
    localStorage.setItem(ROLES_ROOT_KEY, trimmed)
    localStorage.setItem(LEGACY_LAST_ROLES_ROOT_KEY, trimmed)
  } catch {
    /* ignore */
  }
}

async function guessDefaultRolesRoot(): Promise<string | null> {
  if (!isTauriRuntime()) return null
  try {
    return await invoke<string | null>('guess_default_roles_root')
  } catch {
    return null
  }
}

async function readOptionalText(path: string): Promise<string> {
  if (!isTauriRuntime()) return ''
  try {
    return await invoke<string>('read_text_file', { path })
  } catch {
    return ''
  }
}

export function useRolesWorkspace(applyTargets: ApplyLoadedPackTargets) {
  const rolesRootPath = ref('')
  const availableRoles = ref<RolePackListEntry[]>([])
  const selectedRoleId = ref('')
  const packSession = ref<PackSession>('idle')
  const loadedRoleDir = ref('')
  const loadedRoleName = ref('')
  const loadedRoleId = ref('')
  const workspaceBusy = ref(false)
  const workspaceMessage = ref('')
  const workspaceMessageIsError = ref(false)

  const selectedRole = computed(() =>
    availableRoles.value.find((r) => r.roleId === selectedRoleId.value),
  )

  const selectableRoles = computed(() => availableRoles.value.filter((r) => !r.needsMigration))

  function setWorkspaceFeedback(text: string, isError: boolean): void {
    workspaceMessage.value = text
    workspaceMessageIsError.value = isError
  }

  async function scanRoles(): Promise<void> {
    const root = rolesRootPath.value.trim()
    if (!root) {
      availableRoles.value = []
      return
    }
    if (!isTauriRuntime()) {
      setWorkspaceFeedback('浏览器版请使用桌面版绑定 roles 目录。', true)
      return
    }
    workspaceBusy.value = true
    setWorkspaceFeedback('', false)
    try {
      availableRoles.value = await invokeListRolePacksUnderRolesRoot(root)
      if (
        selectedRoleId.value &&
        !availableRoles.value.some((r) => r.roleId === selectedRoleId.value)
      ) {
        selectedRoleId.value = ''
      }
      if (!selectedRoleId.value && selectableRoles.value.length === 1) {
        selectedRoleId.value = selectableRoles.value[0]!.roleId
      }
    } catch (e) {
      setWorkspaceFeedback(e instanceof Error ? e.message : String(e), true)
    } finally {
      workspaceBusy.value = false
    }
  }

  async function pickRolesRoot(): Promise<void> {
    if (!isTauriRuntime()) {
      setWorkspaceFeedback('绑定 roles 目录需要桌面版 Tauri。', true)
      return
    }
    const picked = await open({ directory: true, multiple: false })
    if (picked === null) return
    const path = Array.isArray(picked) ? picked[0]! : picked
    rolesRootPath.value = path
    persistRolesRoot(path)
    await scanRoles()
  }

  function resetToNewPack(): void {
    applyTargets.manifestText.value = DEFAULT_MANIFEST_JSON
    applyTargets.settingsText.value = DEFAULT_SETTINGS_JSON
    applyTargets.corePersonalityText.value = DEFAULT_CORE_PERSONALITY_TEXT
    applyTargets.worldviewMarkdown.value = ''
    applyTargets.knowledgeMarkdownFiles.value = []
    applyTargets.emotionImageFiles.value = []
    applyTargets.creatorMessageToOthers.value = ''
    applyTargets.authorSummary.value = ''
    applyTargets.authorDetailMarkdown.value = ''
    applyTargets.authorRecommendedRows.value = [emptyAuthorRecRow()]
    applyTargets.authorIncludeSuggestedUi.value = false
    applyTargets.authorSuggestedBackendsJson.value = ''
    packSession.value = 'new'
    loadedRoleDir.value = ''
    loadedRoleName.value = ''
    loadedRoleId.value = ''
    applyTargets.syncFormsFromJson()
    setWorkspaceFeedback('', false)
  }

  async function loadSelectedRole(): Promise<{ ok: boolean; displayName?: string }> {
    const role = selectedRole.value
    if (!role) {
      setWorkspaceFeedback('请先选择角色包。', true)
      return { ok: false }
    }
    if (role.needsMigration) {
      setWorkspaceFeedback('该目录为 legacy manifest.json，请先用 oclive pack migrate-to-blueprint 迁移。', true)
      return { ok: false }
    }
    workspaceBusy.value = true
    setWorkspaceFeedback('', false)
    try {
      const load = await invokeLoadRolePackForEditor(role.absPath)
      const manifestJson = load.manifestText.endsWith('\n')
        ? load.manifestText
        : `${load.manifestText}\n`
      const settingsJson =
        load.settingsText != null && load.settingsText !== ''
          ? load.settingsText.endsWith('\n')
            ? load.settingsText
            : `${load.settingsText}\n`
          : applyTargets.settingsText.value

      const corePersonality = await readOptionalText(`${role.absPath}/core_personality.txt`)
      const creatorMessage = await readOptionalText(`${role.absPath}/creator_message.txt`)
      const uiJson = await readOptionalText(`${role.absPath}/ui.json`)
      const authorJson = await readOptionalText(`${role.absPath}/author.json`)
      const blueprintRaw = await readOptionalText(`${role.absPath}/pipeline.ocblueprint`)

      applyLoadedPackToEditor(
        {
          roleId: role.roleId,
          manifestJson,
          settingsJson,
          corePersonality,
          creatorMessage: creatorMessage.replace(/\r\n/g, '\n').replace(/\n+$/, ''),
          uiJson,
          authorJson,
        },
        applyTargets,
      )

      packSession.value = 'loaded'
      loadedRoleDir.value = role.absPath
      loadedRoleId.value = role.roleId
      loadedRoleName.value = role.displayName

      if (blueprintRaw.trim() && blueprintHasEditorExtensions(blueprintRaw)) {
        setWorkspaceFeedback(
          `已加载「${role.displayName}」。包内 includes/groups 等扩展字段导出 rebuild 时可能被覆盖，请在 Chat Pro 架构图编辑。`,
          false,
        )
      } else {
        setWorkspaceFeedback(`已加载「${role.displayName}」，请到简单或高级编辑。`, false)
      }
      return { ok: true, displayName: role.displayName }
    } catch (e) {
      setWorkspaceFeedback(e instanceof Error ? e.message : String(e), true)
      return { ok: false }
    } finally {
      workspaceBusy.value = false
    }
  }

  onMounted(async () => {
    const stored = readStoredRolesRoot()
    if (stored) {
      rolesRootPath.value = stored
    } else if (isTauriRuntime()) {
      const guessed = await guessDefaultRolesRoot()
      if (guessed) {
        rolesRootPath.value = guessed
        persistRolesRoot(guessed)
      }
    }
    if (rolesRootPath.value && isTauriRuntime()) {
      await scanRoles()
    }
  })

  return {
    rolesRootPath,
    availableRoles,
    selectableRoles,
    selectedRoleId,
    packSession,
    loadedRoleDir,
    loadedRoleName,
    loadedRoleId,
    workspaceBusy,
    workspaceMessage,
    workspaceMessageIsError,
    pickRolesRoot,
    scanRoles,
    loadSelectedRole,
    resetToNewPack,
    setWorkspaceFeedback,
  }
}

export function parseRoleIdFromManifest(manifestText: string): string {
  const m = parseJson<Record<string, unknown>>(manifestText, 'manifest.json')
  if (!m.ok) return ''
  const id = m.value.id
  return typeof id === 'string' ? id.trim() : ''
}
