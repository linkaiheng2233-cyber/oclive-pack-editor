import { describe, expect, it } from 'vitest'
import { filterEmotionImageFiles, isEmotionImageFileName } from './emotionAssets'

describe('emotionAssets', () => {
  it('isEmotionImageFileName accepts common extensions', () => {
    expect(isEmotionImageFileName('a.png')).toBe(true)
    expect(isEmotionImageFileName('b.JPEG')).toBe(true)
    expect(isEmotionImageFileName('c.webp')).toBe(true)
    expect(isEmotionImageFileName('d.gif')).toBe(true)
    expect(isEmotionImageFileName('e.txt')).toBe(false)
  })

  it('filterEmotionImageFiles drops non-images', () => {
    const files = [
      new File([], 'a.png', { type: 'image/png' }),
      new File([], 'b.exe', { type: 'application/octet-stream' }),
    ]
    expect(filterEmotionImageFiles(files)).toHaveLength(1)
    expect(filterEmotionImageFiles(files)[0]!.name).toBe('a.png')
  })
})
