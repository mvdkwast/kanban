# Vue 3 Kanban Board

A modern, keyboard-driven Kanban board application built with Vue 3, TypeScript, and Tailwind CSS.

## Features

- **Multi-board Support**: Create, manage, and switch between multiple Kanban boards
- **Drag & Drop**: Intuitive card movement between columns
- **Tag System**: Organize cards with hashtag-based tagging (#bug, #feature, etc.)
- **Advanced Filtering**: Filter cards by tags and search text
- **Keyboard Navigation**: Complete keyboard control for power users
- **Tag Typing Mode**: Quick tag filtering by typing # followed by tag name
- **Data Persistence**: Uses IndexedDB for offline data storage
- **Import/Export**: JSON-based board backup and sharing
- **Markdown Support**: Basic markdown rendering in card content

## Architecture

The application follows Vue 3 best practices with a clean separation of concerns:

### Key Components

- **MainView.vue**: Main application container handling all UI interactions
- **KanbanBoard.vue**: Pure Kanban board component focused only on board logic
- **TaskManager.ts**: Service class handling all task calculation and filtering logic
- **Board Store (Pinia)**: Manages board persistence and navigation
- **Kanban Store (Pinia)**: Manages card state and filtering
- **Keyboard Navigation**: Composable for comprehensive keyboard shortcuts
- **Board Manager**: Separate component for board title editing and selection
- **Help Modal**: Extracted help system component

### Stores (Pinia)

- **useBoardStore**: Handles board CRUD operations, storage, and routing
- **useKanbanStore**: Manages cards, filtering, focus state, and tag typing mode

### Services

- **TaskManager**: Pure functions for card filtering, positioning, and focus management
- **Storage**: IndexedDB wrapper for persistent data storage
- **Router**: Hash-based routing for board navigation

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Usage

### Basic Operations

- **Add Card**: Double-click on a column or use the + button
- **Edit Card**: Double-click on a card or press Enter/Space/F2 when focused
- **Move Card**: Drag and drop between columns
- **Delete Card**: Drag to delete column or Alt+Click or Delete key
- **Complete Card**: F9 to move card to next column

### Keyboard Shortcuts

#### Navigation
- `↑↓` - Navigate cards vertically
- `←→` - Navigate cards horizontally  
- `Home/End` - Jump to first/last card in column
- `/` - Focus search
- `#` - Focus tags / Start tag typing

#### Card Actions
- `Enter/Space/F2` - Edit focused card
- `Insert` - Insert card above current
- `Delete` - Delete focused card
- `F9` - Complete card (move to next column)

#### Moving Cards
- `Alt+↑↓` - Move card up/down in column
- `Alt+←→` - Move card to adjacent column
- `Alt+Home/End` - Move card to top/bottom of column

#### Board Management
- `Ctrl+B` - Create new board
- `Alt+T` - Focus board title
- `Ctrl+[/]` - Switch between boards
- `Ctrl+E` - Export current board
- `Ctrl+I` - Import board

#### Filtering & Tags
- `#tagname` - Type to filter by tag
- `←→` - Navigate matching tags (in tag mode)
- `Space` - Toggle tag selection
- `Shift+Space/Click` - Multi-select tags
- `Enter` - Apply filter & focus first card
- `Ctrl+K` - Clear all filters

#### General
- `Ctrl+H` - Toggle help
- `Esc` - Cancel edit / Exit typing / Close help

### Tag System

- Add hashtags anywhere in card content: `#bug #urgent #backend`
- Tags are automatically extracted and available for filtering
- Use tag typing mode (`#`) for quick filtering
- Multiple tag selection with Shift+Click or Shift+Space

### Tag Typing Mode

1. Press `#` to enter tag typing mode
2. Type tag name (auto-completes with existing tags)
3. Use `←→` to select from matching tags
4. Press `Enter` to apply filter
5. Press `Space` or `Esc` to cancel

## Development

### Project Structure

```
src/
├── components/          # Vue components
│   ├── MainView.vue    # Main application view
│   ├── KanbanBoard.vue # Pure kanban board
│   ├── KanbanColumn.vue # Individual column
│   ├── KanbanCard.vue  # Individual card
│   ├── BoardManager.vue # Board management
│   ├── SearchWidget.vue # Search functionality
│   ├── TagSelector.vue # Tag filtering
│   └── HelpModal.vue   # Help system
├── stores/             # Pinia stores
│   ├── useBoardStore.ts # Board management
│   └── useKanbanStore.ts # Kanban state
├── services/           # Business logic
│   ├── TaskManager.ts  # Task operations
│   ├── storage.ts      # IndexedDB wrapper
│   └── router.ts       # Hash routing
├── composables/        # Vue composables
│   └── useKeyboardNavigation.ts
├── types.ts           # TypeScript definitions
├── utils.ts           # Utility functions
└── main.ts           # Application entry point
```

### State Management

The application uses Pinia for state management with two main stores:

- **Board Store**: Manages board lifecycle, persistence, and navigation
- **Kanban Store**: Manages cards, filtering, focus, and UI state

### Reactive State Design

Vue 3's reactivity system is leveraged for:
- Automatic UI updates when cards/boards change
- Debounced auto-saving to IndexedDB
- Real-time filter updates
- Keyboard focus management

### Keyboard Handling

Unlike React, Vue's keyboard handling is implemented as a composable that:
- Centralizes all keyboard shortcuts
- Properly handles Vue's reactive state
- Integrates with component lifecycle
- Provides clean separation of concerns

## Browser Support

- Modern browsers with ES2020 support
- IndexedDB support required for persistence
- CSS Grid and Flexbox support required

## License

MIT License - feel free to use in your own projects!
