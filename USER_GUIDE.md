# Kanban Board User Guide

Welcome to your keyboard-first Kanban board! This guide will help you discover all the features and become productive quickly.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Core Concepts](#core-concepts)
3. [Navigation & Modes](#navigation--modes)
4. [Card Management](#card-management)
5. [Board Management](#board-management)
6. [Tags & Filtering](#tags--filtering)
7. [Import & Export](#import--export)
8. [Keyboard Shortcuts Reference](#keyboard-shortcuts-reference)
9. [Tips & Tricks](#tips--tricks)

## Getting Started

The Kanban board is designed for keyboard-first usage while still supporting mouse/touch interactions. Cards flow through four main columns:
- **idea** → **todo** → **doing** → **done**

There's also a special **delete** column for removing cards.

### First Steps
1. Press `Insert` to create your first card
2. Type your task and press `Enter` to save
3. Use arrow keys to navigate between cards
4. Press `Ctrl+H` anytime to see all keyboard shortcuts

## Core Concepts

### Three Modes of Operation

The application has three distinct modes:

1. **Navigation Mode** (default)
   - Move between cards with arrow keys
   - Edit, delete, and organize cards
   - This is where you'll spend most of your time

2. **Search Mode** (press `/`)
   - Filter cards by typing any text
   - Cards are filtered in real-time as you type
   - Press `Enter` to confirm or `Esc` to cancel

3. **Tag Selection Mode** (press `#`)
   - Filter cards by tags
   - Type to filter available tags
   - Use arrows to navigate, Space to toggle

### Cards

Cards are the basic units of work. Each card can contain:
- Plain text
- Markdown formatting (headers, lists, links, etc.)
- Tags (any word starting with #)

### Boards

You can have multiple boards for different projects or contexts. Each board:
- Has its own set of cards
- Maintains its own filters and focus state
- Is automatically saved as you work
- Has a unique URL for easy sharing

## Navigation & Modes

### Basic Navigation (Navigation Mode)

| Key | Action |
|-----|--------|
| `↑` `↓` | Move between cards in the same column |
| `←` `→` | Move between columns (maintains vertical position) |
| `Home` | Jump to first card in column |
| `End` | Jump to last card in column |
| `/` | Enter Search Mode |
| `#` | Enter Tag Selection Mode |

### Search Mode

Activated by pressing `/`:
- Type to filter cards by content
- Matching is case-insensitive
- Shows only cards containing your search text
- Press `Enter` to confirm and focus the first result
- Press `Esc` to cancel and restore previous view

### Tag Selection Mode

Activated by pressing `#`:
- **Quick Filter**: Type tag name (e.g., `#bug`) to filter and auto-select
- **Manual Selection**: Use arrows to navigate available tags
- **Toggle Tags**: Press `Space` to toggle a single tag
- **Multi-Select**: Hold `Shift+Space` or `Shift+Click` for multiple tags
- **Apply Filter**: Press `Enter` to apply and focus first matching card
- **Cancel**: Press `Esc` to cancel changes

## Card Management

### Creating Cards

| Method | Description |
|--------|-------------|
| `Insert` | Add a new card above the currently focused card |
| Double-click column | Add a new card to that column |

### Editing Cards

| Method | Description |
|--------|-------------|
| `Enter` or `Space` or `F2` | Edit the focused card |
| Double-click card | Edit that specific card |
| `Enter` (while editing) | Save changes |
| `Esc` (while editing) | Cancel changes |

### Moving Cards

**Within a Column:**
| Key | Action |
|-----|--------|
| `Ctrl+↑` | Move card up |
| `Ctrl+↓` | Move card down |
| `Ctrl+Home` | Move to top of column |
| `Ctrl+End` | Move to bottom of column |

**Between Columns:**
| Key | Action |
|-----|--------|
| `Ctrl+←` | Move card to previous column |
| `Ctrl+→` | Move card to next column |
| `Ctrl+Enter` | Complete card (move to next stage) |
| Drag & Drop | Drag cards between columns with mouse |

### Deleting Cards

| Method | Description |
|--------|-------------|
| `Delete` | Delete the focused card (with confirmation) |
| `Alt+Click` | Quick delete (with confirmation) |
| Drag to delete column | Delete by dragging (with confirmation) |

## Board Management

### Board Operations

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Create a new board |
| `Alt+T` | Edit board title |
| `Ctrl+[` | Switch to previous board |
| `Ctrl+]` | Switch to next board |

### Managing Multiple Boards

- Click the board title to rename it
- Use the dropdown menu (▼) next to the title to:
  - See all available boards
  - Switch between boards
  - Delete boards (except the last one)
  - Create new boards

Each board gets a unique URL based on its title, making it easy to bookmark or share specific boards.

## Tags & Filtering

### Using Tags

Tags help categorize and filter your cards:
- Add tags by typing `#tagname` anywhere in a card
- Tags are automatically extracted and displayed as colored badges
- Each tag gets a consistent color across all cards

### Filtering by Tags

**Quick Filter** (Recommended):
1. Press `#` to enter tag mode
2. Type the tag name (e.g., type `bug` to filter `#bug`)
3. Press `Enter` to apply

**Manual Selection**:
1. Press `#` to enter tag mode
2. Use `←` `→` to navigate tags
3. Press `Space` to toggle selection
4. Press `Enter` to apply

**Multi-Tag Filtering**:
- Select multiple tags to show only cards containing ALL selected tags (AND logic)
- Use `Shift+Space` or `Shift+Click` for multi-selection
- Selected tags glow to show active filters

### Combining Filters

You can combine tag filters with search:
1. Select tags to filter by category
2. Use `/` to search within those filtered cards
3. Press `Ctrl+K` to clear all filters

## Import & Export

### Exporting Boards

| Method | Description |
|--------|-------------|
| `Ctrl+E` | Export current board as JSON file |
| Click "Export" button | Same as keyboard shortcut |

Exports include:
- Board title
- All cards with their content and column positions
- Tags are preserved within card content

### Importing Boards

| Method | Description |
|--------|-------------|
| `Ctrl+I` | Open import dialog |
| Click "Import" button | Same as keyboard shortcut |

Import behavior:
- Creates a new board with the imported data
- Automatically switches to the new board
- Original board remains unchanged
- Handles title conflicts by appending numbers

## Keyboard Shortcuts Reference

### Global Shortcuts (Work Anywhere)

| Shortcut | Action |
|----------|--------|
| `Ctrl+H` | Show/hide help |
| `Ctrl+K` | Clear all filters |
| `Ctrl+E` | Export board |
| `Ctrl+I` | Import board |
| `Ctrl+B` | New board |
| `Alt+T` | Focus board title |
| `Ctrl+[` / `Ctrl+]` | Previous/Next board |

### Navigation Mode

| Shortcut | Action |
|----------|--------|
| `↑` `↓` `←` `→` | Navigate cards |
| `Home` / `End` | First/Last card in column |
| `Enter` / `Space` / `F2` | Edit card |
| `Insert` | Insert new card |
| `Delete` | Delete card |
| `Ctrl+Enter` | Complete card |
| `/` | Search mode |
| `#` | Tag mode |

### Card Movement

| Shortcut | Action |
|----------|--------|
| `Ctrl+↑` / `Ctrl+↓` | Move up/down |
| `Ctrl+←` / `Ctrl+→` | Move left/right |
| `Ctrl+Home` / `Ctrl+End` | Move to top/bottom |

### While Editing

| Shortcut | Action |
|----------|--------|
| `Enter` | Save card |
| `Esc` | Cancel edit |
| `Shift+Enter` | New line |

## Tips & Tricks

### Productivity Tips

1. **Quick Task Entry**: Press `Insert`, type, press `Enter` - creates a task in under 2 seconds

2. **Bulk Operations**: 
   - Select a tag to filter related cards
   - Use `Ctrl+→` repeatedly to move all filtered cards to the next stage

3. **Markdown Support**:
   - Use `**bold**` for emphasis
   - Create lists with `- item` or `1. item`
   - Add links with `[text](url)`

4. **Tag Strategy**:
   - Use tags like `#urgent`, `#bug`, `#feature` for categorization
   - Tags at the end of a card act as metadata
   - Tags within text provide context

5. **Keyboard Flow**:
   - Stay in Navigation mode for most operations
   - Quick `/` search for finding specific cards
   - `#tagname` + `Enter` for instant tag filtering

### Advanced Features

1. **Smart Focus Memory**:
   - The board remembers which card you were working on
   - Focus is restored when you return to a board
   - Maintains focus even through browser refreshes

2. **Position-Aware Navigation**:
   - Left/right arrows maintain your vertical position
   - Moving cards preserves relative positioning
   - Great for organizing related cards at the same "level"

3. **Filter Combinations**:
   - Combine multiple tags for precise filtering
   - Add search on top of tag filters
   - Filtered cards remain accessible while editing

4. **URL-Based Boards**:
   - Each board has a unique URL
   - Bookmark specific boards
   - Share board URLs with teammates
   - URLs update automatically when renaming

### Best Practices

1. **Card Content**:
   - Keep cards concise and actionable
   - Use markdown for structure in longer cards
   - Add context with tags rather than long descriptions

2. **Column Flow**:
   - **idea**: Capture thoughts quickly
   - **todo**: Committed tasks
   - **doing**: Currently active (limit these!)
   - **done**: Completed work

3. **Tag Organization**:
   - Develop a consistent tagging system
   - Use prefixes for categories (e.g., `#proj-website`, `#proj-mobile`)
   - Regular cleanup: remove obsolete tags

4. **Board Management**:
   - One board per project or area
   - Archive completed boards by exporting
   - Use clear, descriptive board names

### Troubleshooting

**Can't see my cards?**
- Check if filters are active (tags shown at top)
- Press `Ctrl+K` to clear all filters
- Make sure you're on the right board

**Lost focus?**
- Press any arrow key to focus a card
- The board will intelligently select the best card
- Press `Home` to jump to the first card

**Accidental changes?**
- Each board auto-saves every 300ms
- Export regularly for backups
- Browser refresh restores last saved state

## Happy Organizing!

Remember: This is a keyboard-first tool. The more you use keyboard shortcuts, the more efficient you'll become. Start with basic navigation and gradually add more shortcuts to your workflow.

Press `Ctrl+H` anytime to see the quick reference!