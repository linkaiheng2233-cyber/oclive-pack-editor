import { describe, expect, it, vi, beforeEach } from 'vitest'
import { invokeLoadRolePackForEditor, invokeSaveRolePackEditor } from './rolePackEditorApi'

vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}))

import { invoke } from '@tauri-apps/api/tauri'

describe('rolePackEditorApi (T05 tauri invoke mapping)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('load uses snake_case role_dir payload', async () => {
    vi.mocked(invoke).mockResolvedValueOnce({
      manifestText: '{}',
      settingsText: '{}',
      mergedSceneIds: [],
    })
    await invokeLoadRolePackForEditor('C:\\roles\\demo')
    expect(invoke).toHaveBeenCalledWith('load_role_pack_for_editor', {
      role_dir: 'C:\\roles\\demo',
    })
  })

  it('save forwards manifest and settings text', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined)
    await invokeSaveRolePackEditor('C:\\roles\\demo', '{"id":"x"}', '{"schema_version":1}')
    expect(invoke).toHaveBeenCalledWith('save_role_pack_editor', {
      role_dir: 'C:\\roles\\demo',
      manifest_text: '{"id":"x"}',
      settings_text: '{"schema_version":1}',
      config_text: null,
      user_identities_index_text: null,
    })
  })
})
