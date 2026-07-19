import { describe, expect, it } from 'vitest'
import { normalizeUserIdentityTemplatePath, validateUserIdentityBundle } from './userIdentities'

describe('user identity bundle', () => {
  it('normalizes safe template paths and rejects traversal', () => {
    expect(normalizeUserIdentityTemplatePath('user_identities/friend.md')).toBe('user_identities/friend.md')
    expect(normalizeUserIdentityTemplatePath('../friend.md')).toBeNull()
  })

  it('detects missing templates referenced by index.json', () => {
    const index = JSON.stringify({
      schema_version: 1,
      identities: { friend: { template_file: 'friend.md' } },
    })
    expect(validateUserIdentityBundle(index, [])).toContain(
      '用户身份「friend」引用的模板不存在：「friend.md」',
    )
  })

  it('mirrors runtime catalog requirements for defaults and display names', () => {
    const errors = validateUserIdentityBundle(
      JSON.stringify({
        schema_version: 1,
        default_identity_id: 'missing',
        identities: { friend: { template_file: 'friend.md' } },
      }),
      [{ path: 'user_identities/friend.md', content: '# friend' }],
    )
    expect(errors).toContain('user_identities/index.json default_identity_id「missing」不在 identities 中')
    expect(errors).toContain('user_identities/index.json identities.friend.display_name 不得为空')
  })
})
