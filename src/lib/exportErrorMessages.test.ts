import { describe, expect, it } from 'vitest'
import {
  duplicateRoleFolderConfirmMessage,
  formatExportDirectoryBlockedMessage,
  humanizeExportValidateError,
  validateRoleIdForExport,
} from './exportErrorMessages'

describe('exportErrorMessages', () => {
  it('validateRoleIdForExport rejects empty and chinese id', () => {
    expect(validateRoleIdForExport('')).toContain('角色 ID')
    expect(validateRoleIdForExport('小美')).toContain('英文')
    expect(validateRoleIdForExport('my role')).toContain('空格')
  })

  it('validateRoleIdForExport accepts safe ids', () => {
    expect(validateRoleIdForExport('mumu')).toBeNull()
    expect(validateRoleIdForExport('my_role_2')).toBeNull()
  })

  it('humanizeExportValidateError maps ipc and portrait errors', () => {
    expect(
      humanizeExportValidateError(
        "invalid args `req` for command `validate_role_pack_export`: missing field `role_id`",
      ),
    ).toContain('通信异常')
    expect(
      humanizeExportValidateError('portrait_catalog：id「neutral_mild」缺少 path'),
    ).toContain('neutral_mild')
    expect(
      humanizeExportValidateError('导出校验路径须以 demo/ 开头：other/manifest.json'),
    ).toContain('demo')
  })

  it('formatExportDirectoryBlockedMessage numbers multiple issues', () => {
    const msg = formatExportDirectoryBlockedMessage(['问题 A', '问题 B'])
    expect(msg).toContain('共 2 项')
    expect(msg).toContain('1. 问题 A')
  })

  it('duplicateRoleFolderConfirmMessage mentions role id', () => {
    expect(duplicateRoleFolderConfirmMessage('mumu')).toContain('mumu/')
  })
})
