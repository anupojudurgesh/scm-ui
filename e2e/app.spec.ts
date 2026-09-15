import { test, expect } from '@playwright/test'

test.describe('SCM Portal E2E', () => {
  test('loads dashboard and verifies title and core cards', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/scm-ui/i)
    await expect(page.getByText('SCM Portal')).toBeVisible()
    await expect(page.getByText('Enterprise Administration')).toBeVisible()
    await expect(page.getByText('User Management')).toBeVisible()
    await expect(page.getByText('Dealer Hierarchy')).toBeVisible()
    await expect(page.getByText('Plans & Number Series')).toBeVisible()
    await expect(page.getByText('Commission Rules')).toBeVisible()
  })
})
