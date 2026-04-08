import { expect, test } from '@playwright/test'

test.describe('oclive-pack-editor smoke', () => {
  test('首页标题与主标题可见', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/oclive-pack-editor/i)
    await expect(
      page.getByRole('heading', { level: 1, name: /角色包编写器/ }),
    ).toBeVisible()
  })

  test('创作模式与检查区存在', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('tab', { name: '简单创作' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '高级创作' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '角色包检查' })).toBeVisible()
  })

  test('简单创作进阶区含知识库表单项', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: '简单创作' }).click()
    await page.locator('details.adv-details').click()
    await expect(page.getByRole('heading', { name: '知识库检索（manifest / settings）' })).toBeVisible()
    await expect(page.getByLabel('glob 模式')).toBeVisible()
  })
})
