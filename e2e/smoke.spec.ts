import { expect, test } from '@playwright/test'

test.describe('oclive-pack-editor smoke', () => {
  test('首页标题与主标题可见', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/oclive-pack-editor/i)
    await expect(page.getByRole('heading', { level: 1, name: /开始|Start/i })).toBeVisible()
  })

  test('侧栏三项与顶栏检查角色包按钮存在', async ({ page }) => {
    await page.goto('/')
    const rail = page.locator('.editor-rail')
    await expect(rail.getByRole('button', { name: /简单|Simple/i })).toBeVisible()
    await expect(rail.getByRole('button', { name: /高级|Advanced/i })).toBeVisible()
    await expect(rail.getByRole('button')).toHaveCount(3)
    await expect(page.getByRole('button', { name: /检查角色包|Check pack/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^导出$|^Export$/i })).toBeVisible()
  })

  test('开始页含 roles 工作区与创建新角色包', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: /创建新角色包|Create new role pack/i })).toBeVisible()
    await expect(page.getByText(/Roles 目录|Roles directory/i)).toBeVisible()
  })

  test('简单页进阶区含知识库表单项', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /创建新角色包|Create new role pack/i }).click()
    const advDetails = page.locator('details.adv-details')
    await expect(advDetails).toBeVisible({ timeout: 15000 })
    await advDetails.locator('summary.adv-details-sum').click()
    await expect(page.getByRole('heading', { name: /知识库检索|Knowledge retrieval/i })).toBeVisible()
    await expect(page.locator('#f-kglob')).toBeVisible()
  })
})
