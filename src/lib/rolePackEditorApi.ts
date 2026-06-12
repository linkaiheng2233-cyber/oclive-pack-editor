import { invoke } from '@tauri-apps/api/tauri'

export type RolePackListEntry = {
  roleId: string
  displayName: string
  absPath: string
  needsMigration: boolean
}

export type RolePackCatalogAssetPayload = {
  fileName: string
  base64: string
}

export type RolePackEditorLoadPayload = {
  manifestText: string
  settingsText?: string
  configText?: string
  portraitCatalogText?: string
  catalogAssets?: RolePackCatalogAssetPayload[]
  userIdentitiesIndexText?: string
  mergedSceneIds: string[]
}

/** Tauri 读盘 catalog / legacy assets → 与 zip 导入一致的 File[]。 */
export function catalogAssetsToFiles(assets: RolePackCatalogAssetPayload[]): File[] {
  return assets.map(({ fileName, base64 }) => {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const ext = fileName.split('.').pop()?.toLowerCase()
    const mime =
      ext === 'png'
        ? 'image/png'
        : ext === 'jpg' || ext === 'jpeg'
          ? 'image/jpeg'
          : ext === 'webp'
            ? 'image/webp'
            : 'application/octet-stream'
    return new File([bytes], fileName, { type: mime })
  })
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
