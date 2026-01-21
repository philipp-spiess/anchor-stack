import { createRef, useMemo } from 'react'
import type { RefObject } from 'react'

export function useRefs<T extends HTMLElement>(): { get(id: string): RefObject<T | null> } {
  const refs = useMemo<Map<string, RefObject<T | null>>>(() => new Map(), [])

  return useMemo(
    () => ({
      get(id: string) {
        if (!refs.has(id)) {
          refs.set(id, createRef<T | null>())
        }

        return refs.get(id)!
      },
    }),
    [refs]
  )
}
