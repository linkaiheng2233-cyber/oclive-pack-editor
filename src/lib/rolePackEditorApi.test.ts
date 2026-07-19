import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  catalogAssetsToFiles,
  invokeLoadRolePackForEditor,
  invokeListRolePacksUnderRolesRoot,
  invokeSaveRolePackEditor,
} from './rolePackEditorApi'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

import { invoke } from '@tauri-apps/api/core'

describe('rolePackEditorApi (T05 tauri invoke mapping)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('load uses camelCase roleDir payload', async () => {
    vi.mocked(invoke).mockResolvedValueOnce({
      manifestText: '{}',
      settingsText: '{}',
      mergedSceneIds: [],
    })
    await invokeLoadRolePackForEditor('C:\\roles\\demo')
    expect(invoke).toHaveBeenCalledWith('load_role_pack_for_editor', {
      roleDir: 'C:\\roles\\demo',
    })
  })

  it('list uses camelCase rolesRoot payload', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([])
    await invokeListRolePacksUnderRolesRoot('C:\\roles')
    expect(invoke).toHaveBeenCalledWith('list_role_packs_under_roles_root', {
      rolesRoot: 'C:\\roles',
    })
  })

  it('save forwards manifest and settings text', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined)
    await invokeSaveRolePackEditor('C:\\roles\\demo', '{"id":"x"}', '{"schema_version":1}')
    expect(invoke).toHaveBeenCalledWith('save_role_pack_editor', {
      roleDir: 'C:\\roles\\demo',
      manifestText: '{"id":"x"}',
      settingsText: '{"schema_version":1}',
      configText: null,
      userIdentitiesIndexText: null,
    })
  })

  it('catalogAssetsToFiles decodes base64 payloads', () => {
    const png = btoa('\x89PNG')
    const files = catalogAssetsToFiles([{ fileName: 'happy.png', base64: png }])
    expect(files).toHaveLength(1)
    expect(files[0]?.name).toBe('happy.png')
    expect(files[0]?.type).toBe('image/png')
  })
})
