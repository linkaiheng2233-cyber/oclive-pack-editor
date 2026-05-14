import { invoke } from '@tauri-apps/api/tauri'

export type RolePackEditorLoadPayload = {
  manifestText: string
  settingsText?: string
  mergedSceneIds: string[]
}

export async function invokeLoadRolePackForEditor(roleDir: string): Promise<RolePackEditorLoadPayload> {
  return invoke<RolePackEditorLoadPayload>('load_role_pack_for_editor', { role_dir: roleDir })
}

export async function invokeSaveRolePackEditor(
  roleDir: string,
  manifestText: string,
  settingsText: string,
): Promise<void> {
  await invoke('save_role_pack_editor', {
    role_dir: roleDir,
    manifest_text: manifestText,
    settings_text: settingsText,
  })
}
