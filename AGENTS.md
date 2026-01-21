# Agent Instructions

This document explains the project setup for AI agents working on this codebase.

## Overview

Anchor Stack is a headless React library for positioning stacked UI elements (like comment cards) next to their anchor points in a document. The core algorithm handles collision detection and reflow when items would overlap.

## Project Structure

```
anchor-stack/
├── lib/                    # Core library source
│   ├── index.ts            # Public exports
│   ├── types.ts            # TypeScript interfaces
│   ├── useAnchorStack.ts   # Main React hook
│   ├── calculatePositions.ts # Pure positioning algorithm
│   ├── useRefs.ts          # Dynamic ref generation helper
│   └── AnchorStackProvider.tsx # Context-based API
├── demo/                   # Interactive demo
│   ├── demo.tsx            # Demo React app
│   ├── index.html          # Built demo (generated)
│   └── screenshot.png      # README screenshot
├── test/                   # Unit tests
│   └── calculatePositions.test.ts
├── e2e/                    # Playwright E2E tests
│   ├── positioning.spec.ts
│   ├── collision.spec.ts
│   ├── selection.spec.ts
│   └── add-comment.spec.ts
├── scripts/                # Build scripts
│   ├── build-demo.ts       # Builds demo into single HTML file
│   └── serve-demo.ts       # Dev server for demo
└── .github/workflows/
    └── pages.yml           # GitHub Pages deployment
```

## Tech Stack

- **Runtime**: Bun (use `bun` for all commands)
- **Language**: TypeScript (no semis, single quotes, 100 char width)
- **Styling**: Tailwind CSS v4 (via CDN in demo)
- **Testing**: Bun test (unit), Playwright (E2E)

## Key Commands

```bash
# Install dependencies
bun install

# Type check
bun run tsc --noEmit

# Run unit tests
bun test

# Run E2E tests
bun run test:e2e

# Build library
bun run build

# Build demo (generates demo/index.html)
bun run build:demo

# Serve demo locally
bun run dev
```

## Architecture

### Core Algorithm (`lib/calculatePositions.ts`)

The positioning algorithm:
1. Sorts items by their anchor's vertical position
2. Iterates through items, detecting collisions with previous items
3. Pushes colliding items down to make room
4. When an item is selected, it stays at its anchor while items above shift up

This is a pure function for easy unit testing.

### React Hook (`lib/useAnchorStack.ts`)

The hook wraps the algorithm with:
- `useLayoutEffect` for measuring before paint
- `requestAnimationFrame` scheduling for batched updates
- Dynamic ref generation for card elements
- Anchor resolution via customizable callback

### Demo (`demo/demo.tsx`)

The demo showcases:
- Comment threads with replies
- Text selection to add new comments
- Click-to-select highlight synchronization
- Smooth reflow animations

## Build Process

The demo build (`scripts/build-demo.ts`):
1. Bundles `demo/demo.tsx` with Bun
2. Inlines the JS directly into the HTML template
3. Outputs a single `demo/index.html` file
4. Uses Tailwind CSS via CDN (no build step needed)

## Deployment

GitHub Pages deploys automatically on push to `main`:
1. Workflow runs `bun run build:demo`
2. Uploads `demo/` directory as artifact
3. Deploys to https://philipp-spiess.github.io/anchor-stack/

## Testing Strategy

- **Unit tests**: Test `calculatePositions` with various item configurations
- **E2E tests**: Test the demo app for positioning, collision handling, text selection, and comment creation

## Common Tasks

### Adding a new feature to the library

1. Update types in `lib/types.ts` if needed
2. Implement in the appropriate file
3. Export from `lib/index.ts`
4. Add unit tests in `test/`
5. Update demo to showcase the feature

### Updating the demo

1. Edit `demo/demo.tsx`
2. Run `bun run dev` to preview locally
3. Take new screenshot if UI changed significantly
4. Commit and push (GitHub Pages auto-deploys)

### Taking a new screenshot

Use the dev-browser skill or manually:
1. Run `bun run dev`
2. Open http://localhost:3000
3. Capture at 1400x900 viewport
4. Save to `demo/screenshot.png`
