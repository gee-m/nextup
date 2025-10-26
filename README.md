# Task Tree - Visual Task Management System

> **⚠️ IMPORTANT FOR CLAUDE CODE**: This README MUST be updated whenever ANY feature is added, modified, or removed. Before starting ANY work session, READ this README first. After completing ANY changes, UPDATE this README to reflect those changes. This is not optional - it's critical for maintaining project continuity.

---

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [Quick Start](#quick-start)
- [Complete Feature List](#complete-feature-list)
- [Testing Guide](#testing-guide)
- [Architecture & Code Structure](#architecture--code-structure)
  - [⚙️ Configuration Pattern](#️-configuration-pattern-read-this-before-adding-features) ⭐ **Important for developers**
  - [⚙️ Settings UI](#️-settings-ui) - User-friendly customization interface
- [UI/UX Design System](#uiux-design-system)
- [Future Improvements](#future-improvements)
- [Development History](#development-history)

---

## Project Overview

**Task Tree** is a single-file, offline-first web application for hierarchical task management with dependency tracking. Built with vanilla JavaScript, it visualizes todos as an interactive graph where tasks have parent-child relationships, dependencies, and work-in-progress states.

**Core Philosophy**: Tasks exist within context - they have parents (larger goals), children (subtasks), and dependencies (prerequisites). The visual graph makes these relationships explicit.

**Tech Stack**:
- Pure Vanilla JavaScript (zero dependencies)
- SVG for scalable graphics
- HTML5 native interactions
- localStorage for persistence
- Single HTML file (~2350 lines)

**File**: `task-tree.html` - Everything in one file for portability

---

## Quick Start

1. Open `task-tree.html` in any modern web browser
2. No build step, no server needed - works offline
3. Data auto-saves to localStorage on every change
4. That's it!

---

## Complete Feature List

### 🚀 Multi-Project Support

**One Canvas, Multiple Projects**: Manage multiple independent task hierarchies on the same canvas

- **Root Tasks as Projects**: Each root task (task with no parent) is its own project
- **Independent Working States**: One task can be "working" per project simultaneously
  - Project A working on Task 1
  - Project B working on Task 2
  - Both highlighted and tracked independently
- **Unified Visual Workspace**: See all projects at once with clear visual separation
- **Shared Dependencies**: Can create dependencies across projects if needed
- **Ideal For**:
  - Personal kanban with multiple projects
  - Team dashboard showing multiple initiatives
  - Context switching between parallel work streams
  - Managing both long-term goals and immediate tasks

### ✅ Core Task Management

#### Adding Tasks
- **Root Task**: Type in input field, click "Add Root Task" or press Enter
- **Child Task**: Ctrl+Click on parent node
- **Test Checklist**: Click "🧪 Test Checklist" to load pre-built test scenarios

#### Editing Tasks
- **Rename**: Double-click task text to edit inline
  - **Multiline Editor**: Full-width textarea matches the rectangle exactly
  - **Text Alignment**: Text starts at left edge (left-aligned) for natural editing
  - **Text Selection**: Text auto-selected on open for immediate replacement
  - **New Lines**: Press Enter to create new lines (multiline support)
  - **Save**: Press Ctrl+Enter (or Cmd+Enter) or click outside to save
  - **Cancel**: Press Escape to discard changes
  - **Keyboard Shortcuts**: Full textarea editing capabilities
- **Hide Node**: Shift+Double-click to hide the node within its parent (quick shortcut)
  - Only works for child tasks (can't hide root tasks)
  - Hidden nodes don't render but preserve their state
  - Click the parent's hidden count badge to reveal hidden children
- **Delete**: Left-click to select, press Backspace (or Alt+Click)

#### Text Truncation & Expansion
- **Smart Truncation**: Long task titles are automatically truncated with "..."
  - Only truncates if significantly over limit (more than 5 chars beyond threshold)
  - Example: 60-char threshold won't truncate a 65-char title (only 5 chars saved)
  - Simple "..." suffix in normal text color (no special styling)
- **Customizable Threshold**: Adjust character limit (10-100) via "Text Length" control in toolbar
  - Default: 60 characters
  - Setting persists across sessions
- **Node Sizing & Typography Configuration**: Centralized config in app state for easy customization
  - `charWidth: 8` - Pixels per character for width calculation
  - `nodePadding: 5` - Left/right padding inside rectangles (5px each side = 10px total)
  - `minNodeWidth: 80` - Minimum rectangle width in pixels
  - `fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace"` - Beautiful monospace font stack
  - All parameters referenced globally via `this.charWidth`, `this.fontFamily`, etc.
  - Future: UI controls or JSON import/export for user customization
- **Click to Expand**: Click anywhere on a truncated node to expand to full text
  - Node immediately shows full title and resizes
  - Lock button 🔓 appears to the left of the node
- **Lock Button** (🔓/🔒):
  - Appears only on expanded nodes (positioned to the left, outside the box)
  - 🔓 = unlocked (will collapse when you stop working)
  - 🔒 = locked (permanently expanded)
  - Click to toggle lock state
  - **When Working**: Lock button visible but greyed out (disabled)
  - **Unlock Behavior**:
    - If node is selected → stays expanded
    - If node is NOT selected → immediately collapses to truncated
- **Auto-Expand on Working**: Tasks marked as "working" automatically expand
  - Lock button shows but is disabled during work
  - When stopping work: collapses if unlocked, stays if locked
- **Smart Sizing**: Node width adjusts dynamically based on displayed text
- **Smooth Animation**: Width changes animate with 0.2s CSS transitions

#### Multiline Text Support
- **Automatic Text Wrapping**: Long text wraps to multiple lines when exceeding max width
  - **Word Wrap** (default): Breaks on word boundaries for readability
  - **Character Wrap**: Breaks mid-word if word wrap is disabled
  - Smart handling of very long words (force breaks if needed)
- **Maximum Node Width**: Configurable max width (default: 600px)
  - Set in ⚙️ Settings → "Max Node Width (px)"
  - Range: 100-2000px
  - Text wraps to next line when reaching this limit
- **Maximum Node Height**: Optional height limit (default: unlimited)
  - Set in ⚙️ Settings → "Max Node Height (px)"
  - 0 = unlimited height
  - Shows "..." overflow indicator when text exceeds limit
- **Line Height**: Configurable spacing between lines (default: 20px)
  - Set in ⚙️ Settings → "Line Height (px)"
  - Range: 12-40px
- **Master Toggle**: Enable/disable multiline feature
  - ⚙️ Settings → "Enable Multiline Text"
  - When disabled, reverts to single-line behavior
- **Dynamic Height**: Rectangles grow vertically to fit content
  - Height = lines × line height + padding
  - Maintains visual hierarchy while supporting rich text
- **Left-Aligned Text**: Multiline text displays left-aligned for readability
  - Emoji status indicators (🔄/✅) appear on first line only

#### Multi-Select
- **Shift+Click to Toggle**: Select/deselect multiple tasks
  - Click a task to select only that task (clears others)
  - Shift+Click to add/remove task from selection
  - Multiple selected tasks highlight in blue
- **Box Selection (Shift+Drag)**: Click+drag on empty canvas with Shift held
  - Draws a semi-transparent blue rectangle as you drag
  - Selects all tasks whose centers fall within the box
  - Additive: adds to existing selection instead of clearing
- **Clear Selection**: Press Escape key
- **Move Multiple**: Drag any selected task to move all selected together
  - Maintains relative positions between selected tasks
  - Snap distance: 5px (less = click, more = drag)
- **Delete Multiple**: Select tasks, press Backspace or use right-click menu
  - Shows confirmation with count: "Delete 3 tasks?"
  - Deletes all selected tasks and their descendants
- **Right-Click Multi-Select Menu**:
  - Automatic menu showing multi-select aware options
  - "Mark Done (3)", "Mark Pending (3)", "Hide Child (3)", "Delete (3)" - operates on all selected
  - Right-clicking on unselected task auto-selects just that task
  - Right-clicking on selected task operates on entire selection

#### Task Status
- **Pending** (default): White background, grey border
- **Working**: Yellow background, orange border
  - **Multi-Project Support**: One task can be working PER ROOT GRAPH (not globally)
  - Enables managing multiple independent projects simultaneously
  - Each root task has its own "currently working" task
  - Example: Project A's Task 1 working + Project B's Task 2 working simultaneously ✓
- **Done**: Green background, green border with ✅ emoji
- **Cycle Status**: Middle-click task → Pending → Working → Done → Pending...
- **Flow State**: When marking a working task as done, automatically starts working on parent task
  - Maintains momentum - finish subtask, immediately continue on parent goal
  - Only applies if parent exists and isn't already done
  - Shows toast notification: "⬆️ Now working on parent: [Parent Name]"
  - Works within each root graph (doesn't affect other projects)

#### Status Indicators
- **✅ Emoji**: Shows on completed tasks
- **🔄 Emoji**: Shows on currently working task
- **Orange Border + Glow**: Parent tasks of working task (shows goal path)
- **Red Border**: Incomplete children of working task (highlights blockers)
- **Golden Path Arrows**: Visual hierarchy showing working task context
  - **Golden/amber arrows** (#f59e0b): Full ancestor path from working task all the way to root (3px width, glowing)
  - **Red arrows** (#f44336): Direct children that are NOT done (2.5px width, highlights blockers)
  - **Green arrows** (#4caf50): Direct children that ARE done (2.5px width, shows progress)
  - Shows complete context: where your current work fits in the bigger picture
  - Example: Root ⟶ Parent A ⟶ Parent B ⟶ 🔄 Working Task ⟶ [red] Incomplete Child | [green] Done Child

### 🔗 Relationships & Dependencies

#### Parent-Child Relationships
- **Main Parent**: Solid line with arrow showing direction (Parent → Child)
- **Other Parents**: Secondary parent relationships (multiple parents per task)
- **Create Child**: Ctrl+Click on parent node
- **Reparent**: Ctrl+Drag from parent to make target a child
  - Drag A → B makes B a child of A (drag direction = relationship direction)
  - Shows **green line** from source to target matching final arrow
  - Arrow direction: A → B (parent → child)
  - Release over target node to complete reparenting
  - **Multi-Source Reparenting**: If multiple tasks selected + Ctrl+Drag one of them
    - All selected tasks become children of the drop target
    - Example: Select B, C, D → Ctrl+Drag to A → B, C, D all become children of A
- **Create Child at Position**: Ctrl+Drag parent to empty space
  - Shows **blue line** from source to cursor + preview node
  - Preview node intelligently positioned in drag direction (avoids blocking cursor)
  - Creates new child task at exact cursor location
  - New task has empty name and immediately enters edit mode
  - Smart positioning: preview appears ahead of cursor based on drag direction
- **Delete Connection**: Click line to select (turns blue), press Backspace
  - Deleting parent-child connection makes child a root task

#### Dependencies
- **Create Dependency**: Alt+Drag from prerequisite (source) to dependent (target)
  - Drag direction shows dependency flow: A → B means "B depends on A"
  - Arrow direction matches drag direction
  - Uses `elementFromPoint` to correctly detect drop target during drag
  - Works correctly even when dragging far from source node
  - Visual: Dashed lines with arrowheads pointing from prerequisite to dependent
  - **Multi-Target Dependencies**: If dropping on a selected task with others also selected
    - All selected tasks depend on the source
    - Example: Alt+Drag A → (select B, C, D) → A must be done before B, C, and D
- **Delete Dependency**: Click dependency line, press Backspace
- **Cycle Prevention**: App prevents creating circular dependencies

#### Automatic Cleanup
- When reparenting A to parent B:
  - Removes B from A's dependencies (redundant)
  - Removes A from B's dependencies (would be circular)

### 🎨 Visual Features & UI

#### Node Interaction
- **Drag Node**: Click and drag (no modifier keys)
- **Drag Subtree**: Shift+Drag parent to move entire tree together
- **Select Node**: Left-click (highlights blue)
- **Context Menu**: Right-click for options menu:
  - Add Child
  - Mark Done/Pending
  - Start/Stop Working
  - Show/Hide (if task has a parent - hides the node itself)
  - Show/Hide Children (if task has children - hides all children)
  - Copy Text (copies task title to clipboard)
  - Delete
- **Hover Effect**: Nodes get thicker border on hover

#### Line Interaction
- **Easy Click Detection**: Wide invisible hit zones (15px) for all lines
- **Hover Effect**: All lines turn blue on hover
- **Selection**: Click line turns it blue with glow
- **Deletion**: Select line, press Backspace

#### Visibility Management
- **Auto-Collapse**: When task + all children are done AND parent is done, task hides
  - Root tasks (no parent) are NEVER auto-hidden, even if completed
  - Only processes the clicked task and its relationships
  - Only applies after marking a task complete/incomplete
  - **Configurable**: Toggle "Auto-Hide Completed Nodes" in ⚙️ Settings
- **Manual Toggle**: Click red +N badge to show/hide children
- **Hidden Badge**: Shows count of hidden children
- **Smart Logic**:
  - Never auto-hides root tasks
  - Never auto-hides tasks inside non-completed parents
  - Respects manual hiding - won't auto-collapse if children are manually hidden

#### Canvas Controls
- **Pan Canvas**: Click and drag on empty space
- **Zoom In**: Ctrl++ or click 🔍+ button
- **Zoom Out**: Ctrl+- or click 🔍− button
- **Reset Zoom**: Ctrl+0
- **Fit All**: Ctrl+1 or click "Fit" button
- **Mouse Wheel Zoom**: Ctrl+Scroll

#### 🏠 Homes - Named Bookmarks for Quick Navigation
Navigate to different areas of your graph instantly with saved view bookmarks:

**What are Homes?**
- Named bookmarks that save your current view position and zoom level
- Perfect for large graphs with multiple projects or areas
- Quick navigation between different parts of your task tree

**Accessing Homes**:
- **Keyboard Shortcuts**: Press number keys 0-9 to jump to homes with assigned keybinds
  - Fast, instant navigation without opening menus
  - Keybinds displayed as [0-9] next to home names in all menus
  - Assign keybinds in "Manage Homes" modal
- **Toolbar Dropdown**: Click "🏠 Homes" button in toolbar
  - Shows list of all homes sorted alphabetically ("Origin Home" always first)
  - Displays keybind shortcuts next to home names (e.g., "Work Project [1]")
  - Click any home to jump to that view
  - "+ Create New Home" to save current view
  - "⚙️ Manage Homes" to edit/delete homes
- **Right-Click Menu**: Right-click on empty space → "🏠 Homes" submenu
  - Same functionality as toolbar dropdown
  - Convenient context menu access
  - Shows keybind shortcuts for quick reference

**Creating & Managing Homes**:
- **Create Home**:
  - Click "+ Create New Home" from dropdown/submenu
  - Enter a unique name (case-insensitive validation)
  - Saves current view center position and zoom level
  - ⚠️ Warning toast if you have >20 homes (helps keep organized)
- **Jump to Home**:
  - Click home name from dropdown/submenu
  - Smooth animated transition to saved view (0.5s cubic-bezier)
  - Both position AND zoom level restored
- **Update Home**:
  - In "Manage Homes" modal, click "↻ Update" button
  - Updates home to current view position and zoom
- **Rename Home**:
  - In "Manage Homes" modal, click "✎ Rename" button
  - Enter new name (validates uniqueness)
- **Set Keybind**:
  - In "Manage Homes" modal, click "⌨ Set Key" (or "⌨ [current key]" if already set)
  - Press any number key 0-9 to assign that keybind
  - Press Escape to clear existing keybind or cancel
  - Conflict detection: warns if key is already assigned to another home
  - Reassignment option: choose to reassign conflicting key to new home
  - Only 0-9 keys allowed (prevents conflicts with Ctrl+shortcuts)
- **Delete Home**:
  - In "Manage Homes" modal, click "✕ Delete" button
  - Confirmation dialog (if enabled in settings)

**Special Home: "Origin Home"**:
- Auto-created when you click "Mark Origin" button
- Highlighted in purple in all menus
- Can assign a keybind for quick access to your origin point
- Backward compatible: migrates old origin system on first load

**Visual Features**:
- **Smooth Animation**: Cinematic 3-phase navigation
  - Phase 1 (300ms): Zoom out to overview level for context
  - Phase 2 (500ms): Pan to new location while zoomed out
  - Phase 3 (500ms): Zoom in to target zoom level
  - Total: 1.3 seconds of smooth, professional motion
  - Lines fade out during animation, reappear when complete
  - Works at any zoom level
- Homes sorted alphabetically with "Origin Home" always first
- Purple highlighting for special homes
- Clean modal interface with home details (zoom level, position coordinates)
- Submenu hover bridge prevents accidental dismissal
- Proper light/dark mode theming for all UI components

**Use Cases**:
- Large project with multiple sub-projects → create a home for each with keybinds 1-9
- Deep graph navigation → bookmark frequently visited areas, assign keybinds for instant access
- Presentation mode → create homes for key milestones, jump between with number keys
- Multi-workspace graphs → separate homes for different contexts (e.g., 1=Frontend, 2=Backend, 3=Docs)
- Power user workflow → assign keybinds to most-used views for lightning-fast navigation

#### Visual Modes
- **Dark Mode**: Toggle 🌙/☀️ for black background
  - Pure black canvas (#000000)
  - Dark grey nodes with adjusted colors
  - Light text for readability
  - Blue highlights remain visible
  - Preference saved to localStorage

#### Customization & Settings
- **Settings Button** (⚙️): Opens customization modal with all configuration options
- **Available Settings**:
  - Text Truncation Length (20-200 chars)
  - Character Width (4-15px) - affects node sizing
  - Node Padding (0-20px) - internal spacing
  - Minimum Node Width (40-200px)
  - Font Family - CSS font stack with fallbacks
  - Font Weight - Light (300) to Bold (700)
  - Show Delete Confirmation - Toggle confirmation dialog when deleting tasks
- **Dynamic Form**: Settings form generated automatically from configuration metadata
- **Live Apply**: Changes take effect immediately
- **Auto-Save**: Settings persist to localStorage
- **Reset to Defaults**: Restore original values with one click
- **Export Settings**: Copy current settings as JSON to clipboard for easy sharing
- **ESC to Close**: Press ESC or click outside modal to cancel without saving
- **Export/Import**: Settings included in full JSON export for sharing complete configurations

### 📊 Status Bar

Shows when a task is marked as "working":
- **Task Path**: Full path from root to current (compressed if >4 levels)
- **Progress**: Percentage of children completed
- **Incomplete Children**: Listed by name with ⚠️ warning if any exist
- **Default Message**: "No task selected | Middle-click a task to start working on it"

Always visible at bottom of screen.

### 💾 Data Management

#### Persistence
- **Auto-Save**: Every change immediately saved to localStorage
- **Export JSON**: Download complete data as timestamped file
- **Copy JSON**: Copy data to clipboard
- **Import JSON**: Paste JSON data via textarea modal
- **Clear All**: Delete everything (with confirmation)

#### Data Structure
Each task object:
```javascript
{
    id: number,              // Unique identifier
    title: string,           // Task name
    x, y: number,            // Canvas position
    mainParent: number|null, // Primary parent task ID
    otherParents: [ids],     // Secondary parent relationships
    children: [ids],         // Child task IDs
    dependencies: [ids],     // Tasks this depends on
    status: 'pending'|'done',
    currentlyWorking: boolean,
    hidden: boolean,         // For collapsed subtrees
    textExpanded: boolean,   // Whether text is currently expanded
    textLocked: boolean      // Whether expansion is locked (won't auto-collapse)
}
```

Stored in localStorage as:
```javascript
{
    // Task data
    tasks: [...],
    taskIdCounter: number,
    // View state
    darkMode: boolean,
    zoomLevel: number,
    // Homes - named bookmarks for quick navigation
    homes: [{                      // Array of saved view bookmarks
        id: number,                // Unique home ID
        name: string,              // User-assigned name (unique, case-insensitive)
        centerX: number,           // View center X coordinate
        centerY: number,           // View center Y coordinate
        zoomLevel: number,         // Zoom level at this home
        timestamp: number          // Creation/last update time
    }],
    homeIdCounter: number,         // Counter for unique home IDs
    // User preferences & configuration (all persist across sessions)
    textLengthThreshold: number,  // Character limit for text truncation (20-200)
    charWidth: number,             // Pixels per character for node width (4-15)
    nodePadding: number,           // Left/right padding in rectangles (0-20)
    minNodeWidth: number,          // Minimum rectangle width (40-200)
    fontFamily: string,            // CSS font stack
    fontWeight: number,            // Text weight (300-700)
    showDeleteConfirmation: boolean, // Toggle delete confirmation dialog
    // Undo/redo history
    undoStack: [{                  // Undo history (max 50 entries)
        tasks: [...],              // Snapshot of tasks array
        description: string,       // Human-readable action description
        timestamp: number          // When snapshot was taken
    }],
    redoStack: [...]              // Redo history (same structure)
}
```

### 🎯 Advanced Features

#### Smart Behaviors
- **Single Working Task Rule**: Only one task can be "working" at a time
- **Click vs Drag Detection**: 5px distance threshold, 200ms delay
- **Double-Click Protection**: Uses requestAnimationFrame to defer renders during event sequences
- **Coordinate Transformation**: Proper SVG matrix transformation for accurate clicks at any zoom level

#### Keyboard Shortcuts
- **Enter**: Add root task (when input focused)
- **Backspace**: Delete selected node or line
- **Ctrl/Cmd + Z**: Undo last action
- **Ctrl/Cmd + Shift + Z**: Redo (also Ctrl+Y on Windows)
- **Ctrl/Cmd + +**: Zoom in
- **Ctrl/Cmd + -**: Zoom out
- **Ctrl/Cmd + 0**: Reset zoom
- **Ctrl/Cmd + 1**: Zoom to fit
- **Ctrl/Cmd + Scroll**: Mouse wheel zoom

#### Undo/Redo System
- **Comprehensive History**: All operations are undoable - task creation, editing, deletion, status changes, moving, dependencies, imports, and even "Clear All Data"
- **Smart Edit Grouping**: Sequential edits to the same task within 2 seconds are grouped into a single undo step (prevents character-by-character undo)
- **Configurable History Limit**: Customize undo history size (5-200 steps) via Settings → Max Undo History
  - Default: 50 steps (automatically trims oldest when exceeded)
  - Lower values save memory, higher values provide deeper history
  - Changes apply immediately and trim excess history if needed
- **Clear History Button**: Manual history clearing in Settings → History Management
  - Shows current undo/redo counts and memory usage estimate
  - Confirmation dialog prevents accidental clearing
  - Frees up localStorage space when needed
- **Persistent History**: Undo/redo stacks saved to localStorage and restored on page reload
- **Toast Notifications**: Shows what was undone/redone with action descriptions (truncated at 50 chars)
- **Snapshot-Based**: Uses deep cloning of entire task array for reliable state restoration
- **Operations Tracked**:
  - Task creation (root, child, Ctrl+Click, right-click menu)
  - Task deletion (with task title shown)
  - Task editing (with smart 2-second grouping)
  - Status changes (pending/working/done)
  - Hide/show children
  - Drag operations (move task, move subtree) - NOT canvas panning
  - Dependencies (add/remove with both task names)
  - Import JSON (shows task count)
  - Clear All Data
- **Viewport vs Content**: Canvas panning is NOT undoable - it's viewport navigation, not content modification
  - Prevents accidental redo stack clearing when looking around
  - You can undo, pan to inspect, then redo without losing redo history
- **Storage Quota Handling**: Automatically trims history to last 10 steps if localStorage quota exceeded
- **Circular Prevention**: `isUndoing` flag prevents recursive snapshots during undo/redo operations

#### Modifier Key Behaviors
| Action | Modifier | Visual Feedback |
|--------|----------|-----------------|
| Create child | Ctrl+Click | - |
| Delete node | Alt+Click | - |
| Drag node | None | Moves single node |
| Drag subtree | Shift+Drag | Moves all descendants together |
| Reparent task | Ctrl+Drag | Green solid line preview |
| Create dependency | Alt+Drag | Blue dashed line preview |
| Cycle status | Middle-click | Status changes immediately |

---

## Testing Guide

### Built-In Test Checklist

Click **"🧪 Test Checklist"** button to load comprehensive test scenarios. This creates a test root task with children covering all recent features:

1. **Middle-Click Status Cycling**
   - Middle-click pending → Working (yellow)
   - Middle-click again → Done (green)
   - Middle-click again → Pending (white)
   - Verify status bar updates
   - Verify only one task is Working

2. **Shift+Drag Subtree Movement**
   - Create task with children
   - Shift+drag parent
   - Verify entire subtree moves together
   - Verify relative positions preserved

3. **Incomplete Children Highlighting**
   - Create task with children
   - Mark task as Working
   - Verify incomplete children have red border
   - Mark child done → red border disappears

4. **Custom Modals Work**
   - Click Delete on task → modal appears
   - Click Cancel → modal closes, task remains
   - Delete again → Yes → task deletes

5. **Enhanced Status Bar**
   - Mark nested task as Working
   - Verify full path shows (Root > ... > Current)
   - Check completion percentage
   - Verify incomplete children listed by name
   - Path compresses if >4 levels deep

6. **Dependency Cleanup on Reparent**
   - Create dependency A→B with Ctrl+drag
   - Alt+drag A to B (reparent)
   - Verify dependency arrow disappears
   - Verify A is now child of B

7. **Visual Ctrl+Drag and Alt+Drag Distinction**
   - Ctrl+drag → solid green line (reparent)
   - Alt+drag → dashed blue line (dependency)

8. **Auto-Collapse Completed Subtrees**
   - Create parent with children
   - Mark all as Done
   - Verify subtree collapses
   - Click +N badge to expand

9. **Zoom Features**
   - Test all zoom methods (buttons, keyboard, wheel)
   - Verify clicks work at different zoom levels
   - Test zoom to fit with various task layouts

10. **Line Selection & Deletion**
    - Click parent-child line → highlights blue
    - Press Backspace → child becomes root
    - Click dependency line → highlights blue
    - Press Backspace → dependency removed
    - Verify hover makes lines blue (15px hit zone)

11. **Dark Mode**
    - Toggle dark mode
    - Verify black canvas background
    - Verify all colors adjusted properly
    - Verify text readable
    - Reload page → preference persists

### Manual Testing Checklist

**Basic Functionality**:
- [ ] Create root task
- [ ] Create child task
- [ ] Edit task name
- [ ] Delete task
- [ ] Middle-click status cycle
- [ ] Verify only one Working task

**Relationships**:
- [ ] Create dependency (Ctrl+drag)
- [ ] Reparent task (Alt+drag)
- [ ] Delete parent-child line
- [ ] Delete dependency line
- [ ] Verify cycle prevention

**Visibility**:
- [ ] Auto-collapse completed subtree
- [ ] Manual toggle with +N badge
- [ ] Verify hidden count accurate

**Canvas**:
- [ ] Pan canvas
- [ ] Zoom in/out/reset/fit
- [ ] Drag node
- [ ] Drag subtree (Shift+drag)
- [ ] Verify clicks accurate at all zoom levels

**UI**:
- [ ] Line hover turns blue
- [ ] Node hover shows border
- [ ] Selection highlights work
- [ ] Status bar shows working task
- [ ] Right-click context menu

**Persistence**:
- [ ] Export JSON
- [ ] Import JSON
- [ ] Reload page → data persists
- [ ] Dark mode persists
- [ ] Settings persist across sessions

---

## Architecture & Code Structure

### File Organization
`task-tree.html` (~2350 lines):

```
Lines 1-510:    CSS Styling
  - Component styles (buttons, inputs, modals)
  - Node states (pending, working, done, selected)
  - Line types (parent, dependency, other-parent)
  - Dark mode overrides
  - Responsive hover effects

Lines 511-585:  HTML Structure
  - Controls panel
  - SVG canvas with defs (arrowhead marker)
  - Modals (import, confirm, alert)
  - Status bar

Lines 586-2350: JavaScript Application
  - App state object (line 586)
  - Event handlers (lines 614-815)
  - Task management (lines 816-1150)
  - View controls (zoom, dark mode: 1151-1290)
  - Relationship management (lines 1291-1630)
  - Rendering engine (lines 1631-2290)
  - Persistence (lines 2293-2331)
```

### ⚙️ Configuration Pattern (READ THIS BEFORE ADDING FEATURES)

**RULE**: Any user-customizable parameter MUST be added to the `app` state object as a property, NOT hardcoded in functions.

**Why**: Single source of truth enables future UI controls, JSON import/export, and user customization without code changes.

**Current Configuration Parameters** (lines 761-766):
```javascript
// In app state object:
textLengthThreshold: 60,  // Character limit for truncation
charWidth: 8,             // Pixels per character for width calculation
nodePadding: 5,           // Left/right padding inside rectangles
minNodeWidth: 80,         // Minimum rectangle width
fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",  // Font stack for task text
fontWeight: 500           // Font weight: 400=normal, 500=medium, 600=semibold, 700=bold
```

**How to Add New Customizable Parameter**:
1. Add to `app` state object (around line 760) with clear comment
2. Replace ALL hardcoded uses with `this.parameterName`
3. Document here in this section
4. Add to CLAUDE.md configuration examples
5. Consider adding UI control in future

**Examples of what should be configurable**:
- ✅ Visual sizing (charWidth, padding, minWidth)
- ✅ Text thresholds (textLengthThreshold)
- ✅ Typography (fontFamily, fontWeight)
- ✅ UI preferences (darkMode)
- ✅ Zoom settings (zoomLevel, minZoom, maxZoom)
- ❌ Fixed constants (rectHeight: 40, always stays 40)

**Anti-pattern** (DON'T DO THIS):
```javascript
// ❌ BAD: Hardcoded in function
const padding = 5;
const charWidth = 7;
```

**Correct pattern** (DO THIS):
```javascript
// ✅ GOOD: Reference app state
const padding = this.nodePadding;
const charWidth = this.charWidth;
```

### ⚙️ Settings UI

**Access**: Click the "⚙️ Settings" button in the toolbar

The Settings modal provides a user-friendly interface to customize all configuration parameters without editing code:

**Available Settings**:
- **Text Truncation Length** (20-200): Characters before text is truncated with "..." (default: 80)
- **Character Width** (4-15px): Pixels per character for node width calculation (default: 8.5)
- **Node Padding** (0-50px): Left/right padding inside task rectangles (default: 30)
- **Minimum Node Width** (40-200px): Minimum rectangle width regardless of text length (default: 100)
- **Enable Multiline Text**: Toggle multiline text support (default: enabled)
- **Max Node Width** (100-2000px): Maximum node width before text wraps to next line (default: 600)
- **Max Node Height** (0-1000px): Maximum node height in pixels, 0 = unlimited (default: 0)
- **Line Height** (12-40px): Vertical spacing between lines in pixels (default: 20)
- **Word Wrap Mode**: Wrap on word boundaries (enabled) vs character boundaries (disabled) (default: enabled)
- **Arrow Style**: Choose between Straight (default) or Curved arrow paths
- **Arrow Curvature** (0.05-0.5): Intensity of curve for curved arrows - 0.05 = subtle, 0.5 = dramatic (default: 0.25)
- **Font Family**: CSS font stack (default: Fira Code with monospace fallbacks)
- **Font Weight**: Text weight from Light (300) to Bold (700)
- **Show Delete Confirmation**: Toggle confirmation dialog when deleting tasks (default: enabled)
- **Auto-Hide Completed Nodes**: Automatically hide child nodes when they and their parent are marked done (default: enabled)
- **Max Undo History** (5-200): Maximum number of undo steps to keep in history (default: 50)
  - Higher values use more memory but provide deeper history
  - Excess snapshots automatically trimmed when limit is reduced

**Features**:
- ✨ **Live Preview**: Changes apply immediately when you click "Apply"
- 💾 **Auto-Save**: Settings persist to localStorage automatically
- 🔄 **Reset to Defaults**: "Reset to Defaults" button restores original values
- 📋 **Dynamic Form**: Form is generated automatically from configuration metadata
- 📜 **History Management**: Dedicated section showing undo/redo stats
  - Live display of undo step count vs limit (e.g., "15 / 50")
  - Redo step count
  - Estimated memory usage in KB
  - Clear History button to manually free up storage space
  - Confirmation dialog prevents accidental clearing

**Implementation Details**:
- `showSettingsModal()` - Dynamically generates form from config metadata, updates history stats display, adds ESC/click-outside handlers
- `hideSettingsModal()` - Closes modal and cleans up event listeners
- `applySettings()` - Reads form values, updates app state, enforces undo limit, re-renders, saves
- `resetSettings()` - Restores default values with confirmation dialog
- `exportSettings()` - Copies current settings as JSON to clipboard
- `clearUndoHistory()` - Clears all undo/redo history with confirmation, updates stats display
- `enforceUndoLimit()` - Trims undo stack to maxUndoSteps when limit is exceeded or changed
- Configuration metadata in `configDefs` object defines labels, types, ranges, descriptions

**User Interaction**:
- **ESC Key**: Press Escape to close without saving
- **Click Outside**: Click modal backdrop to cancel
- **Export Settings**: Copies clean JSON of current settings for easy sharing with others

**How Settings Are Stored**:
Settings are saved as part of the app state in localStorage. When you export tasks via "Export JSON", configuration values are included, allowing you to share customized appearances.

### Key Functions

**Task Management**:
- `addRootTask()` - Create top-level task
- `addChildTask(parentId)` - Create child of existing task
- `deleteTask(taskId)` - Remove task and cleanup relationships
- `cycleTaskStatus(taskId)` - Pending → Working → Done → Pending
- `startEditing(taskId)` / `finishEditing()` - Inline text editing

**Relationships**:
- `addDependency(fromId, toId)` - Create dependency with cycle check
- `removeDependency(fromId, toId)` - Remove dependency
- `reparentTask(childId, newParentId)` - Change parent with cleanup
- `wouldCreateCycle(fromId, toId)` - Prevent circular dependencies
- `getAncestors(taskId)` - Get all parents up to root
- `getDescendants(taskId)` - Get all children recursively

**Visibility**:
- `toggleHidden(taskId)` - Show/hide subtree
- `autoCollapseCompleted(task)` - Smart auto-collapse logic
- `getHiddenChildrenCount(taskId)` - Count for badge

**Notifications**:
- `showToast(message, type, duration)` - Show non-blocking toast notification
  - Types: `'success'` (green), `'error'` (red), `'info'` (blue)
  - Duration: milliseconds (default 4000)
  - Auto-dismisses and is clickable to dismiss early
  - Usage: `this.showToast('Operation completed!', 'success')`
- `showAlert(title, message)` - Show blocking modal (for critical messages)
- `showConfirm(title, message, callback)` - Show confirmation dialog

**Rendering**:
- `render()` - Main render loop (lines 2014-2205)
  - Applies zoom via SVG viewBox
  - Renders links (parent, dependency, other-parent)
  - Renders nodes with status classes
  - Handles editing mode with foreignObject input
  - Adds hidden children badges
- `updateStatusBar()` - Status bar content and visibility
- `createLine(x1, y1, x2, y2, classes)` - SVG line helper

**Coordinate System**:
- `getSVGPoint(event)` - Convert client coordinates to SVG space
  - Uses `getScreenCTM().inverse()` for proper transformation
  - Critical for accurate clicks at any zoom level

**Mouse Interactions**:
- `onCanvasMouseDown(e)` - Initiates drag modes, early return for lines
- `onCanvasMouseMove(e)` - Updates positions during drag
- `onCanvasMouseUp(e)` - Completes drag, creates relationships

**Persistence & Performance**:
- `saveToStorage()` - Serialize app state to localStorage (lines 4880-4930)
  - Saves all tasks, undo/redo stacks, settings, homes
  - Handles QuotaExceededError by trimming undo history
  - Called immediately after most operations
- `debouncedSaveToStorage(delay)` - Debounced save for frequent operations (lines 4862-4878)
  - Used for canvas panning to prevent performance issues
  - Waits `delay` ms after last call before saving (default 500ms)
  - Prevents excessive localStorage writes during rapid interactions
  - ~95% reduction in saves during panning operations
- `loadFromStorage()` - Restore app state from localStorage
  - Handles missing/corrupted data gracefully with defaults

**Selection**:
- `selectNode(taskId)` - Select node, uses requestAnimationFrame to defer render
- `deleteLine(lineObj)` - Delete selected line (parent or dependency)

### Transform-Based Rendering Architecture

**Why Transform-Based Positioning?**

The app uses SVG `<g transform="translate(x, y)">` groups instead of absolute positioning on individual elements. This enables:
- **GPU-accelerated animations**: CSS transitions on `transform` are hardware-accelerated
- **Smooth navigation**: Nodes slide smoothly when jumping between Homes
- **Proper SVG patterns**: Standard approach for grouping and positioning SVG elements

**How It Works**:

Each task node is wrapped in a `<g>` element with a transform:
```svg
<g class="task-node" data-id="5" transform="translate(500, 300)">
  <rect x="-50" y="-20" width="100" height="40" />  <!-- Relative to group center -->
  <text x="0" y="5">Task Name</text>  <!-- Relative to group center -->
</g>
```

**Animation Implementation**:

When jumping to a Home, a cinematic 3-phase animation plays (1.3 seconds total):
1. **Phase 1 (300ms)**: Zoom out to overview level using requestAnimationFrame
2. **Phase 2 (500ms)**: Add `.animating-view` class and update node transforms
   - CSS applies `transition: transform 0.5s` to smoothly pan nodes
   - Lines fade out via `opacity: 0` (CSS transitions don't work on SVG line attributes)
   - Stays at overview zoom for spatial context
3. **Phase 3 (500ms)**: Zoom in to target zoom level using requestAnimationFrame
4. After completion: remove `.animating-view` class and re-render with perfect arrows

**Technical Limitation**:

SVG line attributes (`x1`, `y1`, `x2`, `y2`) are XML attributes, not CSS properties, so `transition: x1 0.5s` is ignored by browsers. The professional solution is to fade lines out during position changes and fade them back in afterward.

**Location in Code**:
- Transform-based node rendering: lines 3397-3634 in task-tree.html
- Animation CSS: lines 666-681
- `jumpToHome()` animation logic: lines 4206-4245

### Important Patterns

**SVG Event Handling**:
```javascript
// Two-layer approach for lines:
// 1. Invisible wide line for easy clicking (15px, pointer-events: stroke)
// 2. Visible thin line for display (2px, pointer-events: none)
// CSS: .hit-line:hover + .visible-line { style changes }
```

**Render Deferral**:
```javascript
// Defer render to prevent breaking double-click detection
selectNode(taskId) {
    this.selectedTaskId = taskId;
    requestAnimationFrame(() => this.render());
}
```

**Click vs Drag**:
```javascript
// Store original position on mousedown
// On mouseup: if distance < 5px → click, else → drag
const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
if (dist < 5) handleClick();
```

**Zoom Implementation**:
```javascript
// SVG viewBox approach (not CSS transform)
const viewBoxWidth = this.viewBox.width / this.zoomLevel;
svg.setAttribute('viewBox', `${x} ${y} ${viewBoxWidth} ${viewBoxHeight}`);
```

---

## UI/UX Design System

### Color Palette

**Light Mode**:
- Background: `linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)`
- Controls: `linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)`
- Status Bar: `linear-gradient(135deg, #434343 0%, #000000 100%)`
- Nodes:
  - Pending: `#ffffff` (white) / Border: `#555`
  - Working: `#fff8e1` (light yellow) / Border: `#ff9800` (orange)
  - Done: `#e8f5e9` (light green) / Border: `#4caf50` (green)
  - Selected: Border: `#007bff` (blue)
- Lines: `#90a4ae` (blue-grey)
- Hover: `#007bff` (blue)

**Dark Mode**:
- Background: `#0a0a0a` (almost black)
- Canvas: `#000000` (pure black)
- Nodes:
  - Pending: `#2d3748` (dark grey) / Border: `#4a5568`
  - Working: `#4a3f2d` (dark amber) / Border: `#ed8936` (orange)
  - Done: `#2d4a2f` (dark green) / Border: `#48bb78` (bright green)
  - Selected: Border: `#4299e1` (bright blue)
- Text: `#e2e8f0` (light grey)
- Lines:
  - All lines: `#ffffff` (white)
  - Parent links: Solid, `2.5px` width
  - Dependencies: Dashed, `2.5px` width
  - Other parents: Dashed, `2px` width
  - Arrowheads: `#ffffff` (white)
  - Hover/Select: `#4299e1` (blue)

### Typography
- Font: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`
- Node Text: `14px`, weight `500`, color `#37474f` (light) / `#e2e8f0` (dark)
- Buttons: `14px`, weight `500`
- Status Bar: `13px`

### Spacing & Sizing
- Node Padding: `20px`
- Node Height: `40px`
- Node Border Radius: `8px`
- Line Width: `2px` (visible), `15px` (hit detection)
- Control Panel Padding: `14px 24px`
- Button Border Radius: `8px`
- Gap Between Controls: `10px`

### Toast Notifications
- **Position**: Fixed bottom-right corner (24px from edges)
- **Types**:
  - Success: Green border (`#4caf50`), light green background (`#f1f8e9`)
  - Error: Red border (`#f44336`), light red background (`#ffebee`)
  - Info: Blue border (`#2196f3`), light blue background (`#e3f2fd`)
- **Animation**: Slide in from right (0.3s), auto-dismiss with slide out (0.3s after 3.7s)
- **Duration**: 4000ms default, customizable
- **Behavior**: Stackable, clickable to dismiss early, non-blocking

### Shadows & Effects
- Nodes: `drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))`
- Working Node: `drop-shadow(0 3px 8px rgba(255, 152, 0, 0.4))`
- Done Node: `drop-shadow(0 2px 6px rgba(76, 175, 80, 0.3))`
- Selected Node: `drop-shadow(0 0 4px rgba(0, 123, 255, 0.6))`
- Buttons: `box-shadow: 0 2px 8px rgba(0,0,0,0.2)`
- Hover Buttons: `transform: translateY(-1px)` + stronger shadow

### Transitions
- All interactive elements: `transition: all 0.3s ease`
- Smooth color changes, position shifts, shadow adjustments

---

## Future Improvements

### High Priority

1. **Undo/Redo System**
   - Track command history
   - Ctrl+Z / Ctrl+Shift+Z shortcuts
   - Show undo stack in UI

2. **Search & Filter**
   - Search tasks by title
   - Filter by status (pending/working/done)
   - Highlight matching nodes
   - Quick navigation to results

3. **Due Dates & Reminders**
   - Add optional due dates to tasks
   - Visual indicators for overdue tasks
   - Sort by date
   - Browser notifications

4. **Tags & Categories**
   - Color-coded tags
   - Filter by tag
   - Multi-tag support
   - Tag management UI

5. **Export Formats**
   - Export to Markdown (nested lists)
   - Export to CSV
   - Export as image (PNG/SVG)
   - Print-friendly view

### Medium Priority

6. **Keyboard Navigation**
   - Tab through tasks
   - Arrow keys to move selection
   - Quick status change (Space bar)
   - Focus management

7. **Multi-Select**
   - Select multiple nodes (Ctrl+Click)
   - Bulk operations (delete, status change)
   - Group move

8. **Task Notes**
   - Expandable description field
   - Rich text support
   - Show indicator when notes exist
   - Toggle details panel

9. **Templates**
   - Save common task structures
   - Quick load templates
   - Template library
   - Share templates via JSON

10. **Performance Optimization**
    - Virtual rendering for 1000+ nodes
    - Lazy loading for large graphs
    - Debounce expensive operations
    - Canvas rendering for very large graphs

### Low Priority / Nice to Have

11. **Collaboration Features**
    - Backend integration
    - Real-time sync
    - User avatars on tasks
    - Change history

12. **Mobile Support**
    - Touch gestures
    - Responsive layout
    - Mobile-optimized controls
    - Pinch to zoom

13. **Themes**
    - Multiple color schemes
    - Custom theme editor
    - Import/export themes

14. **Analytics**
    - Completion statistics
    - Time tracking
    - Productivity charts
    - Task history

15. **Accessibility**
    - ARIA labels
    - Keyboard-only navigation
    - Screen reader support
    - High contrast mode

### Code Quality

16. **Testing**
    - Unit tests for core functions
    - E2E tests for user flows
    - Visual regression tests
    - Automated testing in CI

17. **Modularization**
    - Split into modules if project grows
    - Consider build step for optimization
    - TypeScript for type safety

18. **Documentation**
    - Inline JSDoc comments
    - API documentation
    - Video tutorials
    - Interactive onboarding

---

## Future: Server Sync & Shared Graphs

### Current Architecture
- **Single HTML file**: Runs 100% client-side, zero dependencies
- **localStorage**: All data stored in browser only
- **No backend**: Completely offline-capable
- **Single-user**: Each browser has its own isolated graph

### Proposed: Multi-Mode Storage System

Allow users to choose between **Local Mode** (current) and **Server Mode** (shared graphs accessible via URL).

**Use Cases:**
- **Local Mode**: Personal task management, privacy-focused, works offline
- **Server Mode**: Team collaboration, access from multiple devices, shareable via URL
- **No authentication**: Simple shared access, anyone with URL can view/edit

---

### Option 1: REST API Server (Recommended)

**Effort:** ~6-8 hours development + minimal server setup
**Cost:** $0-5/month (free tier or minimal hosting)
**Complexity:** ⭐⭐☆☆☆ Medium

#### Architecture

```
Client (task-tree.html)
    ↓ HTTP requests
Server (Node.js + Express)
    ↓ File system
JSON files (graphs/project-name.json)
```

#### Server Implementation (~100-150 lines)

**Minimal Node.js + Express server:**

```javascript
const express = require('express');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// GET /api/graph/:id - Load graph
app.get('/api/graph/:id', (req, res) => {
  const path = `./graphs/${req.params.id}.json`;
  if (fs.existsSync(path)) {
    res.json(JSON.parse(fs.readFileSync(path)));
  } else {
    res.status(404).json({ error: 'Graph not found' });
  }
});

// POST /api/graph/:id - Save graph (auto-saves with debounce)
app.post('/api/graph/:id', (req, res) => {
  const path = `./graphs/${req.params.id}.json`;
  fs.writeFileSync(path, JSON.stringify(req.body, null, 2));
  res.json({ success: true, timestamp: Date.now() });
});

// GET /api/graphs - List all graphs
app.get('/api/graphs', (req, res) => {
  const files = fs.readdirSync('./graphs')
    .filter(f => f.endsWith('.json'))
    .map(f => ({ id: f.replace('.json', ''),
                 modified: fs.statSync(`./graphs/${f}`).mtime }));
  res.json(files);
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

#### Client Changes (~250 lines)

**1. Storage Abstraction Layer:**

```javascript
// Add to app state
storageMode: 'local',           // 'local' or 'server'
serverUrl: 'http://localhost:3000/api',
graphId: 'default',
autoSaveDelay: 2000,            // Debounce server saves (2 seconds)
saveTimeout: null,
lastServerSync: null,

// Abstract save method
async saveData() {
  if (this.storageMode === 'local') {
    this.saveToStorage();       // Current localStorage implementation
  } else {
    this.debouncedServerSave(); // New server save
  }
}

// Debounced server save (prevents spam on every keystroke)
debouncedServerSave() {
  clearTimeout(this.saveTimeout);
  this.saveTimeout = setTimeout(async () => {
    try {
      const response = await fetch(`${this.serverUrl}/graph/${this.graphId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: this.tasks,
          taskIdCounter: this.taskIdCounter,
          darkMode: this.darkMode,
          zoomLevel: this.zoomLevel,
          // ... all other persisted state
        })
      });

      if (response.ok) {
        this.lastServerSync = Date.now();
        this.showToast('✓ Synced to server', 'success', 2000);
      } else {
        throw new Error('Server returned error');
      }
    } catch (error) {
      this.showToast('⚠ Server sync failed - using local storage', 'error');
      this.saveToStorage(); // Fallback to localStorage
    }
  }, this.autoSaveDelay);
}

// Abstract load method
async loadData() {
  if (this.storageMode === 'local') {
    this.loadFromStorage();     // Current localStorage implementation
  } else {
    await this.loadFromServer();
  }
}

async loadFromServer() {
  try {
    const response = await fetch(`${this.serverUrl}/graph/${this.graphId}`);
    if (!response.ok) throw new Error('Graph not found');

    const data = await response.json();
    this.tasks = data.tasks || [];
    this.taskIdCounter = data.taskIdCounter || 0;
    // ... restore all state

    this.lastServerSync = Date.now();
    this.showToast('✓ Loaded from server', 'success', 2000);
  } catch (error) {
    this.showToast('⚠ Server load failed - using local storage', 'error');
    this.loadFromStorage(); // Fallback to localStorage
  }
}
```

**2. URL Parameter Support:**

```javascript
// On app init, check URL for graph parameter
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('graph')) {
  this.graphId = urlParams.get('graph');
  this.storageMode = 'server';
  // URL: task-tree.html?graph=my-project
}
```

**3. Settings UI Updates:**

```javascript
// Add to configDefs in Settings modal
storageMode: {
  label: 'Storage Mode',
  type: 'select',
  default: 'local',
  options: [
    { value: 'local', label: 'Local (Browser Only)' },
    { value: 'server', label: 'Server (Shared)' }
  ],
  description: 'Local = localStorage, Server = shared via URL'
},

serverUrl: {
  label: 'Server URL',
  type: 'text',
  default: 'http://localhost:3000/api',
  description: 'API endpoint (only used in Server mode)'
},

graphId: {
  label: 'Graph ID',
  type: 'text',
  default: 'default',
  description: 'Graph name on server (e.g., "my-project")'
}
```

**4. Replace All Save Calls:**

```javascript
// Find/replace throughout codebase:
this.saveToStorage();
// With:
this.saveData();

// Current locations: ~25 calls across all operations
```

#### User Experience

**Local Mode (current behavior):**
```
- Open task-tree.html
- All data in browser localStorage
- No internet required
- Private to this browser
```

**Server Mode:**
```
1. Setup: Enter server URL in Settings (one-time)
2. Choose graph ID (e.g., "team-roadmap")
3. Click "Apply" → loads from server
4. Make changes → auto-saves to server (2-second debounce)
5. Share URL: task-tree.html?graph=team-roadmap
```

**Conflict Handling:**
- **Last-write-wins**: Simple, no merge conflicts
- Future: Add timestamp comparison, show warning if server version is newer

#### Deployment Options

| Platform | Cost | Setup Time | Pros |
|----------|------|------------|------|
| **Localhost** | Free | 1 min | Development, no public access |
| **Railway** | $5/mo | 5 min | Easy deploy, automatic HTTPS |
| **Heroku** | $5/mo | 10 min | Reliable, well-documented |
| **DigitalOcean** | $5/mo | 15 min | Full control, SSH access |
| **Vercel (serverless)** | Free | 5 min | Zero config, automatic scaling |
| **Netlify Functions** | Free | 5 min | Integrated with static hosting |

**Recommended:** Start with **Vercel** or **Railway** for simplicity.

#### Pros & Cons

✅ **Pros:**
- Full control over data and server
- Simple sharing via URL parameter
- Works on local network (no cloud required)
- Easy to extend (add auth, versioning, search later)
- Fallback to localStorage if server unavailable

⚠️ **Cons:**
- Requires server deployment and maintenance
- Need internet connection for server mode
- No built-in conflict resolution (last-write-wins)
- Server costs ($0-5/month)

---

### Option 2: GitHub Gist as Backend (No Server Required!)

**Effort:** ~3-4 hours development
**Cost:** $0 (free forever)
**Complexity:** ⭐☆☆☆☆ Low

#### Architecture

```
Client (task-tree.html)
    ↓ GitHub API (HTTPS)
GitHub Gist (public/private)
    ↓ JSON file storage
```

#### Implementation (~150 lines)

```javascript
// Add to app state
storageMode: 'local',           // 'local' or 'gist'
gistId: null,                   // e.g., 'abc123def456789'
githubToken: null,              // Optional for auto-save

async loadFromGist() {
  if (!this.gistId) {
    this.showToast('⚠ Gist ID not configured', 'error');
    return;
  }

  try {
    const response = await fetch(`https://api.github.com/gists/${this.gistId}`);
    const gist = await response.json();
    const data = JSON.parse(gist.files['task-tree.json'].content);

    this.tasks = data.tasks || [];
    // ... restore all state

    this.showToast('✓ Loaded from Gist', 'success');
  } catch (error) {
    this.showToast('⚠ Gist load failed', 'error');
    this.loadFromStorage();
  }
}

async saveToGist() {
  if (!this.gistId || !this.githubToken) {
    // Show modal with JSON to copy manually
    this.showManualGistUpdate();
    return;
  }

  try {
    await fetch(`https://api.github.com/gists/${this.gistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${this.githubToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: {
          'task-tree.json': {
            content: JSON.stringify(this.getFullState(), null, 2)
          }
        }
      })
    });

    this.showToast('✓ Saved to Gist', 'success');
  } catch (error) {
    this.showToast('⚠ Gist save failed', 'error');
  }
}
```

#### User Flow

**Setup (one-time):**
1. Go to https://gist.github.com/
2. Create new Gist with filename `task-tree.json`
3. Paste initial data: `{"tasks": [], "taskIdCounter": 0}`
4. Click "Create public/secret gist"
5. Copy Gist ID from URL (e.g., `abc123def456`)
6. In Settings: Enter Gist ID
7. (Optional) Create GitHub Personal Access Token for auto-save
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token with `gist` scope
   - Enter token in Settings

**Daily Use:**
- **With token**: Auto-save on every change (just like localStorage)
- **Without token**: Click "Copy JSON" → Manually update Gist

**Sharing:**
- Share Gist URL: `https://gist.github.com/username/abc123def456`
- Collaborators copy Gist ID into their Settings
- Everyone reads from same Gist
- Manual coordination for writes (or use tokens)

#### Pros & Cons

✅ **Pros:**
- **Zero server maintenance**
- **Free forever** (GitHub provides hosting)
- **Built-in version history** (every Gist update is versioned)
- **Easy sharing** (just share Gist URL)
- **Privacy options** (secret Gists not indexed by search)
- **Works anywhere** (no server deployment needed)

⚠️ **Cons:**
- **Requires GitHub account**
- **Manual token setup** for auto-save (otherwise copy/paste)
- **Rate limits**: 60 requests/hour without auth, 5000/hour with token
- **No control over hosting** (dependent on GitHub)
- **Public data** (unless using secret Gist)

---

### Comparison Table

| Feature | Option 1: REST API | Option 2: GitHub Gist |
|---------|-------------------|----------------------|
| **Development Time** | 6-8 hours | 3-4 hours |
| **Code Changes** | ~350 lines | ~150 lines |
| **Server Required** | Yes | No |
| **Monthly Cost** | $0-$5 | $0 |
| **Setup Complexity** | Medium | Low |
| **Sharing Method** | URL parameter | Gist URL |
| **Auto-Save** | Yes (always) | Yes (with token) |
| **Conflict Resolution** | Last-write-wins | Last-write-wins |
| **Version History** | Manual | Built-in |
| **Data Control** | Full | GitHub owns |
| **Privacy** | Configurable | Public/secret only |
| **Offline Fallback** | localStorage | localStorage |
| **Rate Limits** | None | 60-5000/hour |
| **Maintenance** | Server upkeep | None |
| **Extensibility** | Easy (full API) | Limited (GitHub API) |

---

### Recommendation

**For prototyping/personal use:**
→ **GitHub Gist** (faster to implement, zero maintenance)

**For team collaboration/production:**
→ **REST API Server** (more control, better UX, easier to extend)

**Hybrid Approach:**
1. Start with **Gist** to validate the multi-mode storage pattern
2. Migrate to **REST API** when you need more features
3. Code is structured to support both (just swap storage backend)

---

### Implementation Phases

**Phase 1: Storage Abstraction** (2-3 hours)
- Add `saveData()` / `loadData()` abstraction
- Add mode selection to Settings
- Replace all `saveToStorage()` calls
- Test with localStorage (no behavior change)

**Phase 2A: GitHub Gist Backend** (1-2 hours)
- Implement Gist API calls
- Add Gist ID / token to Settings
- Test load/save cycle
- Add manual JSON export fallback

**Phase 2B: REST API Backend** (4-5 hours)
- Create Node.js server
- Implement three endpoints
- Add URL parameter handling
- Deploy to hosting platform
- Test collaborative editing

**Phase 3: Polish** (1-2 hours)
- Sync status indicator
- Last synced timestamp
- Conflict detection warnings
- Error handling improvements

**Total Time:** 3-4 hours (Gist) or 6-8 hours (REST API)

---

### Technical Considerations

**Data Consistency:**
- Both options use "last-write-wins" (no merge conflicts)
- Future: Add timestamp comparison to warn about overwrites
- Future: Implement operational transforms for true collaboration

**Performance:**
- Debounce saves (2-second delay) to reduce API calls
- Client-side caching with version checking
- Optimistic updates (save locally first, sync in background)

**Security:**
- No authentication in v1 (shared access via URL knowledge)
- Future: Add API keys, user accounts, role-based access
- GitHub token stored in browser (not in Gist itself)

**Browser Compatibility:**
- Fetch API: All modern browsers (IE11 needs polyfill)
- Async/await: All modern browsers
- localStorage: Universal support

---

### Not Recommended: Real-Time Collaboration

**Why not WebSockets/CRDT?**

Real-time collaborative editing (like Google Docs) requires:
- WebSocket server for live connections
- Operational Transform or CRDT for conflict resolution
- Presence indicators (who's editing what)
- Cursor position sharing
- Complex undo/redo with collaborative awareness

**Complexity:** ⭐⭐⭐⭐⭐ Very High (40-60 hours)
**Value:** Low for task management use case

**Stick with "last-write-wins" + manual coordination** for now.

---

## Development History

### Session 1: Initial Implementation (Lines 1-1750)
- Core task management
- Basic graph rendering
- Parent-child relationships
- Dependency tracking
- Status cycling
- localStorage persistence
- Modal system

### Session 2: Feature Enhancements & Polish
- **Drag Behavior Swap**: Swapped Ctrl+drag and Alt+drag - Ctrl now reparents (more intuitive), Alt creates dependencies
- **Dark Mode Line Fix**: Fixed dark mode line visibility and clickability
  - Visible lines: Pure white (#ffffff), slightly thicker (2.5px)
  - Dashed/solid distinction maintained via stroke-dasharray
  - Hit lines: Invisible 15px transparent zones for easy clicking (not styled in dark mode)
  - Blue (#4299e1) reserved for hover/select states only
  - Invisible hit zones preserved in dark mode for proper click detection
- **Auto-Collapse Bug Fix**: Fixed critical auto-collapse issues
  - Root tasks no longer disappear when completed (root tasks can never be auto-hidden)
  - Only processes clicked task and its direct relationships, not all tasks on board
  - Respects manual hiding - won't auto-hide if children are manually hidden
  - Properly recurses up parent chain to collapse ancestors if needed
  - Tasks only hidden if parent is BOTH existent AND completed
- **Toast Notification System**: Created reusable toast notification system
  - Auto-dismisses after 4 seconds
  - Stackable (multiple toasts appear simultaneously)
  - Three types: success (green), error (red), info (blue)
  - Slides in from right, slides out after duration
  - Click to dismiss early
  - Can be used for any feedback throughout the app
- **Copy Task Text**: Added "Copy Text" option to right-click context menu
  - Copies task title to clipboard
  - Shows green success toast notification
- **Ctrl+Drag Enhanced**: Unified interface for both reparenting and creating positioned children
  - **Visual feedback**: Always shows line from source to cursor
    - Green line when over different node (reparent mode)
    - Blue line when over empty space (create child mode)
  - **Elliptical offset positioning**: Preview positioned using ellipse math
    - Horizontal drag (0°/180°): offset = rectWidth/2 + padding
    - Vertical drag (90°/270°): offset = rectHeight/2 + padding
    - Diagonal: smooth blend using `atan2` angle calculation
    - Keeps preview edge at consistent distance from cursor
    - No jumping at any angle - perfectly smooth rotation
  - **Smart visibility**: Preview disappears when hovering over source node or any other node
  - **`elementFromPoint` detection**: Correctly detects target under cursor during drag
  - **Reparent**: Drag to different node, release to reparent
  - **Create positioned child**: Drag to empty space, release to create at cursor position
  - New child immediately enters edit mode for inline naming
- **Shift+Double Click Shortcut**: Quick keyboard shortcut to toggle children visibility
  - Shift+double click any node to hide/show its children
  - Uses same red +N badge system as context menu toggle
  - Faster workflow than right-click → Hide/Show Children
- **Arrow Direction Indicators**: Parent-child lines show pixel-perfect directional arrows
  - Solid arrow on main parent lines pointing from parent → child
  - Arrow on other parent relationships (secondary parents)
  - Dependency lines show dashed arrows
  - **Pixel-Perfect Positioning**: Arrows start exactly at rectangle edge, not center
    - Uses vector math to calculate line-to-rectangle intersection
    - Handles any angle (0°-360°) correctly
    - Cross-multiplication avoids division for edge detection
    - Arrows sit perfectly on the boundary of boxes
- **Dependency Arrow Direction Fix**: Arrow matches drag direction intuitively
  - Alt+drag from A to B: arrow shows A → B (not backwards)
  - Semantic: B depends on A (A is prerequisite of B)
  - Arrow matches visual drag motion
  - Fixed by reversing dependency order in addDependency call
  - Updated to: `addDependency({ dependentId, prerequisiteId })` named parameters
- **Defensive Parameter Order Fix**: All relationship functions use named object parameters
  - `addDependency({ dependentId, prerequisiteId })` - impossible to swap parameters
  - `createChildAtPosition({ parentId, x, y })` - clear parameter names
  - `reparentTask({ taskId, newParentId })` - explicit semantics
  - Prevents accidental parameter-order bugs that were hard to debug
  - Makes code self-documenting and less error-prone
- **Fixed Reparent Semantics**: Drag direction now matches arrow direction
  - **OLD**: Ctrl+drag A→B made A child of B (arrow B→A, backwards from drag)
  - **NEW**: Ctrl+drag A→B makes B child of A (arrow A→B, matches drag!)
  - Intuitive: dragging creates children in the direction you drag
  - Preview arrow always shows source→target (matches final result)
- **Consistent Arrow Direction During Drag**: All drag operations show intuitive arrows
  - **Reparent (Ctrl+drag to node)**: Shows source → target (drag direction)
  - **Create Child (Ctrl+drag to empty)**: Shows source → position (drag direction)
  - **Dependency (Alt+drag)**: Shows prerequisite → dependent (drag direction)
  - All three operations: drag direction = arrow direction

### Session 2 (Earlier): Feature Enhancements
- **Zoom System**: Multi-input zoom (buttons, keyboard, mouse wheel, fit)
- **Coordinate Fix**: Proper SVG transformation for accurate clicks at any zoom
- **Hide Subtree**: Auto-collapse completed tasks with +N badge indicator
- **Status Bar**: Always-visible bar with default message, working task info
- **Click Redesign**: Right-click menu, Ctrl+Click child, Alt+Click delete
- **Node Selection**: Left-click selects, Backspace deletes, blue highlight
- **Line Selection**: Click-to-select lines, Backspace to delete relationships
- **Double-Click Fix**: requestAnimationFrame deferral to preserve event sequences
- **Line Interaction**: Wide hit zones (15px), blue hover, forgiving clicking
- **Visual Polish**: Modern gradients, emoji indicators (✅🔄), shadows, animations
- **Dark Mode**: Black canvas, adjusted colors, persistent preference
- **Control Panel**: Dark navy gradient, improved button styling

### Session 3: Custom Cursor & Simplified Text Truncation
- **Custom Rotating Cursor Arrow**: Interactive cursor during drag operations
  - Appears during Ctrl+drag (reparent/create child) and Alt+drag (dependencies)
  - SVG arrow icon that rotates based on drag angle using `Math.atan2(dy, dx)`
  - Fixed position SVG element following cursor at all times
  - Hides default cursor with CSS `cursor: none` on all canvas elements
  - 24×24px arrow with drop shadow for visibility
  - Cleans up automatically when drag ends
  - Works at any zoom level
- **Simplified Text Truncation**: Clean, intuitive text expansion
  - **Automatic truncation** at customizable character threshold (default: 60)
  - **Customizable via UI**: Number input in toolbar (10-100 chars)
  - **Click to expand**: Single click on truncated node expands to full text
  - **Lock button (🔓/🔒)**: Appears on expanded nodes
    - 🔓 unlocked = will collapse when stopping work
    - 🔒 locked = permanently expanded
    - Disabled (greyed out) when task is "working"
  - **Smart unlock behavior**:
    - If node selected → stays expanded when unlocking
    - If node NOT selected → immediately collapses when unlocking
  - **Auto-expand on working**: Tasks being worked on auto-expand
    - Collapse when stopping work if unlocked
    - Stay expanded if locked
  - **Persistent state**: Both `textExpanded` and `textLocked` saved per task
  - **Dynamic sizing**: Node width adjusts based on displayed text
  - **Smooth animations**: CSS transitions for width changes
  - **Lock button positioning**: Positioned outside box to the left with background circle
  - **Arrow positioning fix**: Arrows now snap to correct rect edge when text expands/collapses
    - Calculates display title in link rendering (not just node rendering)
    - Arrows always point to current node size, not full title size
  - **Enhanced truncation indicator**: Initially changed from "..." to "...►" (blue, 120% size)
    - Later simplified to plain "..." in normal text color for cleaner appearance
    - Removed complex SVG tspan styling in favor of simple text concatenation
  - **Smart truncation logic**: Only truncate if worth it
    - Don't truncate if only 5 or fewer chars beyond threshold (e.g., 60→65)
    - Prevents awkward truncation for minimal text savings
  - **Hover reveal (REMOVED)**: Initially implemented hover-to-reveal feature
    - Attempted to show full text on hover by calling render()
    - **Critical bug**: Calling render() on hover destroyed all DOM elements mid-interaction
    - Broke drag functionality, click detection, and created "invisible blocking layer" effect
    - **Removed**: Hover handlers that triggered re-render (incompatible with render architecture)
    - **Lesson**: Don't call render() during active mouse interactions
  - **Optimized padding**: Node padding reduced from 20px → 17px → 10px → 5px → 0px → 5px (final)
    - Updated in 4 locations: node rendering + 3 arrow calculation sections
    - Preview node kept at 10px (independent)
  - **Centralized configuration**: Refactored hardcoded sizing values to app state
    - Added `charWidth: 8`, `nodePadding: 5`, `minNodeWidth: 80` to app state (lines 761-764)
    - Updated all 4 locations to reference `this.charWidth`, `this.nodePadding`, `this.minNodeWidth`
    - Enables easy future customization via UI controls or JSON config
    - Single source of truth for sizing parameters
    - **Pattern**: Any user-customizable parameter should be added to app state, not hardcoded
    - **Benefit**: Changed charWidth 7→8 with single line edit (not 4 edits)
  - **Font customization**: Added fontFamily configuration
    - `fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace"` in app state (line 764)
    - Applied to SVG text elements (line 2701) and edit input (line 2683)
    - Also set in CSS as fallback (line 163)
    - Beautiful monospace font for improved readability
    - Demonstrates configuration pattern in action
  - **Settings UI Modal**: Dynamic configuration interface
    - **⚙️ Settings Button**: Added to toolbar for easy access to all customization options
    - **Dynamic Form Generation**: Form built automatically from configuration metadata
    - **Available Settings**:
      - Text Truncation Length (20-200 chars)
      - Character Width (4-15px) - affects node sizing
      - Node Padding (0-20px) - internal spacing
      - Minimum Node Width (40-200px)
      - Font Family - CSS font stack with fallbacks
      - Font Weight - Light (300) to Bold (700)
      - Show Delete Confirmation - Toggle confirmation dialog when deleting
    - **Features**:
      - Live apply: Changes take effect immediately when clicking "Apply"
      - Auto-save: Settings persist to localStorage automatically
      - Reset to Defaults: Restore original values with confirmation dialog
      - Export/import: Settings included in JSON export for sharing configurations
    - **Implementation** (lines 1618-1788):
      - `showSettingsModal()` - Generates form from `configDefs` metadata object
      - `applySettings()` - Reads form values, updates app state, re-renders, saves
      - `resetSettings()` - Restores defaults with confirmation
      - `hideSettingsModal()` - Closes modal
    - **Configuration Metadata Pattern**: Each setting defined with:
      - `label`: Display name (e.g., "Character Width (px)")
      - `type`: Input type (number, text, select)
      - `default`: Default value for reset functionality
      - `min`/`max`/`step`: Constraints for number inputs
      - `options`: Array of {value, label} for select inputs
      - `description`: Help text explaining the setting
    - **User Experience**: Toast notification confirms successful apply/reset
    - **Benefit**: Non-technical users can customize appearance without editing code

### Session 4: Settings Enhancement & Physics Removal
- **Physics Feature Removal**: Completely removed physics simulation
  - Removed `togglePhysics()` function and physics button from toolbar
  - Removed `startPhysicsSimulation()` and all force calculation code
  - Removed `physicsEnabled` from app state and localStorage
  - Cleaned up all references from clearAllData and loadFromStorage
  - Removed `vx`/`vy` velocity properties (no longer needed)
  - **Rationale**: Feature was rarely used and added complexity
- **Settings Modal Improvements**:
  - **ESC Key Support**: Press Escape to close settings without saving
  - **Click-Outside to Close**: Click modal backdrop to cancel
  - Both properly clean up event listeners to prevent memory leaks
- **Export Settings Feature**:
  - New "Export Settings" button in Settings modal
  - Copies current configuration as clean JSON to clipboard
  - Enables easy sharing of customized defaults
  - Toast notification confirms successful copy
  - Format allows pasting settings directly to developer
- **Modal Button Visibility Fix**:
  - Fixed white text on white background bug in modals
  - Added proper color contrast for light mode modal buttons
  - Added complete dark mode styling for all modals
  - Styled node context menus for dark mode
  - All buttons now clearly visible in both light and dark modes

### Session 5: UI Simplification & Undo/Redo System

#### Phase 1-3: UI Simplification (Completed in previous session)
- **Toolbar Cleanup**: Removed "Add Root Task" button and input field for cleaner interface
- **Ctrl+Click Creation**: Click empty canvas space with Ctrl to create root tasks
- **Right-Click Menu**: Added "Create Task Here" option to empty space right-click menu
- **Mark Origin**:
  - "Mark Origin" button stores current task center and zoom level as reference point
  - Creates/updates "Origin Home" bookmark for easy return to starting view
  - Fixed panning logic - app moves tasks directly, not viewBox coordinates

#### Phase 4: Comprehensive Undo/Redo System
- **Full Snapshot-Based Undo**: Every operation creates a snapshot of the entire task array
  - Deep cloning using `JSON.parse(JSON.stringify())` ensures reliable state restoration
  - 50-step history limit with automatic trimming of oldest entries
  - Both undo and redo stacks persist to localStorage across sessions
- **Smart Edit Grouping**: Sequential edits to the same task within 2 seconds merge into single undo step
  - Prevents character-by-character undo during typing
  - Uses task ID matching and timestamp comparison
  - Replaces last snapshot instead of creating new one when grouping applies
- **Keyboard Shortcuts**:
  - Ctrl+Z (Cmd+Z on Mac): Undo
  - Ctrl+Shift+Z (Cmd+Shift+Z on Mac): Redo
  - Ctrl+Y (Windows alternative): Redo
- **Toast Notifications**: Every undo/redo shows descriptive toast with action description
  - Action descriptions truncated at 50 characters for readability
  - Success toast (green) shows "✓ Undone: [action]" or "✓ Redone: [action]"
  - Error toast (red) shows "Nothing to undo/redo" when stacks are empty
- **Comprehensive Operation Coverage** (20 saveSnapshot() integration points):
  - Task creation: root tasks, child tasks, Ctrl+Click, right-click menu
  - Task editing: finishEditing() with smart 2-second grouping by task ID
  - Task deletion: deleteTask() with truncated task title in description
  - Status cycling: cycleStatus() tracks pending/working/done transitions
  - Status toggle: toggleDone() for context menu mark done/pending (includes flow-state logic)
  - Visibility: toggleHidden() for show/hide children
  - Drag operations: Move task, move subtree (with 5px movement threshold)
  - Dependencies: addDependency() and removeDependency() with both task names
  - Data operations: importData() with task count, clearAllData()
  - Reparenting: createChildAtPosition() and reparentTask()
  - **NOT Undoable**: Canvas panning - viewport navigation doesn't clear redo stack
- **Storage Quota Handling**:
  - Try-catch wraps localStorage save operations
  - On QuotaExceededError: Automatically trims undo history to last 10 steps
  - Retries save after trimming, shows error toast if still fails
  - Prevents undo history from breaking app when storage fills up
- **Circular Prevention**: `isUndoing` flag prevents recursive snapshots
  - Set to true during undo()/redo() operations
  - saveSnapshot() returns early when flag is true
  - Prevents infinite loops and corrupted undo stacks
- **Updated Confirmation Dialog**: "Clear All Data" now says "can be undone with Ctrl+Z"
- **Help Text Update**: Added "Ctrl+Z: undo | Ctrl+Shift+Z: redo" to toolbar info span
- **Critical UX Fix**: Canvas panning does NOT create undo snapshots
  - Viewport navigation (panning) is distinct from content modification
  - Prevents panning from clearing the redo stack
  - Users can now undo, pan to look around, then redo without losing redo history
  - Moving individual tasks/subtrees still creates undo snapshots (content changes)
- **Flow State Enhancement**: Auto-start parent when completing working task
  - When marking a "currently working" task as done, automatically starts working on parent
  - Maintains productivity momentum: finish subtask → continue on parent goal
  - Only applies if parent exists and isn't already done
  - Shows informative toast notification with parent name
  - Implemented in both cycleStatus() (middle-click) and toggleDone() (context menu)
- **Golden Path Visualization**: Visual hierarchy arrows for working task
  - **Ancestor path**: Golden/amber (#f59e0b) glowing arrows from working task ALL the way to root
  - **Direct children**: Red (#f44336) for incomplete, Green (#4caf50) for done children
  - Shows complete context tree + progress at a glance
  - Implementation: `getWorkingTaskPath()` helper builds full path including working task itself
  - Rendering checks if both task AND parent are in ancestorPath set (fixed bug where only first parent was highlighted)
  - Children colored by completion status to highlight blockers (red) vs. completed work (green)
  - Custom SVG arrowhead marker for golden ancestor path
- **Implementation Details**:
  - State properties: undoStack, redoStack, maxUndoSteps (50), isUndoing, lastSnapshotTime, lastSnapshotTaskId
  - Functions: saveSnapshot(description, taskId), undo(), redo()
  - localStorage persistence: undoStack and redoStack arrays saved with full state
  - Each snapshot: { tasks: [...], description: string, timestamp: number }
- **How It Works Internally**:
  - **saveSnapshot()**: Deep clones current tasks array → pushes to undoStack → clears redoStack
  - **undo()**: Saves current to redoStack → pops from undoStack → restores tasks
  - **redo()**: Saves current to undoStack → pops from redoStack → restores tasks
  - **Deep cloning**: `JSON.parse(JSON.stringify())` prevents reference corruption
  - **isUndoing flag**: Prevents infinite loops (saveToStorage during undo would trigger saveSnapshot)
  - See CLAUDE.md "How Undo/Redo Works" section for complete algorithm explanation

#### Phase 5: Configuration Persistence & Optional Delete Confirmation
- **Full Configuration Persistence**: All user settings now saved to localStorage
  - **What persists**: textLengthThreshold, charWidth, nodePadding, minNodeWidth, fontFamily, fontWeight, showDeleteConfirmation
  - **Why**: Previously only task data persisted; now complete UI customization survives reloads
  - **Implementation**: Expanded saveToStorage() and loadFromStorage() to include all config properties
  - **Default handling**: Uses null-coalescing operator (??) to properly distinguish false from undefined
  - **Export/Import**: Settings included in JSON export/import for sharing configurations
- **Optional Delete Confirmation**:
  - **New setting**: "Show Delete Confirmation" checkbox in Settings modal (default: enabled)
  - **Behavior**: When enabled, shows confirmation dialog before deleting tasks
  - **When disabled**: Tasks delete immediately without confirmation (still undoable with Ctrl+Z)
  - **Implementation**: Modified deleteTask() with conditional confirmation based on app.showDeleteConfirmation
  - **UI Integration**: Added checkbox input type support to Settings modal
- **Settings Modal Enhancement**:
  - **Checkbox support**: Added type='checkbox' to configDefs metadata system
  - **Form generation**: Checkbox inputs render with proper label and checked state
  - **Value reading**: applySettings() now handles .checked property for checkbox inputs
  - **Reset support**: resetSettings() works with boolean checkbox defaults
- **Metadata-Driven Pattern**:
  - Configuration defined once in configDefs object with type, label, default, description
  - Settings modal automatically generates appropriate input (number, text, select, checkbox)
  - Single source of truth eliminates duplicate code for new settings

### Session 6: Homes - Named Bookmark System

**Homes Feature**: Named bookmarks for quick navigation to different areas of large graphs

**Core Implementation**:
- **Data Model**:
  - Replaced old origin system (originMarked, originX, originY, originZoomLevel) with flexible homes array
  - Each home: `{ id, name, centerX, centerY, zoomLevel, timestamp }`
  - homeIdCounter for unique IDs
  - Unique name validation (case-insensitive)
- **Migration Logic**:
  - Auto-migrates old origin data to "Origin Home" on first load
  - Backward compatible with existing saved data
  - Shows one-time info toast on migration
- **Core Functions**:
  - `createHome(name)`: Save current view with validation (unique names, >20 warning)
  - `jumpToHome(homeId, animate)`: Navigate with smooth CSS animation (0.5s cubic-bezier)
  - `updateHome(homeId)`: Update existing home to current view
  - `deleteHome(homeId)`: Remove with optional confirmation
  - `renameHome(homeId, newName)`: Change name with validation
- **Updated Mark Origin**:
  - "Mark Origin" now creates/updates "Origin Home" (using createHome/updateHome)
  - Jump to "Origin Home" using keybinds or Homes dropdown

**UI Components**:
- **Toolbar Dropdown**:
  - "🏠 Homes" button with dynamic dropdown menu
  - Lists all homes sorted alphabetically ("Origin Home" first)
  - "+ Create New Home" and "⚙️ Manage Homes" actions
  - Click-outside-to-close behavior
- **Right-Click Submenu**:
  - "🏠 Homes" nested submenu in empty-space context menu
  - Same functionality as toolbar dropdown
  - Hover-triggered with → arrow indicator
  - Positioned to right of parent menu
- **Create Home Modal**:
  - Text input with 50-char limit
  - Enter key submits
  - Unique name validation with error toasts
  - Auto-focus on open
- **Manage Homes Modal**:
  - Scrollable list of home cards (max-height: 400px)
  - Each card shows: name, zoom level, position coordinates
  - Four actions per home: Jump, Update, Rename, Delete
  - Purple highlighting for "Origin Home"
  - Empty state message when no homes exist

**Visual Design**:
- **CSS Styling**:
  - Dropdown: Dark semi-transparent (#1a1a2e, 98% opacity), 8px border-radius
  - Purple special highlighting for "Origin Home" (rgba(156, 39, 176, 0.2))
  - Smooth hover transitions (0.2s)
  - Nested submenu with right-positioned dropdown
- **Animation**:
  - `.animating-view` class applies 0.5s cubic-bezier transition to all SVG children
  - Smooth pan and zoom simultaneously
  - Auto-removes class after 500ms
- **Sorting**:
  - "Origin Home" always first
  - Remaining homes alphabetically sorted
  - Consistent across dropdown, submenu, and manage modal

**Technical Details**:
- **localStorage Integration**:
  - homes and homeIdCounter saved alongside tasks
  - Removed old origin properties from save/load
  - Updated both normal and quota-exceeded save paths
- **Event Handlers**:
  - Modal click-outside-to-close listeners
  - Enter key in input field triggers create
  - Dropdown click-outside with setTimeout deferral
- **Use of prompt()**:
  - Rename function uses native prompt() (no longer in sandboxed mode)
  - Simple inline rename without custom input modal
- **Architecture**:
  - ~350 lines of new code added
  - Follows existing modal/dropdown patterns
  - Reuses toast notification system
  - Integrates with showConfirmDialog for delete confirmation

**User Experience**:
- **No Homes**: Empty states in dropdown ("No homes created yet") and modal
- **1-20 Homes**: Normal operation, sorted list
- **>20 Homes**: Warning toast on creation ("⚠️ Home created (X homes - consider organizing)")
- **Smooth Navigation**: Animated transitions feel polished and professional
- **Clear Visual Hierarchy**: Purple for special, sorted predictably, clean spacing
- **Error Handling**: Duplicate name validation, empty name prevention, clear error messages

**Line Count**: ~4500 lines total in task-tree.html after this session

### Session 6 Continued: Animation Polish & Dark Mode Fixes

**Animation Refactor**: Transform-based rendering for smooth Home navigation
- **Problem**: Initial animation implementation didn't work - nodes just snapped to new positions
- **Root Cause**: `render()` was destroying and recreating all DOM elements during animation
  - CSS transitions only work when the SAME DOM element changes properties
  - Creating new elements = instant position change, no animation
- **Solution**: Major architectural refactor to transform-based positioning
  - Changed from absolute positioning (`<rect x="500" y="300">`) to group transforms (`<g transform="translate(500, 300)"><rect x="0" y="0">`)
  - Updated entire rendering pipeline (nodes, text, lock buttons, badges, preview nodes)
  - Nodes now persist and only their transform attribute updates during animation

**Line Animation Attempts**:
- **Challenge**: Lines need to animate smoothly with nodes
- **Attempt 1**: CSS transitions on x1/y1/x2/y2 attributes → doesn't work (XML attributes, not CSS properties)
- **Attempt 2**: Manual position updates with data attributes → sync issues (lines ahead of nodes)
- **Attempt 3**: Offset-based calculations → still had visual artifacts
- **Final Solution**: Professional fade-out/fade-in approach
  - Lines fade to opacity 0 during animation (0.15s)
  - Nodes slide smoothly via transform (0.5s)
  - After animation completes, re-render lines with perfect positioning
  - Clean, professional result without fighting browser limitations

**Technical Details**:
- **CSS Animation Rules** (lines 666-681):
  - `.animating-view .task-node { transition: transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1) }`
  - `.animating-view line { opacity: 0; transition: opacity 0.15s ease-out }`
- **Transform-Based Rendering** (lines 3397-3634):
  - All nodes wrapped in `<g>` elements with `transform="translate(x, y)"`
  - Child elements positioned relative to group center
  - Lock buttons, badges, text all use relative coordinates
- **Animation Logic in jumpToHome()** (lines 4206-4245):
  - Add `.animating-view` class
  - Update data model positions
  - Update node transforms via DOM (triggers CSS transition)
  - After 500ms: remove class, re-render lines

**Submenu UX Fix**:
- **Problem**: Homes submenu in right-click menu disappeared when mousing over to it
- **Cause**: Gap between parent menu item and submenu, plus submenu only showed on parent hover
- **Solution** (lines 133-179):
  - Overlap submenu slightly with parent (`margin-left: -2px`)
  - Add invisible padding as "hover bridge" (`padding-left: 6px`)
  - Show submenu on both parent hover AND submenu hover (`.submenu:hover`)
  - Compensate padding in submenu items for proper alignment
  - Much more forgiving user experience

**Dark Mode Consistency** (lines 857-908):
- Added complete dark mode styling for Homes dropdown and submenu
- Consistent color scheme: `rgba(30, 41, 59, 0.98)` background, light grey text
- Matches existing dark mode patterns for modals and context menus
- Purple highlighting for "Origin Home" works in both modes

**Light Mode Fix** (lines 72-219):
- Fixed dropdown and submenu backgrounds to use light theme by default
- Changed from dark `rgba(26, 26, 46, 0.98)` to light `rgba(255, 255, 255, 0.98)`
- Updated text colors from white to dark grey (`#333`)
- Proper contrast and hover states in both light and dark modes
- Now properly adapts to current theme

**Cinematic 3-Phase Animation** (lines 4289-4363, 1897-1908):
- **Evolution**: First implemented simultaneous pan+zoom, then refined to cinematic phased approach
- **Phase 1 (0-300ms)**: Zoom out to 50% of minimum zoom for overview context
- **Phase 2 (300-800ms)**: Pan to new location while staying zoomed out (CSS transform transition)
- **Phase 3 (800-1300ms)**: Zoom in to target zoom level with ease-out curve
- Created `updateViewBoxOnly()` helper function to update viewBox without full re-render
- Uses `panTriggered` flag to ensure pan only fires once at phase transition
- Total 1.3 second animation feels professional and provides spatial awareness

**Key Architectural Lesson**:
- Transform-based positioning is the standard SVG pattern for a reason
- Enables GPU acceleration for smooth 60fps animations
- CSS can transition `transform` but NOT most SVG attributes
- When browser limitations exist (like line attributes), professional workarounds (fade-out/fade-in) are better than fighting them
- For complex animations, combine CSS transitions (for transforms) with requestAnimationFrame (for viewBox/zoom)

**Line Count**: ~4620 lines total in task-tree.html after animation refactor and fixes

### Session 7: Multi-Select System

**Core Feature**: Shift+Click to select multiple tasks, Shift+Drag to box select

**Implementation Overview**:
- **State Change**: Replaced `selectedTaskId` (single) with `selectedTaskIds` (Set)
- **Selection Modes**:
  - Click: Select single (clears others)
  - Shift+Click: Toggle in/out of selection
  - Shift+Drag on empty: Box select (additive)
  - Escape: Clear all selection
- **Operations on Multi-Select**:
  - Drag to move all selected together (maintains relative positions)
  - Delete multiple with confirmation dialog
  - Right-click shows multi-select aware menu ("Delete (3)", "Mark Done (3)", etc.)
- **Relationship Operations**:
  - Alt+Drag to selected task creates dependencies from source to all selected
  - Ctrl+Drag multiple selected to parent makes all children of that parent
  - Reparenting happens when dragging one of the selected nodes

**Technical Implementation**:
- **Selection State** (lines 1111-1116):
  - `selectedTaskIds: new Set()` - Multiple IDs instead of single
  - `lastClickedTaskId` - For future range selection support
  - `boxSelectStart`, `isBoxSelecting` - For box drag detection

- **Selection Logic** (lines 1223-1241):
  - Shift+Click toggles in Set: `has()` check, then `add()`/`delete()`
  - Normal click: `clear()` then `add()` for single selection

- **Box Selection** (lines 2652-2658, 2676-2701, 2945-2966):
  - MouseDown: If Shift+Click on empty, set `dragMode = 'box-select'`
  - MouseMove: Draw semi-transparent blue rectangle preview
  - MouseUp: Find nodes in box bounds, add to selection (additive)

- **Multi-Node Operations**:
  - Movement (lines 2709-2730): Check if dragged node is selected, move all if yes
  - Delete (lines 1754-1794): New `deleteMultipleTasks()` function
  - Right-click menu (lines 3189-3192): Toggle selection, show multi-aware options

- **Relationship Ops**:
  - Dependencies (lines 2923-2930): Check if target is in selection, create to all
  - Reparenting (lines 2906-2912): Check if source is selected with multiple, reparent all

**Polish Features**:
- Escape key to clear selection (lines 1320-1326)
- Undo snapshot naming: "Moved 3 tasks" instead of single task name
- Multi-select context menu shows count: "Delete (3 selected)"
- Maintains selection across operations (don't auto-clear after action)

**Line Count**: ~4720 lines total in task-tree.html after multi-select implementation

### Session 7 Continued: Multi-Project Support & Bug Fixes

**Multi-Project Feature**: One working task per root graph instead of globally

**Implementation**:
- **New Function** `getRootTask()` (lines 1817-1828):
  - Traverse up the parent chain to find root task
  - Returns null if task not found
  - Used to identify which project a task belongs to

- **Updated toggleWorking()** (lines 1574-1607):
  - Find root task of current task
  - Only clear working status for tasks in SAME root graph
  - Tasks in different projects keep their working state
  - Each project can have one task actively being worked on

- **Updated render()** (lines 3575-3602):
  - Find ALL working tasks (not just one)
  - Build ancestor/children lists for each working task
  - Apply visual indicators to all working paths simultaneously
  - Golden path shows all active working contexts

**Benefits**:
- Multi-project workflows: manage A and B simultaneously
- Team dashboards: see multiple initiatives at once
- Better context switching: pause project A, resume project B without losing state

**Bug Fixes**:
1. **Canvas drag no longer deselects** (lines 2673, 3041-3054):
   - Track `dragStartOriginal` position
   - Calculate pan distance in mouseUp
   - Only clear selection if distance < 5px (actual click)
   - Pan movements preserve selection ✓

2. **Box selection visual glitch fixed** (line 3027):
   - Added missing `this.render()` after completing box selection
   - Nodes now highlight immediately ✓

3. **Reparenting with selected targets** (lines 2915-2928):
   - Check if TARGET is selected (not just source)
   - Ctrl+Drag unselected→selected makes all selected children of source ✓

4. **Dependencies with selected sources** (lines 2944-2960):
   - Check if SOURCE is selected (multi-source mode)
   - Also check if TARGET is selected (multi-target mode)
   - Alt+Drag unselected→selected creates arrows from source to all selected ✓

**Line Count**: ~4800 lines total in task-tree.html after multi-project implementation

### Session 7 Final: Working Task Log Optimization

**Problem**: The previous multi-project implementation used `getRootTask()` traversal for every render operation to find which task was working in each project. This was inefficient (O(n) per task in worst case).

**Solution**: Implemented working task log pattern - a simple dictionary maintaining one working task ID per root, enabling O(1) lookup.

**Data Structure**:
```javascript
workingTasksByRoot: {
    [rootTaskId]: workingTaskId,  // e.g., { 1: 5, 3: 7 } = "working on task 5 in project 1, task 7 in project 3"
    // ...
}
```

**Implementation Details**:

1. **New State Variable** (line 1147):
   - Added `workingTasksByRoot: {}` to app object
   - Single source of truth for working tasks across all projects

2. **Updated toggleWorking()** (lines 1576-1612):
   - Get root task ONCE when toggling
   - Only update the log for that specific root
   - O(1) performance compared to previous traversal

3. **Added Cleanup Logic**:
   - **deleteTask()** (lines 1760-1765): Remove entry from log if deleted task was working
   - **reparentTask()** (lines 3113-3140): When task changes roots, update log entries
     - Save old root entry for working task
     - Update new root entry after reparenting

4. **Updated Persistence**:
   - **saveToStorage()** (lines 4405-4430): Persist `workingTasksByRoot` dictionary
   - **loadFromStorage()** (lines 4472): Restore `workingTasksByRoot` with empty object default

5. **Optimized render()** (lines 3605-3635):
   - Changed from: `this.tasks.filter(t => t.currentlyWorking)` (O(n) filter)
   - Changed to: `Object.values(this.workingTasksByRoot).forEach(...)` (O(# of roots))
   - Much faster for large task graphs with few projects

**Benefits**:
- **Performance**: O(1) lookup instead of O(n) traversal
- **Correctness**: Single source of truth prevents synchronization bugs
- **Memory**: Minimal overhead - just object with number of roots entries
- **Clarity**: Explicit data structure makes intent clear

**Testing**:
- Multiple projects can each have independent working tasks
- Working states survive page reload (persisted to localStorage)
- Deleting working task cleans up log entry
- Reparenting working task updates log correctly
- No stale log entries after operations

### Key Learnings & Patterns

**SVG Event Handling**:
- `closest()` doesn't work reliably in SVG - use direct element checks
- Two-layer line approach (invisible hit + visible display) for easy clicking
- `pointer-events: stroke` for wide hit detection on transparent lines

**Rendering Challenges**:
- Frequent re-renders destroy event listeners
- Solution: Attach listeners during render OR defer renders with requestAnimationFrame
- Mouse coordinate transformation critical: use `getScreenCTM().inverse()`
- **CRITICAL**: Never call `render()` during active mouse interactions (hover, drag, click)
  - Destroys DOM elements mid-interaction, breaking drag/click detection
  - Creates "invisible blocking layer" as elements constantly recreate
  - Use CSS-only hover effects or defer render to after interaction completes

**Click Detection**:
- `mousedown` with `preventDefault()` blocks subsequent `click` events
- Early return from mousedown for specific elements (like lines) allows clicks through
- Check `e.target.tagName` directly for SVG elements

**State Management**:
- All state in single `app` object
- localStorage for persistence
- Save on every change for data safety
- Load preferences on init (dark mode, zoom, settings)
- **Configuration Pattern**: Any user-customizable parameter should be added to app state
  - Examples: `charWidth`, `nodePadding`, `minNodeWidth`, `textLengthThreshold`, `fontFamily`, `fontWeight`
  - Enables Settings UI and JSON import/export for user customization
  - Keep hardcoded values only for truly fixed constants

**Undo/Redo UX Pattern**:
- Distinguish between **content modifications** (undoable) and **viewport navigation** (not undoable)
- Content: create/delete/edit tasks, change status, add dependencies → creates undo snapshot
- Viewport: pan canvas, zoom → does NOT create undo snapshot
- Critical: Viewport actions must NOT clear the redo stack
- Users expect to undo, pan to look around, then redo without losing history
- Moving individual tasks/subtrees IS content modification (changes data relationships)

**Undo/Redo Integration (for developers)**:
- ⚠️ **Not automated** - requires manual `saveSnapshot()` call for each operation
- Integration checklist maintained in `task-tree.html` (line 3426) with all 18 integration points
- When adding new operations: Check CLAUDE.md "Adding Undo/Redo to New Operations" section
- Silent failure mode: Forgetting `saveSnapshot()` means operation won't be undoable (no warnings)
- Test every new operation: Do action → Ctrl+Z → Ctrl+Shift+Z to verify undo/redo works
- Future improvement opportunity: Auto-detection via Proxy wrapper on `this.tasks`

---

## README Update Checklist

**When adding a feature**:
- [ ] Add to Complete Feature List with details
- [ ] Add to Testing Guide if user-facing
- [ ] Update Architecture section if significant
- [ ] Add to Development History
- [ ] Update any affected diagrams/examples

**When fixing a bug**:
- [ ] Update relevant feature description if behavior changed
- [ ] Add to Key Learnings if important pattern
- [ ] Update code line numbers if significantly shifted

**When planning work**:
- [ ] Check Future Improvements for related ideas
- [ ] Review Architecture section for context
- [ ] Read relevant feature descriptions

**Monthly maintenance**:
- [ ] Verify all line numbers are accurate
- [ ] Update any outdated screenshots/examples
- [ ] Review Future Improvements, move completed items to Development History

---

## How to Remind Claude to Update README

### Option 1: CLAUDE.md Integration
Add this to the top of `/mnt/c/Users/gmmer/Documents/projects/graphdo/CLAUDE.md`:

```markdown
## ⚠️ CRITICAL WORKFLOW RULE

**ALWAYS follow this sequence when working on this project:**

1. **READ** `README.md` FIRST - Get full context of current state
2. **DO** the requested work - Implement features/fixes
3. **UPDATE** `README.md` LAST - Document all changes made

If you skip step 3, you will lose project continuity on the next session.
```

### Option 2: User Prompts
After each work session, ask:
> "Did you update the README with the changes we made?"

### Option 3: Git Commit Hook (Future)
If you add git to this project, create a pre-commit hook that checks if README.md was modified when other files changed.

### Session 8: Bug Fixes and Hide Node Feature

**New Feature: Hide Node Within Parent**
- **Shift+Double-Click**: Now hides the node itself within its parent (instead of hiding children)
- Only works for child tasks (root tasks cannot be hidden)
- Hidden nodes preserve their state and can be revealed by clicking parent's hidden children badge
- Implementation:
  - Added `toggleHiddenSelf()` function (line 1739)
  - Updated both shift+double-click handlers (lines 1174 and 4012)
  - Still supports hiding children via right-click context menu and hidden badge

**Multi-Project Bug Fixes**:
1. **Fixed cycleStatus() clearing other projects' working tasks** (lines 1507-1567):
   - Was calling `this.tasks.forEach(t => t.currentlyWorking = false)` which cleared ALL projects
   - Now respects per-project boundaries using working log
   - Only clears working in same root tree
   - Properly maintains `workingTasksByRoot` log

2. **Fixed toggleDone() clearing other projects' working tasks** (lines 1575-1618):
   - Added proper root task detection
   - Updates working log correctly on mark done
   - Respects per-project boundaries

3. **Fixed Golden Path Visualization for Multi-Project** (lines 3682-3714):
   - Was only finding ONE working task with `this.tasks.find(t => t.currentlyWorking)`
   - Now collects paths from ALL working tasks in log
   - Combines ancestor paths into unified Set
   - Correctly checks if parent is ANY working task (not just one)
   - Golden paths now show for all active projects simultaneously

**Testing**:
- Multiple projects each have independent working states ✓
- Shift+double-click hides child nodes ✓
- Other projects unaffected when changing working state ✓
- Golden paths glow for all working tasks ✓
- Flow state (auto-parent) works per-project ✓

### Session 8 Continued: Auto-Hide Settings Feature

**New Configurable Feature: Auto-Hide Completed Nodes**
- **Problem**: Some users may not want automatic hiding of completed nodes - different workflows have different preferences
- **Solution**: Added toggle setting in ⚙️ Settings to enable/disable auto-hide behavior
- **Default**: Enabled (maintains current behavior for existing users)

**Implementation**:
1. **New Configuration Option** (line 1146):
   - Added `autoHideCompletedNodes: true` to app state
   - Defaults to true to maintain existing behavior

2. **Updated autoCollapseCompleted()** (lines 1936-1940):
   - Added early return if `this.autoHideCompletedNodes` is false
   - Setting respected on every mark-done operation
   - Doesn't affect manual hiding via right-click menu or shift+double-click

3. **Settings UI Integration** (lines 2288-2293):
   - Added to configDefs with checkbox type
   - Label: "Auto-Hide Completed Nodes"
   - Description: "Automatically hide child nodes when they and their parent are marked done"
   - Appears in ⚙️ Settings modal alongside other configuration options

4. **Persistence** (lines 4538, 4565, 4618):
   - Saved to localStorage in both primary and fallback save paths
   - Loaded with proper default (true) if missing from saved data

5. **Documentation** (README updated):
   - Updated Visibility Management section to mention setting
   - Added to Settings UI available options list

**Testing**:
- Toggle setting ON: Completed nodes auto-hide as before ✓
- Toggle setting OFF: Completed nodes stay visible when done ✓
- Setting persists across page reloads ✓
- Manual hiding still works when setting is OFF ✓
- Works correctly with multi-project setup ✓

### Session 8 Final: Hide Child Context Menu Options

**New Feature: Hide Child Menu Options**
- Added "Hide Child" to multi-select context menu (formatted like other batch operations)
  - Shows count: "Hide Child (3)" when multiple tasks selected
  - Hides all selected child tasks (toggles visibility of each)
  - Root tasks are skipped (cannot be hidden - requires parent)

- Added "Show/Hide" to single-select context menu (appears conditionally)
  - Only shows when task has a parent (is not a root task)
  - Label toggles: "Hide" when visible, "Show" when hidden
  - Positioned before "Show/Hide Children" in menu order
  - Distinguishes from "Show/Hide Children" which affects children, not the node itself

**Implementation** (lines 3441-3464):
1. Multi-select: Added `Hide Child (${count})` button after Mark Pending (line 3441-3447)
2. Single-select: Added conditional "Show/Hide" button for non-root tasks (line 3461-3464)
3. Both use existing `toggleHiddenSelf()` function
4. Smart button labels based on hidden state

**Menu Structure** (for clarity):
- **Multi-Select Options**: Mark Done → Mark Pending → Hide Child → Delete
- **Single-Select Options**: Add Child → Mark Done/Pending → Start/Stop Working → Show/Hide (if parent) → Show/Hide Children (if children) → Copy Text → Delete

**Documentation Updated**:
- Multi-select menu updated to show all options
- Single-task context menu section now clarifies two hide options
- Shows "Show/Hide" for node vs "Show/Hide Children" for children

**Testing**:
- Multi-select: "Hide Child (3)" hides all 3 selected tasks ✓
- Single-select: "Hide"/"Show" option only appears for child tasks ✓
- Root tasks don't show hide option ✓
- Menu order is consistent and logical ✓

### Session 9: Text Editing Experience Improvements

**Problem**: Inline text editor had two UX issues:
1. Editing box didn't cover the full width of the rectangle (gaps on sides)
2. Text displayed starting at end/center instead of beginning (awkward for editing)

**Solution**: Improved the SVG foreignObject and input styling

**Implementation** (lines 3987-3996):
1. **Expanded foreignObject to full rectangle width**:
   - Changed x from `-rectWidth / 2 + 5` → `-rectWidth / 2` (remove left inset)
   - Changed width from `rectWidth - 10` → `rectWidth` (full rectangle width)
   - ForeignObject now matches rectangle exactly with no gaps

2. **Changed Text Alignment to Left**:
   - Changed `text-align: center` → `text-align: left`
   - Text cursor and content now starts at left edge
   - Matches typical input field behavior

3. **Improved Padding and Box Sizing**:
   - Changed `padding: 4px` → `padding: 4px 8px` (more breathing room left/right)
   - Added `box-sizing: border-box` to prevent border from expanding width
   - Input internal padding now properly respects rectangle boundaries

**Benefits**:
- ✅ Input box visually fills the entire rectangle
- ✅ Text starts at left edge, intuitive for editing long titles
- ✅ More professional appearance
- ✅ Consistent with standard HTML input behavior
- ✅ Better spacing with 8px horizontal padding

**Testing**:
- Double-click to edit: Input covers full rectangle ✓
- Long text (50+ chars): Displays from left, not center ✓
- Text selection: Select-all works correctly ✓
- Save (Enter) and cancel (Escape): Still work as before ✓
- Click outside to save: Still works ✓
- Border radius: Properly rounded with new dimensions ✓

### Session 9 Continued: Fix Rectangle Size During Editing

**Problem**: After initial improvements, discovered rectangle wasn't expanding for long text:
- Small nodes worked fine, but larger nodes had editing area that didn't match rectangle size
- Issue occurred even with non-truncated text, suggesting a size cap

**Root Cause Analysis**:
1. **Rectangle sizing bug**: `rectWidth` was calculated from `displayTitle` (potentially truncated), but input received full `task.title`
   - Truncated: "This is a very long task title that n..." → small rectangle
   - Input gets: "This is a very long task title that needs editing" → overflows small box
2. **Potential CSS limitation**: Input elements might have default max-width constraints

**Solution** (lines 3971, 3997):
1. **Dynamic rectangle sizing for edit mode**:
   - Changed: `const rectWidth = Math.max(minWidth, displayTitle.length * charWidth + padding * 2)`
   - To: `const textForSizing = this.editingTaskId === task.id ? task.title : displayTitle;`
   - Then: `const rectWidth = Math.max(minWidth, textForSizing.length * charWidth + padding * 2)`
   - Rectangle now expands to fit **full title** when editing starts

2. **Override CSS width constraints**:
   - Added `max-width: none` to input CSS
   - Prevents any default or inherited max-width from limiting input expansion
   - Ensures input can fill the entire foreignObject width

**How It Works**:
1. User double-clicks truncated text: "This is a very lon..."
2. System calculates `textForSizing = task.title` (full text, not truncated)
3. Rectangle expands to fit full text: `rectWidth` increases
4. ForeignObject expands to match: `width={rectWidth}`
5. Input fills foreignObject with `width: 100%; max-width: none`
6. Result: Editing box perfectly matches the expanded rectangle

**Testing**:
- Truncated text (80+ chars): Rectangle expands on edit ✓
- Non-truncated long text: No size cap, full width ✓
- Very long text (150+ chars): Properly displays and edits ✓
- Small text: Still works as before ✓
- Text that fits exactly: No issues ✓

### Session 9 Final: Fix Cursor Positioning During Edit

**Problem**: When in editing mode, clicking inside the input box to reposition the cursor would immediately save/exit edit mode instead of allowing cursor movement.

**Root Cause**: Event bubbling issue
- Clicks on the input were bubbling up to canvas/SVG mousedown handlers
- Canvas handlers or blur events were triggering `finishEditing()`
- User couldn't click inside the input to reposition cursor

**Solution** (lines 3993-3994, 4007-4008):
1. **Added stopPropagation to foreignObject**:
   - `foreignObject.onmousedown = (e) => e.stopPropagation();`
   - `foreignObject.onclick = (e) => e.stopPropagation();`
   - Prevents clicks on the editing container from reaching canvas handlers

2. **Added stopPropagation to input**:
   - `input.onmousedown = (e) => e.stopPropagation();`
   - `input.onclick = (e) => e.stopPropagation();`
   - Prevents clicks inside the input from reaching canvas handlers

**How It Works Now**:
- **Click inside input**: Event stops at input level, cursor repositions, editing continues
- **Click outside input**: Event reaches canvas, blur triggers, editing finishes and saves
- **Enter key**: Still immediately saves
- **Escape key**: Still cancels without saving

**Benefits**:
- ✅ Can click anywhere inside the input box to move cursor
- ✅ Can select text by clicking and dragging
- ✅ Can reposition cursor without accidentally exiting edit mode
- ✅ Still exits edit mode when clicking outside (as expected)
- ✅ Natural text editing experience

**Testing**:
- Click inside input to reposition cursor: Works, stays in edit mode ✓
- Click and drag to select text: Works, stays in edit mode ✓
- Click at start/middle/end of text: Cursor moves correctly ✓
- Click outside input box: Exits edit mode and saves ✓
- Enter/Escape keys: Still work as before ✓

### Session 10: Multiline Text Support (MAJOR FEATURE)

**Overview**: Implemented comprehensive multiline text support, enabling tasks to display rich, wrapped text across multiple lines instead of being constrained to single lines.

**New Configuration Settings** (5 new settings):
1. **enableMultiline**: Master toggle (default: true)
2. **maxNodeWidth**: Maximum width before wrapping (default: 600px, range: 100-2000)
3. **maxNodeHeight**: Optional height limit (default: 0 = unlimited, range: 0-1000)
4. **lineHeight**: Spacing between lines (default: 20px, range: 12-40)
5. **wordWrap**: Wrap on words vs characters (default: true)

**Core Implementation**:

1. **wrapText() Function** (lines 2132-2188):
   - Intelligently splits text into lines based on maxNodeWidth and charWidth
   - Word wrap mode: Breaks on spaces for readability
   - Character wrap mode: Fixed-width breaking
   - Handles edge case: very long words force character breaks
   - Returns array of line strings

2. **Dynamic Rectangle Sizing** (lines 4067-4087):
   - **Width**: `Math.max(minWidth, Math.min(maxNodeWidth, longestLineWidth))`
   - **Height**: `lines.length × lineHeight + padding × 2`
   - Respects maxNodeHeight if set (shows overflow indicator)
   - Calculates dimensions for each node individually

3. **SVG Multiline Rendering** (lines 4131-4166):
   - Replaced single `<text>` element with `<text>` + multiple `<tspan>` children
   - Each line rendered as separate tspan element
   - Left-aligned text (changed from center) for readability
   - Vertical positioning: `yOffset = -rectHeight/2 + padding + lineHeight × (index + 0.75)`
   - Emoji indicators (🔄/✅) on first line only
   - Overflow indicator "..." if text exceeds maxNodeHeight

4. **Textarea Editor** (lines 4110-4131):
   - Replaced `<input>` with `<textarea>` for multiline editing
   - **Keyboard Shortcuts Changed**:
     - Enter → Creates newline (natural textarea behavior)
     - Ctrl+Enter or Cmd+Enter → Saves edits
     - Escape → Cancels without saving
   - Dynamic rows: `Math.max(2, lines.length)`
   - Resize disabled, scroll enabled

5. **Settings UI Integration** (lines 2300-2336):
   - Added 5 new configuration options to settings modal
   - Clear labels and descriptions
   - Proper validation (min/max ranges)

6. **Persistence** (lines 4600-4604, 4632-4636, 4690-4694):
   - All settings saved to localStorage
   - Proper defaults using null-coalescing operator (??)
   - Backward compatible (existing data works)

**Benefits**:
- ✅ Rich task descriptions without truncation
- ✅ Natural text wrapping maintains readability
- ✅ Configurable constraints prevent oversized nodes
- ✅ Left-aligned text improves multiline readability
- ✅ Word wrap prevents awkward mid-word breaks
- ✅ Textarea editing supports manual newlines
- ✅ Can be toggled off for single-line behavior

**Known Limitations** (Non-Critical):
- Other sizing locations (preview nodes, links) not yet updated - use single-line sizing
- Arrow endpoints use old heights but still functional
- Badge/lock positioning may need adjustment for very tall nodes

**Testing**:
- Short text (1 line): Works as before ✓
- Medium text (2-3 lines): Wraps correctly ✓
- Long text (100+ chars): Wraps with word boundaries ✓
- Very long single word: Force breaks correctly ✓
- Textarea editing: Enter adds newline, Ctrl+Enter saves ✓
- Settings: All options accessible and functional ✓
- Persistence: Settings save/load correctly ✓

**User Experience**:
- Tasks can now contain descriptive text like: "Implement user authentication using JWT tokens with refresh token rotation and secure HTTP-only cookies for enhanced security"
- Text wraps naturally at word boundaries
- Editing feels natural with standard textarea behavior
- Visual hierarchy maintained with dynamic heights

### Session 10 Continued: Critical Multiline Bug Fixes

**Issue 1: Settings Modal Not Scrollable**

**Problem**: With 5 new multiline settings added, the Settings modal content exceeded viewport height but couldn't scroll. Users couldn't access "Max Node Height" and other bottom settings.

**Solution** (line 1052):
- Added `max-height: 80vh` to settings modal content
- Added `overflow-y: auto` to enable vertical scrolling
- Modal now scrolls smoothly when content is tall

**Issue 2: Multiline Stuck at 2 Lines (CRITICAL BUG)**

**Problem**: Despite implementing multiline support, task nodes were stuck at 1-2 lines regardless of text length. Setting `maxNodeHeight: 0` (unlimited) had no effect.

**Root Cause** (line 4074):
- The code was using `displayTitle` (truncated text) for wrapping calculations
- `displayTitle` is truncated at `textLengthThreshold` (default 60 chars)
- So a 200-char task would:
  1. Get truncated to 60 chars + "..."
  2. Wrap the 60-char version at 600px width
  3. Result: Only 1-2 lines displayed
- The multiline wrapping was working correctly, but it was wrapping the WRONG text (truncated version)

**Solution** (line 4074):
```javascript
// BEFORE (broken):
const textForSizing = this.editingTaskId === task.id ? task.title : displayTitle;

// AFTER (fixed):
const textForSizing = this.editingTaskId === task.id || this.enableMultiline ? task.title : displayTitle;
```

**Logic**:
- When multiline is enabled → use full `task.title` for wrapping
- When multiline is disabled → use truncated `displayTitle` (backward compatible)
- When editing → always use full `task.title`
- Let `maxNodeHeight` handle limiting display (with "..." overflow indicator)

**Impact**:
- ✅ Long text now properly wraps across unlimited lines (when maxNodeHeight = 0)
- ✅ Text can span 10, 20, 50+ lines based on content
- ✅ Word wrap mode respects full text content
- ✅ Old truncation behavior preserved when multiline is disabled
- ✅ No conflict between truncation and multiline features

**Testing**:
- 50-char text: 1-2 lines ✓
- 100-char text: 2-3 lines ✓
- 200-char text: 4-6 lines (was stuck at 2 before) ✓
- 500-char text: 10+ lines (was stuck at 2 before) ✓
- maxNodeHeight = 100px: Properly limits with "..." indicator ✓
- Disable multiline: Falls back to truncation ✓

### Session 10 Final: Arrow Positioning & Text Clipping Fixes

**Issue 3: Arrow Positioning Broken for Multiline Nodes (CRITICAL BUG)**

**Problem**: When nodes exceeded 1 line, arrows would either penetrate inside the rectangles or end too far away, creating visual disconnection.

**Root Cause**: Arrow endpoint calculations were using hardcoded `rectHeight = 40` at 3 locations:
- Line 3889: Main parent links
- Line 3969: Other parent links
- Line 4015: Dependency links

These hardcoded values didn't account for dynamic multiline heights, so arrows always aimed for single-line box edges even when boxes were 3, 5, 10+ lines tall.

**Solution** (lines 4321-4350, 3881-3882, 3953-3954, 3991-3992):

1. **Created helper function** `calculateTaskDimensions(task)`:
   - Centralizes dimension calculation logic
   - Returns `{rectWidth, rectHeight, lines}` accounting for multiline
   - Uses same logic as main node rendering for consistency

2. **Updated all 3 arrow positioning locations**:
   ```javascript
   // BEFORE (broken):
   const rectHeight = 40;
   const arrowEnd = this.getLineEndAtRectEdge(parent.x, parent.y, task.x, task.y, rectWidth, rectHeight);

   // AFTER (fixed):
   const { rectWidth, rectHeight } = this.calculateTaskDimensions(task);
   const arrowEnd = this.getLineEndAtRectEdge(parent.x, parent.y, task.x, task.y, rectWidth, rectHeight);
   ```

**Impact**:
- ✅ Arrows now accurately target rectangle edges regardless of node height
- ✅ Parent links, other-parent links, and dependency links all work correctly
- ✅ Works with any lineHeight, maxNodeHeight, or text length
- ✅ Visual clarity maintained as nodes grow

**Issue 4: Text Overflow with maxNodeHeight (CRITICAL BUG)**

**Problem**: When `maxNodeHeight` was set (e.g., 100px), text would overflow outside the rectangle boundary instead of being clipped. All lines were rendered even if they extended beyond the box.

**Root Cause** (lines 4129-4138):
- Code rendered ALL lines in the `lines` array with `lines.forEach()`
- SVG doesn't clip content by default - text outside viewBox is still visible
- Even though `rectHeight` was capped by `maxNodeHeight`, tspan elements positioned outside the boundary were still rendered

**Solution** (lines 4128-4155):

1. **Calculate visible line capacity**:
   ```javascript
   const availableHeight = rectHeight - padding * 2;
   const maxVisibleLines = Math.floor(availableHeight / this.lineHeight);
   const linesToRender = isOverflowing ? Math.min(lines.length, maxVisibleLines - 1) : lines.length;
   ```

2. **Render only lines that fit**:
   - Changed from `lines.forEach()` to `for (let index = 0; index < linesToRender; index++)`
   - When overflowing, reserve space for ellipsis by rendering `maxVisibleLines - 1` lines
   - When not overflowing, render all lines

3. **Position ellipsis correctly**:
   ```javascript
   const ellipsisY = -rectHeight / 2 + padding + this.lineHeight * (linesToRender + 0.75);
   ```
   - Ellipsis appears as the last visible line within the rectangle
   - Clear visual indicator that content continues below

**Impact**:
- ✅ Text properly contained within rectangle boundaries
- ✅ maxNodeHeight setting now works as intended
- ✅ No visual overflow or text bleeding outside boxes
- ✅ "..." ellipsis indicates truncated content
- ✅ Maintains clean visual hierarchy

**Testing**:
- Short text + no maxNodeHeight: Normal display ✓
- Long text + no maxNodeHeight: All lines visible ✓
- Long text + maxNodeHeight 100px: Truncates with "..." ✓
- Long text + maxNodeHeight 200px: More lines visible ✓
- Arrows connect to correct edges for all heights ✓

### Session 10 Continued: Height Expansion & Truncation Improvements

**Issue 5: Ellipsis Removed Entire Last Line + Extra Rectangle Height**

**Problems**:
1. **Entire line removed**: When overflowing, the last line was completely removed and replaced with "..." as a separate line. Users lost an entire line of text (e.g., "Line 4 with lots of text" → gone, "..." on line 5).
2. **Wasted rectangle space**: Rectangle height was set to `maxNodeHeight` even when fewer lines were rendered, creating empty space at the bottom.

**Root Causes**:
1. Code rendered `maxVisibleLines - 1` text lines, then added "..." as separate tspan → entire last line lost
2. Rectangle sized to `Math.min(maxNodeHeight, calculatedHeight)` without considering actual rendered lines

**Solution** (lines 4068-4081, 4143-4167):

**Fix 1: Truncate Last Line Mid-Text (Not Remove It)**
```javascript
// Render ALL visible lines (not minus 1)
const linesToRender = Math.min(lines.length, maxVisibleLines);

for (let index = 0; index < linesToRender; index++) {
    let lineText = lines[index];

    // If last visible line and overflowing, truncate IT
    if (isOverflowing && index === linesToRender - 1) {
        lineText = lineText.slice(0, -3) + '...'; // Replace last 3 chars with ...
    }

    // Render tspan with lineText (includes truncated last line)
}
```

**Fix 2: Size Rectangle to Actual Rendered Content**
```javascript
// Calculate how many lines will actually render
let actualRenderedLines = lines.length;
if (isOverflowing) {
    const availableHeightForOverflow = this.maxNodeHeight - padding * 2;
    actualRenderedLines = Math.floor(availableHeightForOverflow / this.lineHeight);
}

// Size rectangle based on actual content (no wasted space)
const rectHeight = (this.maxNodeHeight > 0 && !shouldFullyExpand)
    ? actualRenderedLines * this.lineHeight + padding * 2
    : calculatedHeight;
```

**How It Works Now**:
- maxNodeHeight allows 5 lines → render all 5 lines, last line ends with "..."
- Example: "Line 5 with some long text here" → "Line 5 with some long te..."
- Rectangle height = exactly 5 lines worth of space (no wasted height)
- User sees maximum content within the constraint

**Preserves Expansion Behavior**:
- Editing/selecting/working still bypasses `maxNodeHeight` via `shouldFullyExpand`
- Only affects non-expanded nodes
- Auto-expansion logic completely untouched

**Issue 6: No Height Expansion When Editing**

**Problem**: When editing long text with maxNodeHeight set, the textarea only showed truncated text, making editing difficult. Users couldn't see what they were typing beyond the height limit.

**Solution** (lines 4062-4073):
- Added `shouldFullyExpand` flag that checks:
  - `this.editingTaskId === task.id` → editing mode
  - `this.selectedTaskIds.has(task.id)` → selected state
  - `shouldExpand` → already expanded (currentlyWorking, textLocked)
- Bypass maxNodeHeight when `shouldFullyExpand === true`
- Rectangle expands to show ALL lines when editing

**Issue 7: No Height Expansion When Selected**

**Problem**: When selecting a truncated node to lock it (for expanded text), users couldn't see the full text or easily access the lock button.

**Solution**: Same `shouldFullyExpand` logic (line 4066)
- Selection now triggers full height expansion
- Users can see complete text before locking
- Lock button is accessible for truncated nodes
- Natural workflow: select → see full text → lock if desired

**Benefits**:
- ✅ Maximum text visible within height constraints
- ✅ Editing shows all text for easier modifications
- ✅ Selection shows all text for review before locking
- ✅ Natural workflow for lock button usage
- ✅ No wasted vertical space

**Behavior Summary**:
- **Normal state + maxNodeHeight set**: Shows max lines with "..." at bottom
- **Editing**: Auto-expands to show ALL lines (ignores maxNodeHeight)
- **Selected**: Auto-expands to show ALL lines (ignores maxNodeHeight)
- **Working/Locked**: Already expands via existing shouldExpand logic
- **No maxNodeHeight (0)**: Always shows all lines

**Testing**:
- maxNodeHeight 100px, 200-char text: Shows all 5 lines, last truncated with "..." ✓
- Last line truncated mid-text (not removed): "long text he..." ✓
- Rectangle height matches content exactly (no wasted space) ✓
- Ellipsis positioned within rectangle bounds ✓
- Double-click to edit: Expands to show all lines ✓
- Click to select: Expands to show all lines ✓
- Lock button accessible after selection ✓
- Finish editing: Returns to truncated state ✓

### Session 11: Curved Arrow Styling

**Feature Request**: "How hard would it be to implement different arrow pathing styles? Like curvy, straight, rectangular if you catch my drift"

**Implemented**: Curved arrow styling system with user-configurable options

**What Was Added**:

1. **Arrow Style Setting** (lines 1141-1142):
   - New configuration: `arrowStyle: 'straight' | 'curved'` (default: 'straight')
   - New configuration: `arrowCurvature: 0.05-0.5` (default: 0.25)
   - Backward compatible - existing users keep straight arrows

2. **Curved Path Renderer** (lines 4408-4440):
   ```javascript
   createCurvedPath(x1, y1, x2, y2, className) {
       // Calculate curve control points
       const dx = x2 - x1;
       const dy = y2 - y1;
       const distance = Math.sqrt(dx * dx + dy * dy);

       // Curve intensity based on distance and user setting
       const curveAmount = distance * this.arrowCurvature;

       // Create perpendicular offset for smooth curve
       const angle = Math.atan2(dy, dx);
       const perpAngle = angle + Math.PI / 2;

       // Control points offset perpendicular to the line
       const offsetX = Math.cos(perpAngle) * curveAmount;
       const offsetY = Math.sin(perpAngle) * curveAmount;

       // Midpoint for control
       const midX = (x1 + x2) / 2;
       const midY = (y1 + y2) / 2;

       // Quadratic bezier curve through offset midpoint
       const d = `M ${x1} ${y1} Q ${midX + offsetX} ${midY + offsetY}, ${x2} ${y2}`;

       return path; // SVG <path> element
   }
   ```

3. **Smart Dispatch System** (lines 4392-4406):
   - Refactored `createLine()` to dispatch based on `arrowStyle` setting
   - Returns `<line>` for straight, `<path>` for curved
   - No changes needed at call sites - all 7 arrow creation points work automatically:
     - Main parent links (visible + hit detection)
     - Other parent links (visible + hit detection)
     - Dependency links (visible + hit detection)
     - Temporary drag preview line

4. **Settings UI** (lines 2397-2415):
   - **Arrow Style**: Dropdown with "Straight" and "Curved" options
   - **Arrow Curvature**: Slider from 0.05 (subtle) to 0.5 (dramatic)
   - Live preview: Change setting, click Apply, see results immediately

5. **Persistence** (lines 4788-4789, 4822-4823, 4882-4883):
   - Arrow settings saved to localStorage
   - Properly loaded with defaults using null-coalescing operator
   - Survives page refresh

**Technical Details**:

**Quadratic Bezier Curves**:
- Uses SVG `Q` command: `M x1 y1 Q controlX controlY, x2 y2`
- Control point perpendicular to line direction for smooth, natural curves
- Curve intensity scales with distance (longer arrows = more curve)

**Why Perpendicular Offset**:
- Curves sideways relative to line direction
- Creates organic, flowing appearance
- Avoids awkward curves that bend backward

**Hit Detection**:
- Curved paths use same class system as straight lines
- Wide invisible paths for click detection
- Thin visible paths for display

**Benefits**:
- ✅ Beautiful, organic visual style
- ✅ Reduces visual clutter in complex graphs
- ✅ Easier to trace relationships
- ✅ User-configurable intensity
- ✅ Zero performance impact (simple math)
- ✅ Works with all existing features (golden paths, selection, etc.)

**User Control**:
- **Straight arrows** (default): Clean, minimal, direct
- **Curved arrows** (0.05-0.5): Organic, flowing, less visual noise
- **Curvature slider**: Fine-tune curve intensity to preference

**Testing**:
- Switch between straight and curved: Settings apply immediately ✓
- Curvature slider 0.05: Subtle curves ✓
- Curvature slider 0.5: Dramatic curves ✓
- Golden path highlighting: Works with curved arrows ✓
- Hit detection: Click curved arrows to select ✓
- Dependency creation (Alt+drag): Works with curved style ✓
- Persistence: Setting survives refresh ✓

**Future Potential**:
- Orthogonal/Manhattan routing (rectangular paths) - complex algorithm, better for auto-layout
- Per-link styling (e.g., curved parents, straight dependencies)
- Animation along curved paths

### Session 11 Continued: Bug Fixes

**Issue 1: Node Padding Affecting Height**

**Problem**: The "Node Padding" setting (intended for left/right padding) was incorrectly affecting node height, causing height to change when adjusting horizontal padding.

**Root Cause** (lines 4082, 4102, 4168, 4188, 4364):
- `nodePadding` was being used for both horizontal AND vertical padding calculations
- Changing horizontal padding slider affected rectangle height
- Confusing UX - padding setting had unexpected effects

**Solution**:
- Introduced fixed `verticalPadding = 10` for all height calculations
- `nodePadding` now only affects horizontal (left/right) spacing
- Clear separation of concerns

**Changes**:
- Lines 4083-4104: Use `verticalPadding` for height calculations
- Lines 4168, 4188: Use `verticalPadding` for text vertical positioning
- Line 4364: Use `verticalPadding` in `calculateTaskDimensions()`

**Issue 2: Curved Arrow Settings Not Applying**

**Problem**: Changing "Arrow Style" from Straight to Curved and clicking "Apply" had no effect. Setting didn't persist or apply.

**Root Cause** (line 2528):
```javascript
// BEFORE (broken):
else if (def.type === 'select') {
    this[key] = parseInt(input.value); // Forces to integer!
}
```
- Code assumed ALL select inputs have numeric values
- `arrowStyle` uses string values ('straight', 'curved')
- `parseInt('straight')` → `NaN` → setting broken

**Solution** (lines 2528-2535):
```javascript
// AFTER (fixed):
else if (def.type === 'select') {
    const firstOptionValue = def.options[0].value;
    if (typeof firstOptionValue === 'number' || !isNaN(parseInt(firstOptionValue))) {
        this[key] = parseInt(input.value); // Numeric selects (e.g., fontWeight)
    } else {
        this[key] = input.value; // String selects (e.g., arrowStyle)
    }
}
```

**Impact**:
- ✅ Node padding now only affects horizontal spacing (as intended)
- ✅ Arrow style setting applies immediately
- ✅ Arrow curvature slider works correctly
- ✅ Settings persist across refresh
- ✅ Backward compatible with numeric select inputs (fontWeight)

**Testing**:
- Adjust node padding: Only width changes ✓
- Change arrow style to curved: Applies immediately ✓
- Adjust curvature slider: Curves change intensity ✓
- Refresh page: Settings persist ✓

### Session 11 Continued: Updated Default Settings

**Changes**: Updated default settings for better visual appearance and usability.

**New Defaults**:
- **Character Width**: 8 → **8.5** (better spacing for modern fonts)
- **Node Padding**: 15 → **30** (more breathing room inside rectangles)
- **Minimum Node Width**: 80 → **100** (prevents overly narrow nodes)
- **Node Padding Max**: 20 → **50** (allows for more padding customization)

**Rationale**:
- Wider padding creates cleaner, more readable nodes
- Slightly increased character width accounts for font rendering variations
- Higher minimum width prevents cramped appearance
- Changes apply to new users; existing users keep their saved settings

**Updated Files**:
- Lines 1129-1131: App state initialization
- Lines 2308, 2317, 2325: ConfigDefs defaults
- Lines 4880-4882: LoadFromStorage defaults
- README Settings UI section: Updated documentation

### Session 12: Configurable Undo/Redo History

**New Features**: Enhanced undo/redo system with user control and visibility.

**1. Configurable History Limit**:
- Added `maxUndoSteps` to Settings UI (5-200 step range, default: 50)
- Users can now customize undo history size based on their needs and available memory
- Changes apply immediately via `enforceUndoLimit()` method
- Excess snapshots automatically trimmed when limit is reduced

**2. Clear History Button**:
- New "History Management" section in Settings modal
- Shows live stats: undo count, redo count, memory usage estimate
- Red "Clear Undo/Redo History" button with confirmation dialog
- Safely frees up localStorage space when history grows too large

**3. Visual Indicators**:
- Real-time display of undo steps vs limit (e.g., "15 / 50")
- Memory usage estimate calculated from JSON size
- Stats update when Settings modal opens
- Stats refresh after clearing history

**Implementation Details**:
- Line 2416-2424: Added `maxUndoSteps` to configDefs
- Lines 1057-1080: Added History Management section to Settings modal HTML
- Lines 2535-2546: Update history stats when modal opens
- Lines 4736-4742: New `enforceUndoLimit()` method
- Lines 4744-4775: New `clearUndoHistory()` method with confirmation
- Line 2592: Call `enforceUndoLimit()` in `applySettings()`
- Line 4658: Call `enforceUndoLimit()` in `saveSnapshot()`

**Benefits**:
- **Memory Control**: Users with large projects can reduce history to save memory
- **Deep History**: Users who need extensive undo can increase limit up to 200 steps
- **Transparency**: Clear visibility into how much storage undo/redo is using
- **Storage Management**: Manual clearing option when localStorage fills up

**Testing Completed**:
- ✓ Change limit from 50 → 20 → Old snapshots trimmed correctly
- ✓ Change limit from 20 → 100 → Can accumulate more snapshots
- ✓ Clear history → Both undo and redo stacks cleared
- ✓ Stats display updates correctly in Settings modal
- ✓ Memory estimate calculated accurately

### Session 12 Continued: Performance Fix for Canvas Panning

**Issue**: Canvas panning caused significant performance degradation due to synchronous localStorage writes on every mouseup event.

**Root Cause**:
- Line 3298 (now 3301) called `saveToStorage()` on every canvas pan mouseup
- Each save serializes the entire app state: all tasks, undo/redo stacks (50+ snapshots each!), settings, homes
- localStorage writes are synchronous and block the main thread
- This created noticeable lag during frequent panning operations

**Solution**: Implemented debounced save mechanism
- Added `debouncedSaveToStorage(delay)` method (lines 4862-4878)
- Waits 500ms after last pan operation before saving
- Prevents excessive writes during rapid interactions
- First pan triggers timer, subsequent pans within 500ms reset timer
- Only saves once after user stops panning

**Implementation Details**:
- Line 1180: Added `saveDebounceTimer` to app state
- Lines 4862-4878: New `debouncedSaveToStorage()` method with clearTimeout logic
- Line 3301: Changed `saveToStorage()` to `debouncedSaveToStorage(500)`
- Debounce delay: 500ms (half-second after last pan)

**Performance Impact**:
- **Before**: Save on EVERY pan mouseup (could be 10+ times per second during rapid panning)
- **After**: Save once after panning stops (500ms delay)
- **Result**: ~95% reduction in localStorage writes during pan operations
- Eliminates UI lag/stutter during canvas navigation

**Why Canvas Panning Needs Saving**:
Unlike typical viewport navigation, this app's canvas panning actually modifies task positions (lines 3184-3186). All tasks move together when panning, so positions must be persisted. However, we don't need to save on EVERY mousemove - debouncing is perfect for this use case.

**Other Operations Not Affected**:
- Task creation/deletion/editing: Still save immediately (no debounce)
- Undo/redo: Still save immediately
- Settings changes: Still save immediately
- Only canvas panning uses debounced save

**Testing Completed**:
- ✓ Rapid panning: Smooth performance, no stuttering
- ✓ Pan then wait 500ms: Data persists correctly
- ✓ Pan, refresh browser after 500ms: Positions saved
- ✓ Pan, refresh immediately: May lose last pan (acceptable tradeoff)

### Session 13: Home Keybinds for Instant Navigation

**New Feature**: Keyboard shortcuts (0-9) for jumping to home bookmarks.

**Problem**: Accessing homes required opening dropdown menus or context menus, which interrupts workflow.

**Solution**: Add keyboard shortcut support to homes
- Assign number keys 0-9 to any home
- Press assigned key to instantly jump to that home
- Perfect for power users and frequent navigation

**Implementation Details**:

**1. Data Structure Update**:
- Line 1170: Added `keybind` property to homes array comment
- Line 5066: New homes created with `keybind: null` by default
- Keybind stored as string (e.g., "1", "2", "0")

**2. UI for Setting Keybinds** (lines 5252-5318):
- `setKeybindForHome(homeId)` method
- Shows alert modal with instructions
- Captures next keypress using temporary event listener
- Validates only 0-9 keys allowed
- Conflict detection: warns if key already assigned
- Reassignment dialog: allows moving keybind to new home
- Escape key clears existing keybind or cancels

**3. Keyboard Event Handler** (lines 1470-1478):
- Added to main keydown listener (after undo/redo shortcuts)
- Only triggers when NOT editing text
- Only triggers when no modifiers (Ctrl/Cmd/Alt) pressed
- Finds home with matching keybind and calls `jumpToHome()`
- Prevents default to avoid typing numbers

**4. Visual Display**:
- Line 5447: Manage Homes modal shows keybind in details (e.g., "Keybind: 1")
- Line 5480: Keybind button shows "⌨ Set Key" or "⌨ [key]"
- Line 5409: Homes dropdown shows keybind next to name (e.g., "Work [1]")
- Line 3759: Context menu submenu shows keybind (e.g., "Work [1]")

**Keybind Management Features**:
- **Conflict Detection**: Warns when key already assigned to another home
- **Reassignment**: User can choose to move keybind from old home to new
- **Clear Keybind**: Press Escape to remove assigned keybind
- **Visual Feedback**: Keybinds displayed everywhere homes are shown
- **Button Label**: Shows current keybind on button (e.g., "⌨ 5")

**User Experience**:
- **Fast Navigation**: Single keypress to jump anywhere
- **No Menu Friction**: Direct access without opening dropdowns
- **Visual Discovery**: Keybinds shown in all menus for learning
- **Power User Friendly**: Up to 10 homes can have instant access
- **Conflict Safe**: Prevents accidental overwrites with confirmation

**Use Cases**:
- Frontend dev → Press 1, Backend → Press 2, Docs → Press 3
- Personal: Work → 1, Home → 2, Goals → 3
- Large graphs: Different project areas mapped to number keys
- Presentation mode: Key milestones on 1-9 for quick demos

**Testing Completed**:
- ✓ Assign keybind to home → Press number → Jumps correctly
- ✓ Conflict detection → Shows dialog with reassignment option
- ✓ Clear keybind with Escape → Removes keybind successfully
- ✓ Keybinds display in dropdown, context menu, manage modal
- ✓ Keybinds don't trigger while editing text
- ✓ Keybinds don't conflict with Ctrl+1 (fit all)

**Dark Mode Fix** (lines 5523-5536):
- Fixed text visibility in Manage Homes modal for dark mode
- Home names now use `#e2e8f0` (light slate) in dark mode instead of `#333`
- Details text uses `#94a3b8` (slate gray) in dark mode instead of `#666`
- Dynamically checks `document.body.classList.contains('dark-mode')`
- Origin Home purple color (#9c27b0) maintained in both modes for consistency

### Session 13 Continued: Jump to Home Save Fix

**Bug**: Camera position after jumping to home via keybind was not being saved to localStorage.

**Root Cause**:
- Line 5193 (old): `saveToStorage()` called immediately after starting animation
- Task positions modified INSIDE animation callback (lines 5151-5154)
- Save happened BEFORE positions changed, so new positions were never persisted
- On page reload, positions would revert to pre-jump state

**Solution**:
- Moved `saveToStorage()` from line 5193 to line 5187
- Now saves inside animation complete callback (when elapsed >= totalDuration)
- Ensures all position changes and zoom changes are saved AFTER animation finishes
- Toast notification still shows immediately for better UX

**Impact**:
- Both animated jumps (with keybinds) and instant jumps now persist correctly
- Positions maintained across page reloads
- No more lost navigation state

**Testing**:
- ✓ Jump to home via keybind → Refresh page → Position persists
- ✓ Animation completes → Positions saved
- ✓ Non-animated jumps still work correctly

### Session 13 Continued: Removed Reset View Feature

**Removed Feature**: "Reset View" button and functionality

**Reason**: The Reset View feature had problematic behavior:
- When no "Origin Home" existed, it would scatter all tasks randomly around screen center
- This would completely ruin carefully arranged task layouts
- Destructive operation that couldn't be easily undone (though undo system could recover)
- Users found it more harmful than helpful

**What Was Removed**:
- Line 991 (old): "Reset View" button from toolbar
- Line 3718 (old): "Reset View" entry from right-click context menu
- Lines 4608-4628 (old): `resetView()` function entirely

**Alternative Solution**:
- Users can still jump to "Origin Home" via:
  - Homes dropdown → Click "Origin Home"
  - Assign a keybind to "Origin Home" (e.g., press 0)
  - Right-click menu → Homes submenu → "Origin Home"
- "Mark Origin" button still exists and works as before
- If users want to reset their view, they can:
  1. Mark their current position as "Origin Home"
  2. Jump to it using keybind or dropdown
  - This is intentional and controlled, not destructive

**Impact**:
- Removed destructive task repositioning behavior
- Preserved "Origin Home" functionality through Homes system
- Cleaner, safer UX without unexpected task movement

---

**Last Updated**: 2025-10-26 (Session 13: Removed Reset View)
**Current Line Count**: ~5540 lines in task-tree.html
**Version**: 1.8.2 (Reset View Removed)
