import type { RefObject } from 'react'

export interface AnchorStackItem<T = unknown> {
  id: string
  data: T
}

export interface ItemPosition {
  id: string
  top: number
  isStacked: boolean
}

export type AnchorResolver<T> = (item: AnchorStackItem<T>) => HTMLElement | null

export interface UseAnchorStackOptions<T> {
  items: AnchorStackItem<T>[]
  selectedId: string | null
  anchorResolver: AnchorResolver<T>
  gap?: number
}

export interface UseAnchorStackResult<T> {
  positions: Map<string, ItemPosition>
  refs: { get(id: string): RefObject<HTMLElement | null> }
  sortedItems: AnchorStackItem<T>[]
}
