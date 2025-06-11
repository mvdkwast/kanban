## Essential Commands

```bash
npm run dev      # Start development server (Vite)
npm run build    # Production build
npm run preview  # Preview production build
```

Note: No lint or test commands are currently configured in this project.

## Architecture Overview

### State Management Architecture

This Vue 3 application uses Pinia stores with a specific separation of concerns:

1. **useBoardStore** - Manages board persistence and multi-board navigation
    - Handles IndexedDB operations through StorageManager service
    - Manages board slug generation and URL routing
    - Controls board creation, deletion, and switching
    - Auto-saves are triggered by the kanbanStore, not here

2. **useKanbanStore** - Manages the active board's state
    - Contains all cards and UI state for the current board
    - Implements watchDebounced for auto-saving (300ms debounce)
    - Persists focusedCardId to database for state restoration
    - Handles temporary card visibility during creation

### Service Architecture

**KeyboardManager** (Singleton): Central keyboard handling system
- Routes key events to mode-specific handlers
- Manages global shortcuts (work regardless of mode)
- Prevents input field interference
- Mode handlers registered dynamically

**ModeManager**: Application mode state machine
- Tracks current mode: 'navigation' | 'search' | 'tag-selection'
- Ensures only one mode active at a time
- Emits mode enter/exit events

**TaskManager**: Pure utility functions for card operations
- `getVisibleCards`: AND logic for multi-tag filtering + search text
- `findCardInColumnAtY`: Smart Y-position matching for navigation
- `findBestCardToFocus`: Intelligent focus restoration
- `bringCardIntoView`: Smooth scrolling with header/footer buffers
- `getAllTags`: Extract unique tags from all cards

**TagSelectionManager**: Complex tag selection state machine
- Preview mode: Type to filter tags
- Manual mode: Navigate with arrows, toggle with space
- Multi-select with Shift
- Smart toggle behavior (single/multi select)

### Non-Obvious Patterns

**Three-Mode Keyboard System**:
1. Navigation Mode (default): Arrow keys move between cards
2. Search Mode (/): Type to filter cards by content
3. Tag Selection Mode (#): Type to filter by tags

**Card Position Tracking**: For keyboard navigation that maintains Y-position:
- Cards report positions via ResizeObserver + custom events
- `cardPositions` map stores `{top, bottom, columnId}` for each card
- `findCardInColumnAtY` uses 3-phase algorithm:
    - Phase 1: Find overlapping cards (best match)
    - Phase 2: Find closest center distance
    - Phase 3: Edge case handling

**Focus Persistence**: Board remembers which card was focused:
- `focusedCardId` saved to IndexedDB with board data
- On board load, restores focus or falls back to top-left card
- Smart scroll-to-view after DOM renders

**Temporary Card Visibility**: New cards remain visible even when filtered out:
- `temporaryVisibleCardId` tracks the card being edited
- `visibleCards` computed includes this card even if filtered
- Cleared when card is saved or deleted

**Board Slug Handling**: URLs are automatically generated from titles:
- StorageManager generates URL-friendly slugs
- Conflicts resolved by appending numbers
- Old board deleted when title changes (prevents orphans)

### Component Communication Pattern

**Event-Driven Architecture**:
- Global event emitter for cross-component communication
- MainView.vue acts as the orchestrator
- Components emit events, stores handle state changes
- No direct store access in components (props/events only)

**Key Events**:
- `mode:enter/exit`: Mode transitions
- `filter:tags/search/reset`: Filter updates
- `tags:updated`: Tag list changes
- `card:completed`: Card moved to next column
- `global:*`: Global shortcuts (help, export, etc.)

### Focus Management Strategy

**Multi-Level Focus System**:
1. Logical focus: `focusedCardId` in store
2. Visual focus: `isFocused` prop + ring styling
3. DOM focus: Actual keyboard focus for accessibility
4. Smart focus: Auto-focus best card after filter changes

**Focus Restoration**:
- After delete: Focus next card in column or adjacent column
- After filter: Keep current if visible, else top-left
- After board switch: Restore saved focus or top-left

### Drag & Drop Implementation

**Native HTML5 Drag/Drop**:
- No external libraries
- Global window properties for cross-component data
- Visual feedback: Drag indicators, opacity changes
- Special delete column behavior
- Smart insertion logic based on Y-position

### Storage & Persistence

**IndexedDB Structure**:
- Database: `kanban-boards`
- Object Store: `boards`
- Schema includes: id (slug), title, cards, lastModified, focusedCardId
- Auto-migration from localStorage
- Version management for schema updates

### Recent Architectural Changes

**Focus Persistence** (Latest): Board remembers focused card
**Tag System Refactor**: Unified tag selection with keyboard navigation
**Position-Based Navigation**: Smart Y-position matching for arrow keys
**Mode System**: Clear separation of keyboard contexts

## Development Notes

- Vue 3 Composition API style throughout (no Options API)
- TypeScript with strict typing for all props/emits
- Tailwind CSS 4 with custom dark theme
- No external drag/drop or keyboard libraries
- Hash-based routing without Vue Router
- IndexedDB for persistence (not localStorage)
- Event-driven architecture with minimal coupling