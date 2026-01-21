import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode, RefObject } from 'react'
import { createRoot } from 'react-dom/client'
import { useAnchorStack } from '../lib/useAnchorStack'
import type { AnchorStackItem } from '../lib/types'

type Reply = {
  id: string
  author: string
  avatar: string
  text: string
  time: string
}

type CommentThread = {
  author: string
  avatar: string
  text: string
  time: string
  replies: Reply[]
}

const highlightClassName =
  'rounded-sm px-0.5 -mx-0.5 cursor-pointer transition-colors'

const highlightBaseClasses = ['bg-yellow-100', 'hover:bg-amber-200']
const highlightSelectedClasses = ['bg-amber-300']

const avatars = {
  ava: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
  mateo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
  jordan: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
  taylor: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face',
  sam: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face',
  you: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face',
}

const initialComments: AnchorStackItem<CommentThread>[] = [
  {
    id: 'comment-1',
    data: {
      author: 'Ava Li',
      avatar: avatars.ava,
      time: '2h',
      text: 'Love the self-referential approach here. Very meta!',
      replies: [
        {
          id: 'reply-1-1',
          author: 'Mateo S.',
          avatar: avatars.mateo,
          time: '1h',
          text: 'Agreed, it makes the demo feel more real.',
        },
      ],
    },
  },
  {
    id: 'comment-2',
    data: {
      author: 'Mateo S.',
      avatar: avatars.mateo,
      time: '5h',
      text: 'This is exactly the behavior we want. When I click here, the card should stay anchored.',
      replies: [],
    },
  },
  {
    id: 'comment-3',
    data: {
      author: 'Jordan K.',
      avatar: avatars.jordan,
      time: '1d',
      text: 'The collision detection is the key insight here.',
      replies: [
        {
          id: 'reply-3-1',
          author: 'Taylor R.',
          avatar: avatars.taylor,
          time: '20h',
          text: 'Exactly! Without it the cards would just stack on top of each other.',
        },
        {
          id: 'reply-3-2',
          author: 'Sam W.',
          avatar: avatars.sam,
          time: '18h',
          text: 'The reflow animation when selecting makes it feel polished.',
        },
      ],
    },
  },
  {
    id: 'comment-4',
    data: {
      author: 'Taylor R.',
      avatar: avatars.taylor,
      time: '3h',
      text: 'Should we add TypeScript examples to this section?',
      replies: [],
    },
  },
  {
    id: 'comment-5',
    data: {
      author: 'Sam W.',
      avatar: avatars.sam,
      time: '30m',
      text: 'The pure positioning function is great for testing.',
      replies: [],
    },
  },
  {
    id: 'comment-6',
    data: {
      author: 'Ava Li',
      avatar: avatars.ava,
      time: '15m',
      text: 'Nice that you can just select text and add comments inline.',
      replies: [],
    },
  },
]

const documentCopy = {
  title: 'Anchor Stack Documentation',
  subtitle: 'Interactive README · Try selecting text to add comments',
}

