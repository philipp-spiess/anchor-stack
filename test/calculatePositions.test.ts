import { describe, expect, it } from 'bun:test'
import { calculatePositions } from '../lib/calculatePositions'
import type { AnchorStackItem } from '../lib/types'

const buildItems = (ids: string[]): AnchorStackItem[] =>
  ids.map((id) => ({ id, data: null }))

const buildMap = (entries: Array<[string, number]>) => new Map(entries)

const getTop = (map: Map<string, { top: number }>, id: string) => map.get(id)?.top

const getStacked = (map: Map<string, { isStacked: boolean }>, id: string) =>
  map.get(id)?.isStacked

describe('calculatePositions', () => {
  it('returns empty result for empty input', () => {
    const result = calculatePositions({
      items: [],
      anchorTops: new Map(),
      heights: new Map(),
      selectedId: null,
      gap: 0,
    })

    expect(result.positions.size).toBe(0)
    expect(result.sortedItems).toHaveLength(0)
  })

  it('keeps items at their anchor positions when there are no collisions', () => {
    const items = buildItems(['a', 'b'])
    const result = calculatePositions({
      items,
      anchorTops: buildMap([
        ['a', 0],
        ['b', 40],
      ]),
      heights: buildMap([
        ['a', 20],
        ['b', 20],
      ]),
      selectedId: null,
      gap: 0,
    })

    expect(getTop(result.positions, 'a')).toBe(0)
    expect(getTop(result.positions, 'b')).toBe(40)
    expect(getStacked(result.positions, 'a')).toBe(false)
    expect(getStacked(result.positions, 'b')).toBe(false)
  })

  it('stacks overlapping items below each other', () => {
    const items = buildItems(['a', 'b', 'c'])
    const result = calculatePositions({
      items,
      anchorTops: buildMap([
        ['a', 0],
        ['b', 5],
        ['c', 9],
      ]),
      heights: buildMap([
        ['a', 20],
        ['b', 20],
        ['c', 20],
      ]),
      selectedId: null,
      gap: 0,
    })

    expect(getTop(result.positions, 'a')).toBe(0)
    expect(getTop(result.positions, 'b')).toBe(20)
    expect(getTop(result.positions, 'c')).toBe(40)
    expect(getStacked(result.positions, 'b')).toBe(true)
    expect(getStacked(result.positions, 'c')).toBe(true)
  })

  it('keeps the selected item anchored and shifts previous items upward', () => {
    const items = buildItems(['a', 'b'])
    const result = calculatePositions({
      items,
      anchorTops: buildMap([
        ['a', 0],
        ['b', 0],
      ]),
      heights: buildMap([
        ['a', 20],
        ['b', 20],
      ]),
      selectedId: 'b',
      gap: 0,
    })

    expect(getTop(result.positions, 'b')).toBe(0)
    expect(getTop(result.positions, 'a')).toBe(-20)
    expect(getStacked(result.positions, 'a')).toBe(true)
  })

  it('respects the gap option between items', () => {
    const items = buildItems(['a', 'b'])
    const result = calculatePositions({
      items,
      anchorTops: buildMap([
        ['a', 0],
        ['b', 0],
      ]),
      heights: buildMap([
        ['a', 20],
        ['b', 20],
      ]),
      selectedId: null,
      gap: 6,
    })

    expect(getTop(result.positions, 'b')).toBe(26)
  })

  it('returns sorted items by anchor position', () => {
    const items = buildItems(['a', 'b', 'c'])
    const result = calculatePositions({
      items,
      anchorTops: buildMap([
        ['a', 50],
        ['b', 10],
        ['c', 30],
      ]),
      heights: buildMap([
        ['a', 20],
        ['b', 20],
        ['c', 20],
      ]),
      selectedId: null,
      gap: 0,
    })

    expect(result.sortedItems.map((item) => item.id)).toEqual(['b', 'c', 'a'])
  })
})
