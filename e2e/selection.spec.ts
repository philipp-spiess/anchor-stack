import { expect, test } from '@playwright/test'

test('selecting comments anchors them and highlights selection', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('body[data-stack-ready="true"]')

  const comment = page.locator('[data-comment-id="comment-1"]')
  await comment.click()

  await expect(comment).toHaveAttribute('data-selected', 'true')

  await page.waitForFunction(() => {
    const anchor = document.querySelector('[data-comment-anchor="comment-1"]')
    const commentEl = document.querySelector('[data-comment-id="comment-1"]')
    if (!anchor || !commentEl) {
      return false
    }
    const delta = Math.abs(
      anchor.getBoundingClientRect().top - commentEl.getBoundingClientRect().top
    )
    return delta < 24
  })

  await page.locator('[data-document]').click({ position: { x: 10, y: 10 } })
  await expect(comment).toHaveAttribute('data-selected', 'false')
})
