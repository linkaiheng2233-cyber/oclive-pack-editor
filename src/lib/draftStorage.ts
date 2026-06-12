import type { CreatorMessageExportMode } from './rolePackCreatorMessage'
import type { AuthorRecRow } from './authorPack'
import type { KnowledgeMarkdownFile } from './knowledgeFiles'
import type { UiConfig } from '../types/uiConfig'
import { parseJson } from './packChecks'

export const DRAFT_STORAGE_KEY = 'oclive-pack-editor-draft-v1'

export type PackDraftSnapshot = {
  version: 1
  savedAt: string
  creationMode: 'simple' | 'advanced'
  advancedTab: 'manifest' | 'settings' | 'core' | 'world' | 'images'
  manifestText: string
  settingsText: string
  corePersonalityText: string
  worldviewMarkdown: string
  knowledgeMarkdownFiles: KnowledgeMarkdownFile[]
  creatorMessageToOthers: string
  creatorMessageMode: CreatorMessageExportMode
  creatorMessageToDownloaderManifest: string
  authorSummary: string
  authorDetailMarkdown: string
  authorRecommendedRows: AuthorRecRow[]
  authorIncludeSuggestedUi: boolean
  authorSuggestedBackendsJson: string
  uiConfig: UiConfig
}

export type PackDraftMeta = {
  roleId: string
  roleName: string
  savedAt: string
  creationMode: 'simple' | 'advanced'
}

export function draftMetaFromSnapshot(snapshot: PackDraftSnapshot): PackDraftMeta {
  const m = parseJson<Record<string, unknown>>(snapshot.manifestText, 'manifest.json')
  const roleId = m.ok && typeof m.value.id === 'string' ? m.value.id.trim() : 'my_role_id'
  const roleName =
    m.ok && typeof m.value.name === 'string' && m.value.name.trim()
      ? m.value.name.trim()
      : roleId
  return {
    roleId,
    roleName,
    savedAt: snapshot.savedAt,
    creationMode: snapshot.creationMode,
  }
}

export function readDraftSnapshot(): PackDraftSnapshot | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw?.trim()) return null
    const parsed = JSON.parse(raw) as PackDraftSnapshot
    if (parsed?.version !== 1) return null
    if (typeof parsed.manifestText !== 'string' || typeof parsed.settingsText !== 'string') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function readDraftMeta(): PackDraftMeta | null {
  const snapshot = readDraftSnapshot()
  return snapshot ? draftMetaFromSnapshot(snapshot) : null
}

export function saveDraftSnapshot(snapshot: PackDraftSnapshot): void {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(snapshot))
}

export function clearDraftSnapshot(): void {
  localStorage.removeItem(DRAFT_STORAGE_KEY)
}

export function hasDraftSnapshot(): boolean {
  return readDraftSnapshot() != null
}
