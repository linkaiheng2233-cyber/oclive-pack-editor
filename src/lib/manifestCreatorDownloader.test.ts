import { describe, expect, it } from 'vitest'
import {
  patchManifestCreatorMessageToDownloader,
  readManifestCreatorMessageToDownloader,
} from './manifestCreatorDownloader'

describe('manifestCreatorDownloader', () => {
  it('reads string field', () => {
    const raw = JSON.stringify({ id: 'x', creator_message_to_downloader: 'hello' })
    expect(readManifestCreatorMessageToDownloader(raw)).toBe('hello')
  })

  it('patches and clears', () => {
    const base = JSON.stringify({ id: 'r', name: 'N' }, null, 2) + '\n'
    const withMsg = patchManifestCreatorMessageToDownloader(base, '  thanks  ')
    expect(JSON.parse(withMsg).creator_message_to_downloader).toBe('thanks')
    const cleared = patchManifestCreatorMessageToDownloader(withMsg, '   ')
    expect(JSON.parse(cleared).creator_message_to_downloader).toBeUndefined()
  })
})
