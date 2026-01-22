import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { calculatePositions } from './calculatePositions'
import { useRefs } from './useRefs'
import type { AnchorStackItem, ItemPosition, UseAnchorStackOptions } from './types'

export function useAnchorStack<T>({
  items,
  selectedId,
  anchorResolver,
  gap = 8,
}: UseAnchorStackOptions<T>) {
  const refs = useRefs<HTMLElement>()
  const [positions, setPositions] = useState<Map<string, ItemPosition>>(new Map())
  const [sortedItems, setSortedItems] = useState<AnchorStackItem<T>[]>([])
  const [revision, setRevision] = useState(0)
  const rafRef = useRef<number | null>(null)

  const stableItems = useMemo(() => items, [items])

  const schedule = useCallback(() => {
    if (rafRef.current != null) {
      return
    }
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null
      setRevision((prev) => prev + 1)
    })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, { passive: true })
    document.fonts?.ready.then(schedule).catch(() => {})

    return () => {
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule)
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [schedule])

  // Observe stack item elements for dimension changes
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      return
    }

    const resizeObserver = new ResizeObserver(schedule)

    for (const item of stableItems) {
      const element = refs.get(item.id).current
      if (element) {
        resizeObserver.observe(element)
      }
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [stableItems, refs, schedule])

  useLayoutEffect(() => {
    const anchorTops = new Map<string, number>()
    const heights = new Map<string, number>()
    const documentScrollTop = document.documentElement.scrollTop ?? 0

    // Filter out items without anchors - log error and skip like the original implementation
    const itemsWithAnchors: AnchorStackItem<T>[] = []
    for (const item of stableItems) {
      const element = anchorResolver(item)
      if (!element) {
        console.error(`[useAnchorStack] Could not find anchor element for item "${item.id}"`)
        continue
      }

      const top = element.getBoundingClientRect().top + documentScrollTop
      anchorTops.set(item.id, top)
      itemsWithAnchors.push(item)
    }

    for (const item of itemsWithAnchors) {
      const element = refs.get(item.id).current
      if (!element) {
        continue
      }

      heights.set(item.id, element.getBoundingClientRect().height)
    }

    const { positions: nextPositions, sortedItems: nextSortedItems } = calculatePositions({
      items: itemsWithAnchors,
      anchorTops,
      heights,
      selectedId,
      gap,
    })

    setPositions(nextPositions)
    setSortedItems(nextSortedItems)
  }, [anchorResolver, gap, refs, revision, selectedId, stableItems])

  return { positions, refs, sortedItems }
}
