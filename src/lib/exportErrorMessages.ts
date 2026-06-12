/** 导出前角色 ID 规则（与 roles/{id}/ 文件夹名、manifest.id 一致）。 */
const ROLE_ID_SAFE = /^[a-z][a-z0-9_-]*$/

export function validateRoleIdForExport(roleId: string): string | null {
  const id = roleId.trim()
  if (!id) {
    return '请填写「角色 ID」（简单创作 → 基础；对应 manifest.id）。导出时会作为文件夹名 roles/{id}/。'
  }
  if (id.startsWith('.')) {
    return '角色 ID 不能以「.」开头。请改用英文小写与下划线，例如 my_character。'
  }
  if (/[\s/\\]/.test(id)) {
    return '角色 ID 不能包含空格或斜杠。请改用英文小写字母、数字与下划线（例如 my_character）。'
  }
  if (/[\u4e00-\u9fff]/.test(id)) {
    return '角色 ID 请用英文（显示名称才填中文）。例如 id 填 my_girl，显示名填「小美」。'
  }
  if (!ROLE_ID_SAFE.test(id)) {
    return (
      `角色 ID「${id}」含不建议的字符。请只用英文小写字母、数字、下划线，且以字母开头` +
      '（例如 mumu、my_role）。这将作为导出文件夹名。'
    )
  }
  return null
}

/** 将 Tauri / 校验 crate 的原始报错改写成面向创作者的说明。 */
export function humanizeExportValidateError(line: string, roleId?: string): string {
  const raw = line.trim()
  if (!raw) return raw

  if (/missing required key `req`|missing field `role_id`|invalid args.*validate_role_pack_export/i.test(raw)) {
    return '编写器与桌面壳通信异常（导出参数未对齐）。请重启编写器；若仍出现，请更新到最新版并反馈。'
  }
  if (/invalid args|missing field|missing required key/i.test(raw)) {
    return '编写器内部调用异常。请重启应用后重试；若仍失败，请更新编写器版本。'
  }

  const pathPrefix = raw.match(/导出校验路径须以 (.+?) 开头：(.+)/)
  if (pathPrefix) {
    const expected = pathPrefix[1]!
    const bad = pathPrefix[2]!
    return (
      `导出文件路径与角色 ID 不一致：路径应以「${expected}/」开头，但发现「${bad}」。` +
      `请确认「角色 ID」为 ${expected}，且未在高级 JSON 里改成别的 id。`
    )
  }

  if (raw.includes('非法导出路径')) {
    return `${raw}。请检查 manifest.id 与导出目录名是否一致，且路径中不要含 ..。`
  }

  if (raw.includes('role_id 不能为空') || raw.includes('字段 id 不能为空')) {
    return validateRoleIdForExport('') ?? raw
  }

  if (raw.includes('字段 name 不能为空')) {
    return '请填写「显示名称」（简单创作 → 基础；对应 manifest.name）。'
  }

  if (/portrait_catalog：id「(.+?)」缺少 path/.test(raw)) {
    const m = raw.match(/id「(.+?)」/)
    const id = m?.[1] ?? '某条目'
    return `情绪立绘「${id}」还未选择图片。请在「情绪立绘」里补全，或删除未完成的额外表情后再导出。`
  }

  if (raw.includes('portrait_catalog：重复 id')) {
    return `${raw}。请检查额外情绪是否重复添加了同一组「情绪 + 程度」。`
  }

  if (raw.includes('manifest 解析失败') || raw.includes('settings 解析失败')) {
    return `JSON 格式有误：${raw}。可到「高级」页检查 manifest / settings 是否多了逗号或括号。`
  }

  if (raw.includes('default_relation') && raw.includes('user_relations')) {
    return `${raw}。请在简单/高级人设里检查默认关系是否与「用户身份」列表一致。`
  }

  if (roleId && raw.includes(roleId) && raw.includes('路径')) {
    return raw
  }

  if (raw.startsWith('角色包 manifest') || raw.startsWith('角色包 settings')) {
    return `${raw}（可在顶栏「检查角色包」查看完整列表）`
  }

  return raw
}

export function humanizeExportValidateErrors(lines: string[], roleId?: string): string[] {
  return lines.map((l) => humanizeExportValidateError(l, roleId)).filter(Boolean)
}

export function formatExportDirectoryBlockedMessage(errors: string[]): string {
  if (errors.length === 0) {
    return '导出前目录校验未通过，但未返回具体原因。请运行顶栏「检查角色包」后重试。'
  }
  if (errors.length === 1) {
    return `导出前校验未通过：${errors[0]}`
  }
  return `导出前校验未通过（共 ${errors.length} 项）：\n${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`
}

export function duplicateRoleFolderConfirmMessage(roleId: string): string {
  return (
    `roles 目录下已有文件夹「${roleId}/」。\n\n` +
    `继续导出将覆盖其中的角色包文件。\n` +
    `若想保留旧版、另存为新角色，请先在「简单创作 → 基础」修改「角色 ID」后再导出。\n\n` +
    `确定 = 覆盖写入\n取消 = 暂不导出`
  )
}
