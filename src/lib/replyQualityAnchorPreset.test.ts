import { describe, expect, it } from 'vitest'
import {
  EDITOR_PACK_REPLY_QUALITY_ANCHOR,
  getReplyAnchorPresetById,
  matchReplyAnchorPresetId,
  mergeEditorReplyQualityAnchor,
  shouldPromptReplyQualityAnchor,
} from './replyQualityAnchorPreset'

describe('replyQualityAnchorPreset', () => {
  it('shouldPrompt when missing or blank string', () => {
    expect(shouldPromptReplyQualityAnchor({})).toBe(true)
    expect(shouldPromptReplyQualityAnchor({ reply_quality_anchor: '' })).toBe(true)
    expect(shouldPromptReplyQualityAnchor({ reply_quality_anchor: '  \n' })).toBe(true)
  })

  it('should not prompt when anchor present', () => {
    expect(shouldPromptReplyQualityAnchor({ reply_quality_anchor: 'x' })).toBe(false)
  })

  it('merge includes preset when true', () => {
    const s = mergeEditorReplyQualityAnchor({ schema_version: 1 }, true)
    expect(s.schema_version).toBe(1)
    expect(s.reply_quality_anchor).toBe(EDITOR_PACK_REPLY_QUALITY_ANCHOR)
  })

  it('merge copies when false', () => {
    const s = mergeEditorReplyQualityAnchor({ schema_version: 1, foo: 2 }, false)
    expect(s).toEqual({ schema_version: 1, foo: 2 })
  })

  it('match preset id for default body', () => {
    expect(matchReplyAnchorPresetId(EDITOR_PACK_REPLY_QUALITY_ANCHOR)).toBe('editor_default')
    expect(matchReplyAnchorPresetId('totally custom')).toBe('custom')
  })

  it('getReplyAnchorPresetById', () => {
    expect(getReplyAnchorPresetById('concise')?.id).toBe('concise')
  })
})
