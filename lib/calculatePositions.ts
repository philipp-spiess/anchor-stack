import type { AnchorStackItem, ItemPosition } from './types'

type Dimension = {
  id: string
  anchorTop: number
  top: number
  height: number
  bottom: number
}

interface CalculatePositionsInput<T> {
  items: AnchorStackItem<T>[]
  anchorTops: Map<string, number>
  heights: Map<string, number>
  selectedId: string | null
  gap: number
}

interface CalculatePositionsResult<T> {
  positions: Map<string, ItemPosition>
  sortedItems: AnchorStackItem<T>[]
}

export function calculatePositions<T>({
  items,
  anchorTops,
  heights,
  selectedId,
  gap,
}: CalculatePositionsInput<T>): CalculatePositionsResult<T> {
  const sortedItems = [...items].sort((a, b) => {
    const aTop = anchorTops.get(a.id) ?? 0
    const bTop = anchorTops.get(b.id) ?? 0
    return aTop - bTop
  })

  const positions = new Map<string, ItemPosition>()
  const previousDimensions: Dimension[] = []

  for (let i = 0; i < sortedItems.length; i += 1) {
    const item = sortedItems[i]
    const anchorTop = anchorTops.get(item.id) ?? 0
    const height = heights.get(item.id) ?? 0
    const previousBottom =
      i === 0 ? Number.NEGATIVE_INFINITY : previousDimensions[i - 1].bottom + gap

    if (anchorTop >= previousBottom) {
      positions.set(item.id, { id: item.id, top: anchorTop, isStacked: false })
      previousDimensions[i] = {
        id: item.id,
        anchorTop,
        top: anchorTop,
        height,
        bottom: anchorTop + height,
      }
      continue
    }

    if (item.id !== selectedId) {
      positions.set(item.id, {
        id: item.id,
        top: previousBottom,
        isStacked: true,
      })
      previousDimensions[i] = {
        id: item.id,
        anchorTop,
        top: previousBottom,
        height,
        bottom: previousBottom + height,
      }
      continue
    }

    let nextTop = anchorTop
    for (let j = i - 1; j >= 0; j -= 1) {
      const previous = previousDimensions[j]
      if (previous.bottom + gap <= nextTop) {
        break
      }

      const offsetTop = nextTop - gap - previous.height
      positions.set(previous.id, {
        id: previous.id,
        top: offsetTop,
        isStacked: offsetTop !== previous.anchorTop,
      })
      nextTop = offsetTop
    }

    positions.set(item.id, { id: item.id, top: anchorTop, isStacked: false })
    previousDimensions[i] = {
      id: item.id,
      anchorTop,
      top: anchorTop,
      height,
      bottom: anchorTop + height,
    }
  }

  return { positions, sortedItems }
}
