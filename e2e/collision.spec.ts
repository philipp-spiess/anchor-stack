import { expect, test } from '@playwright/test'

test('stacked comments do not overlap', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('body[data-stack-ready="true"]')

  const boxes = await page.$$eval('[data-comment-id]', (elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect()
      return { top: rect.top, bottom: rect.bottom }
    })
  )

  boxes.sort((a, b) => a.top - b.top)

  for (let i = 0; i < boxes.length - 1; i += 1) {
    expect(boxes[i].bottom).toBeLessThanOrEqual(boxes[i + 1].top + 1)
  }
})
