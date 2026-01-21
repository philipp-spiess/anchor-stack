import { expect, test } from '@playwright/test'

test('adding a comment from selection creates a new highlight', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('body[data-stack-ready="true"]')

  const initialComments = await page.locator('[data-comment-id]').count()
  const initialHighlights = await page.locator('[data-comment-anchor]').count()

  await page.evaluate(() => {
    const target = document.querySelector('[data-selection-target]')
    if (!target || !target.firstChild) {
      return
    }

    const text = target.firstChild.textContent ?? ''
    const range = document.createRange()
    range.setStart(target.firstChild, 0)
    range.setEnd(target.firstChild, Math.min(text.length, 24))

    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  })

  await page.locator('[data-document]').dispatchEvent('mouseup')
  const addButton = page.locator('[data-add-comment-button]')
  await expect(addButton).toBeVisible()

  await addButton.click()

  await expect(page.locator('[data-comment-id]')).toHaveCount(initialComments + 1)
  await expect(page.locator('[data-comment-anchor]')).toHaveCount(initialHighlights + 1)
  await expect(addButton).toHaveCount(0)
})