function Demo() {
  const [comments, setComments] = useState(initialComments)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const documentRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const selectionRangeRef = useRef<Range | null>(null)

  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null)
  const [selectionText, setSelectionText] = useState('')
  const [containerOffset, setContainerOffset] = useState(0)

  const anchorResolver = useCallback((item: AnchorStackItem<CommentThread>) => {
    return document.querySelector<HTMLElement>(`[data-comment-anchor="${item.id}"]`)
  }, [])

  const { positions, refs, sortedItems } = useAnchorStack({
    items: comments,
    selectedId,
    anchorResolver,
    gap: 12,
  })

  useEffect(() => {
    if (positions.size > 0) {
      document.body.dataset.stackReady = 'true'
    }
  }, [positions])

  // Sync highlight selected state with selectedId
  useEffect(() => {
    // Reset all highlights to base state
    document.querySelectorAll('[data-comment-anchor]').forEach((el) => {
      highlightSelectedClasses.forEach((cls) => el.classList.remove(cls))
      highlightBaseClasses.forEach((cls) => el.classList.add(cls))
    })

    // Add selected classes to the active highlight
    if (selectedId) {
      const activeHighlight = document.querySelector(`[data-comment-anchor="${selectedId}"]`)
      if (activeHighlight) {
        highlightBaseClasses.forEach((cls) => activeHighlight.classList.remove(cls))
        highlightSelectedClasses.forEach((cls) => activeHighlight.classList.add(cls))
      }
    }
  }, [selectedId])

  useLayoutEffect(() => {
    const updateOffset = () => {
      const element = containerRef.current
      if (!element) {
        return
      }

      const scrollTop = document.documentElement.scrollTop ?? 0
      const nextOffset = element.getBoundingClientRect().top + scrollTop
      setContainerOffset(nextOffset)
    }

    updateOffset()
    document.fonts?.ready.then(updateOffset).catch(() => {})
    window.addEventListener('resize', updateOffset)
    return () => window.removeEventListener('resize', updateOffset)
  }, [])

  useEffect(() => {
    if (!selectedId) {
      return
    }

    const item = comments.find((comment) => comment.id === selectedId)
    if (!item) {
      return
    }

    const anchor = anchorResolver(item)
    anchor?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [anchorResolver, comments, selectedId])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      // Don't interfere if there's an active text selection
      const selection = window.getSelection()
      if (selection && !selection.isCollapsed) {
        return
      }

      // Check if clicked on a highlight - select that comment
      const highlightElement = target.closest('[data-comment-anchor]') as HTMLElement | null
      if (highlightElement) {
        const commentId = highlightElement.dataset.commentAnchor
        if (commentId) {
          setSelectedId(commentId)
          // Scroll the comment card into view
          const commentCard = document.querySelector(`[data-comment-id="${commentId}"]`)
          commentCard?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          return
        }
      }

      if (
        target.closest('[data-comment-id]') ||
        target.closest('[data-add-comment-button]')
      ) {
        return
      }
      setSelectedId(null)
      setSelectionRect(null)
      setSelectionText('')
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const handleSelection = () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      setSelectionRect(null)
      setSelectionText('')
      return
    }

    const range = selection.getRangeAt(0)
    const container = documentRef.current
    if (!container || !container.contains(range.commonAncestorContainer)) {
      setSelectionRect(null)
      setSelectionText('')
      return
    }

    const rect = range.getBoundingClientRect()
    if (!rect || rect.width < 4 || rect.height < 4) {
      setSelectionRect(null)
      setSelectionText('')
      return
    }

    selectionRangeRef.current = range.cloneRange()
    setSelectionRect(rect)
    setSelectionText(selection.toString().trim())
  }

  const addComment = () => {
    const range = selectionRangeRef.current
    if (!range || !selectionText) {
      return
    }

    const id = `comment-${crypto.randomUUID()}`
    const highlight = document.createElement('span')
    highlight.setAttribute('data-comment-anchor', id)
    highlight.className = `${highlightClassName} ${highlightBaseClasses.join(' ')}`
    highlight.appendChild(range.extractContents())
    range.insertNode(highlight)

    const selection = window.getSelection()
    selection?.removeAllRanges()

    const newComment: AnchorStackItem<CommentThread> = {
      id,
      data: {
        author: 'You',
        avatar: avatars.you,
        time: 'now',
        text: '',
        replies: [],
      },
    }

    setComments((prev) => [...prev, newComment])
    setSelectedId(id)
    setSelectionRect(null)
    setSelectionText('')
  }

  const updateCommentText = useCallback((id: string, text: string) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === id ? { ...comment, data: { ...comment.data, text } } : comment
      )
    )
  }, [])

  const addReply = useCallback((commentId: string, text: string) => {
    const newReply: Reply = {
      id: `reply-${crypto.randomUUID()}`,
      author: 'You',
      avatar: avatars.you,
      time: 'now',
      text,
    }
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, data: { ...comment.data, replies: [...comment.data.replies, newReply] } }
          : comment
      )
    )
  }, [])

  const selectionButtonStyle = useMemo(() => {
    if (!selectionRect) {
      return undefined
    }

    const offset = 12
    const left = Math.min(selectionRect.right + offset, window.innerWidth - 140)
    const top = Math.max(selectionRect.top - offset, 16)
    return { left, top }
  }, [selectionRect])

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-slate-100">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-72 w-72 rounded-full bg-slate-200/70 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-12">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Anchor Stack Demo
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-900">
            {documentCopy.title}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {documentCopy.subtitle}
          </p>
        </header>

        <div ref={containerRef} className="relative flex gap-6">
          <main className="flex-1 rounded-3xl border border-zinc-200 bg-white p-10 shadow-xl">
            <div
              ref={documentRef}
              onMouseUp={handleSelection}
              data-document
              className="prose prose-zinc max-w-none"
            >
              <h2 className="text-2xl font-semibold">Anchor Stack</h2>
              <p data-selection-target>
                <TextHighlight id="comment-1">
                  Headless React utilities for positioning stacked UI elements next to their anchor
                  points
                </TextHighlight>{' '}
                — perfect for inline comments, review threads, and annotations. This very demo is
                built with the library, so you're experiencing the feature as you read about it.
              </p>

              <h3 className="text-xl font-semibold">Features</h3>
              <p>
                <TextHighlight id="comment-3">
                  Anchor-aware stacking with collision detection.
                </TextHighlight>{' '}
                When comment cards would overlap, they automatically reflow to make room for each
                other. The algorithm is simple but effective: sort by anchor position, then push
                down any cards that would collide with the one above.
              </p>
              <p>
                <TextHighlight id="comment-2">
                  Selected items stay on their anchors while neighbors reflow.
                </TextHighlight>{' '}
                Click any highlight in this document, or any card in the sidebar, and watch how
                the other cards smoothly animate to make room. The selected card always stays
                aligned with its anchor text.
              </p>

              <h3 className="text-xl font-semibold">API Overview</h3>
              <p>
                The main hook is{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">useAnchorStack</code>.
                Pass it your items, a selected ID, and an anchor resolver function. It returns
                calculated positions, refs for measuring, and sorted items for rendering.
              </p>
              <p>
                <TextHighlight id="comment-5">
                  There's also a pure positioning function
                </TextHighlight>{' '}
                called <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">calculatePositions</code>{' '}
                that you can use directly for unit testing or in non-React contexts.
              </p>

              <h3 className="text-xl font-semibold">Try it yourself</h3>
              <p>
                <TextHighlight id="comment-6">
                  Select any text in this document
                </TextHighlight>{' '}
                and click the "Add comment" button that appears. You'll create a new highlight
                and comment card. Type your thoughts and press Enter or click Comment to save.
              </p>
              <p>
                You can also reply to existing comments by clicking the "Reply..." button at
                the bottom of any card. This creates threaded conversations, just like you'd
                expect from a collaborative document editor.
              </p>

              <h3 className="text-xl font-semibold">Implementation notes</h3>
              <p>
                <TextHighlight id="comment-4">
                  The positioning algorithm runs in a <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">useLayoutEffect</code>
                </TextHighlight>{' '}
                to measure elements before the browser paints. This prevents any visual flicker
                when cards reposition. The hook uses <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">requestAnimationFrame</code>{' '}
                scheduling internally to batch updates efficiently.
              </p>
              <p>
                Anchor resolution is fully customizable. In this demo, we use data attributes
                like <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">data-comment-anchor</code>{' '}
                to link highlights to their cards. But you could just as easily use DOM refs,
                line numbers in a code editor, or any other mechanism that returns an element.
              </p>
            </div>
          </main>


          <CommentsSidebar
            comments={sortedItems}
            positions={positions}
            refs={refs}
            selectedId={selectedId}
            offset={containerOffset}
            onSelect={setSelectedId}
            onUpdateText={updateCommentText}
            onAddReply={addReply}
          />
        </div>
      </div>

      {selectionRect ? (
        <button
          data-add-comment-button
          style={selectionButtonStyle}
          onClick={addComment}
          className="fixed z-50 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-700"
        >
          Add comment
        </button>
      ) : null}
    </div>
  )
}

