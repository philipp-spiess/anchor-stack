import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useAnchorStack } from './useAnchorStack'
import type { AnchorStackItem, UseAnchorStackOptions, UseAnchorStackResult } from './types'

interface AnchorStackContextValue<T> extends UseAnchorStackResult<T> {
  selectedId: string | null
  setSelectedId: (id: string | null) => void
}

const AnchorStackContext = createContext<AnchorStackContextValue<any> | null>(null)

interface AnchorStackProviderProps<T>
  extends Omit<UseAnchorStackOptions<T>, 'selectedId'> {
  children: ReactNode
  selectedId?: string | null
  initialSelectedId?: string | null
  onSelectedIdChange?: (id: string | null) => void
}

export function AnchorStackProvider<T>({
  children,
  items,
  anchorResolver,
  gap,
  selectedId: controlledSelectedId,
  initialSelectedId = null,
  onSelectedIdChange,
}: AnchorStackProviderProps<T>) {
  const [uncontrolledSelectedId, setUncontrolledSelectedId] = useState(initialSelectedId)
  const selectedId = controlledSelectedId ?? uncontrolledSelectedId

  const setSelectedId = (nextId: string | null) => {
    if (controlledSelectedId !== undefined) {
      onSelectedIdChange?.(nextId)
      return
    }

    setUncontrolledSelectedId(nextId)
  }

  const stack = useAnchorStack({ items, selectedId, anchorResolver, gap })

  const value = useMemo<AnchorStackContextValue<T>>(
    () => ({
      ...stack,
      selectedId,
      setSelectedId,
    }),
    [selectedId, stack]
  )

  return <AnchorStackContext.Provider value={value}>{children}</AnchorStackContext.Provider>
}

export function useAnchorStackContext<T>() {
  const context = useContext(AnchorStackContext)
  if (!context) {
    throw new Error('useAnchorStackContext must be used within AnchorStackProvider')
  }

  return context as AnchorStackContextValue<T>
}

export type { AnchorStackItem }
