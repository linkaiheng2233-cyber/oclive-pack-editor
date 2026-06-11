import { invoke } from '@tauri-apps/api/tauri'

export type RolePackListEntry = {
  roleId: string
  displayName: string
  absPath: string
  needsMigration: boolean
}

export type RolePackEditorLoadPayload = {
  manifestText: string
  settingsText?: string
  configText?: string
  userIdentitiesIndexText?: string
  mergedSceneIds: string[]
}

export async function invokeListRolePacksUnderRolesRoot(
  rolesRoot: string,
): Promise<RolePackListEntry[]> {
  return invoke<RolePackListEntry[]>('list_role_packs_under_roles_root', { rolesRoot })
}

export async function invokeLoadRolePackForEditor(roleDir: string): Promise<RolePackEditorLoadPayload> {
  return invoke<RolePackEditorLoadPayload>('load_role_pack_for_editor', { roleDir })
}

export async function invokeSaveRolePackEditor(
  roleDir: string,
  manifestText: string,
  settingsText: string,
  configText?: string | null,
  userIdentitiesIndexText?: string | null,
): Promise<void> {
  await invoke('save_role_pack_editor', {
    roleDir,
    manifestText,
    settingsText,
    configText: configText ?? null,
    userIdentitiesIndexText: userIdentitiesIndexText ?? null,
  })
}
