import { invoke } from '@tauri-apps/api/tauri'
import type { DirectoryPluginInfo } from '../types/plugin'

export async function listDirectoryPluginsForRolesRoot(
  rolesRoot: string | null,
): Promise<DirectoryPluginInfo[]> {
  return invoke<DirectoryPluginInfo[]>('list_directory_plugins_for_roles_root', {
    roles_root: rolesRoot,
  })
}
