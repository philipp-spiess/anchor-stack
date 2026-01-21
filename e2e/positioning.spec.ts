import { expect, test } from '@playwright/test'

test('comments align with anchors', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('body[data-stack-ready="true"]')

  await page.waitForFunction(() => {
    const anchor = document.querySelector('[data-comment-anchor="comment-1"]')
    const comment = document.querySelector('[data-comment-id="comment-1"]')
    if (!anchor || !comment) {
      return false
    }
    const delta = Math.abs(
      anchor.getBoundingClientRect().top - comment.getBoundingClientRect().top
    )
    return delta < 24
  })

  const anchors = page.locator('[data-comment-anchor]')
  const comments = page.locator('[data-comment-id]')

  await expect(anchors).toHaveCount(2)
  await expect(comments).toHaveCount(2)

  for (const id of ['comment-1', 'comment-2']) {
    const anchor = page.locator(`[data-comment-anchor="${id}"]`)
    const comment = page.locator(`[data-comment-id="${id}"]`)

    const anchorBox = await anchor.boundingBox()
    const commentBox = await comment.boundingBox()

    expect(anchorBox).not.toBeNull()
    expect(commentBox).not.toBeNull()

    const delta = Math.abs((anchorBox?.y ?? 0) - (commentBox?.y ?? 0))
    expect(delta).toBeLessThan(32)
  }
})