function TextHighlight({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span data-comment-anchor={id} className={`${highlightClassName} ${highlightBaseClasses.join(' ')}`}>
      {children}
    </span>
  )
}

function CommentsSidebar({
  comments,
  positions,
  refs,
  selectedId,
  offset,
  onSelect,
  onUpdateText,
  onAddReply,
}: {
  comments: AnchorStackItem<CommentThread>[]
  positions: Map<string, { top: number }>
  refs: { get(id: string): RefObject<HTMLElement | null> }
  selectedId: string | null
  offset: number
  onSelect: (id: string) => void
  onUpdateText: (id: string, text: string) => void
  onAddReply: (commentId: string, text: string) => void
}) {
  return (
    <div className="relative hidden w-[380px] shrink-0 md:block">
      {comments.map((comment) => {
        const position = positions.get(comment.id)
        return (
          <CommentCard
            key={comment.id}
            ref={refs.get(comment.id) as RefObject<HTMLDivElement | null>}
            comment={comment}
            top={position?.top != null ? position.top - offset : undefined}
            selected={selectedId === comment.id}
            onSelect={() => onSelect(comment.id)}
            onUpdateText={(text) => onUpdateText(comment.id, text)}
            onAddReply={(text) => onAddReply(comment.id, text)}
          />
        )
      })}
    </div>
  )
}

