import type { RolePackTextFile } from './exportPack'

export function normalizeUserIdentityTemplatePath(path: string): string | null {
  const rel = path.replace(/\\/g, '/').replace(/^\/+/, '').trim()
  if (!/^user_identities\/(?:[^/]+\/)*[^/]+\.md$/.test(rel)) return null
  const parts = rel.split('/')
  return parts.some((part) => !part || part === '.' || part === '..') ? null : rel
}

export function validateUserIdentityBundle(
  indexJson: string,
  files: RolePackTextFile[],
): string[] {
  const errors: string[] = []
  const paths = new Set<string>()
  for (const file of files) {
    const path = normalizeUserIdentityTemplatePath(file.path)
    if (!path) {
      errors.push(`用户身份模板路径不安全或格式错误：「${file.path}」`)
      continue
    }
    if (paths.has(path)) errors.push(`用户身份模板路径重复：「${path}」`)
    paths.add(path)
  }

  if (!indexJson.trim()) return errors
  let root: unknown
  try {
    root = JSON.parse(indexJson)
  } catch (error) {
    errors.push(`user_identities/index.json 解析失败: ${error instanceof Error ? error.message : String(error)}`)
    return errors
  }
  if (root == null || typeof root !== 'object' || Array.isArray(root)) {
    errors.push('user_identities/index.json 顶层须为对象')
    return errors
  }
  const record = root as Record<string, unknown>
  if (record.schema_version !== 1) {
    errors.push('user_identities/index.json schema_version 须为 1')
  }
  const defaultId = typeof record.default_identity_id === 'string' ? record.default_identity_id.trim() : ''
  const identities = record.identities
  if (identities == null || typeof identities !== 'object' || Array.isArray(identities)) {
    errors.push('user_identities/index.json identities 须为对象')
    return errors
  }
  const identityEntries = identities as Record<string, unknown>
  if (Object.keys(identityEntries).length === 0) {
    errors.push('user_identities/index.json identities 不得为空')
  }
  if (!defaultId) {
    errors.push('user_identities/index.json default_identity_id 不得为空')
  } else if (!Object.prototype.hasOwnProperty.call(identityEntries, defaultId)) {
    errors.push(`user_identities/index.json default_identity_id「${defaultId}」不在 identities 中`)
  }
  for (const [id, value] of Object.entries(identityEntries)) {
    if (!id.trim()) {
      errors.push('user_identities/index.json identity id 不得为空')
      continue
    }
    if (value == null || typeof value !== 'object' || Array.isArray(value)) {
      errors.push(`user_identities/index.json identities.${id} 须为对象`)
      continue
    }
    const entry = value as Record<string, unknown>
    if (typeof entry.display_name !== 'string' || !entry.display_name.trim()) {
      errors.push(`user_identities/index.json identities.${id}.display_name 不得为空`)
    }
    const template = entry.template_file
    if (typeof template !== 'string' || !template.trim()) {
      errors.push(`user_identities/index.json identities.${id}.template_file 不得为空`)
      continue
    }
    const path = normalizeUserIdentityTemplatePath(`user_identities/${template}`)
    if (!path || !paths.has(path)) {
      errors.push(`用户身份「${id}」引用的模板不存在：「${template}」`)
    }
    if (entry.maps_to_relation_id !== undefined &&
      (typeof entry.maps_to_relation_id !== 'string' || !entry.maps_to_relation_id.trim())) {
      errors.push(`user_identities/index.json identities.${id}.maps_to_relation_id 若存在则不得为空`)
    }
  }
  return errors
}