const CommentCard = forwardRef<HTMLDivElement, {
  comment: AnchorStackItem<CommentThread>
  top?: number
  selected: boolean
  onSelect: () => void
  onUpdateText: (text: string) => void
  onAddReply: (text: string) => void
}>(function CommentCard({ comment, top, selected, onSelect, onUpdateText, onAddReply }, ref) {
  const [draftText, setDraftText] = useState('')
  const [replyText, setReplyText] = useState('')
  const [showReplyInput, setShowReplyInput] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const replyInputRef = useRef<HTMLTextAreaElement>(null)
  const isDraft = comment.data.text === ''

  useEffect(() => {
    if (isDraft && selected && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isDraft, selected])

  useEffect(() => {
    if (showReplyInput && replyInputRef.current) {
      replyInputRef.current.focus()
    }
  }, [showReplyInput])

  const handleSubmit = () => {
    if (draftText.trim()) {
      onUpdateText(draftText.trim())
      setDraftText('')
    }
  }

  const handleReplySubmit = () => {
    if (replyText.trim()) {
      onAddReply(replyText.trim())
      setReplyText('')
      setShowReplyInput(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleReplyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleReplySubmit()
    }
    if (e.key === 'Escape') {
      setShowReplyInput(false)
      setReplyText('')
    }
  }

  return (
    <div
      ref={ref}
      data-comment-id={comment.id}
      data-selected={selected ? 'true' : 'false'}
      className={`absolute left-0 w-[360px] cursor-pointer ${
        top != null ? 'transition-all duration-200' : ''
      } ${selected ? 'z-20 -ml-2' : 'z-10 hover:-ml-1'}`}
      style={{ top }}
      onClick={onSelect}
    >
      <div
        className={`rounded-2xl border bg-white text-sm shadow-lg transition ${
          selected
            ? 'border-blue-500 shadow-xl'
            : 'border-zinc-200 hover:border-zinc-300 hover:shadow-xl'
        }`}
      >
        {/* Main comment */}
        <div className="flex items-start gap-3 p-4">
          <Avatar src={comment.data.avatar} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                {comment.data.author}
              </span>
              <span>{comment.data.time}</span>
            </div>
            {isDraft ? (
              <div className="mt-2">
                <textarea
                  ref={textareaRef}
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Write a comment..."
                  className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-zinc-300 focus:outline-none"
                  rows={2}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSubmit()
                    }}
                    disabled={!draftText.trim()}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Comment
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-slate-700">{comment.data.text}</p>
            )}
          </div>
        </div>

        {/* Replies */}
        {comment.data.replies.length > 0 && (
          <div className="border-t border-zinc-100">
            {comment.data.replies.map((reply) => (
              <div key={reply.id} className="flex items-start gap-3 px-4 py-3 border-b border-zinc-50 last:border-b-0">
                <Avatar src={reply.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {reply.author}
                    </span>
                    <span>{reply.time}</span>
                  </div>
                  <p className="mt-0.5 text-slate-700">{reply.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply input */}
        {!isDraft && (
          <div className="border-t border-zinc-100 p-3">
            {showReplyInput ? (
              <div>
                <textarea
                  ref={replyInputRef}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={handleReplyKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Write a reply..."
                  className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-zinc-300 focus:outline-none"
                  rows={2}
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowReplyInput(false)
                      setReplyText('')
                    }}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-zinc-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReplySubmit()
                    }}
                    disabled={!replyText.trim()}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reply
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowReplyInput(true)
                }}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-xs text-slate-400 transition hover:border-zinc-300 hover:bg-zinc-100"
              >
                Reply...
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

function Avatar({ src, size = 'md' }: { src: string; size?: 'sm' | 'md' }) {
  return (
    <img
      src={src}
      alt=""
      className={`rounded-full object-cover shrink-0 ${size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'}`}
    />
  )
}

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(<Demo />)
}
