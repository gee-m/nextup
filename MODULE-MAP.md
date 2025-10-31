# Module Map - Task Tree Codebase Navigation

**Purpose**: Quick reference for finding code in `task-tree.html`. Use this to load minimal context into your LLM workflow.

---

## 🗺️ File Structure Overview

| Section | Lines | Purpose |
|---------|-------|---------|
| **CSS** | 7-1151 | All styling |
| **HTML** | 1152-1363 | Page structure, controls, modals |
| **JavaScript** | 1364-7815 | All application logic |

---

## 🎯 Quick Lookup: "I need to edit..."

### ✏️ Task Operations

| Task | Location | Line Range | Notes |
|------|----------|------------|-------|
| **Create child task** | `addChildTask()` | ~1878 | Creates task below parent |
| **Create root task** | `addRootTaskAtPosition()` | ~1949 | Creates task at canvas position |
| **Delete single task** | `deleteTask()` | ~2355 | Includes relationship cleanup |
| **Delete multiple tasks** | `deleteMultipleTasks()` | ~2400 | Batch deletion with undo |
| **Edit task text** | `startEditing()`, `finishEditing()` | ~2702-2794 | Inline text editing |
| **Copy task subtree** | `copySubtree()` | ~3055 | Copy to clipboard buffer |
| **Paste task subtree** | `pasteSubtree()` | ~3125 | Paste from clipboard |

### 🎨 Status & Visual States

| Feature | Location | Line Range | Notes |
|---------|----------|------------|-------|
| **Cycle status (pending→working→done)** | `cycleStatus()` | ~1981 | Middle-click handler |
| **Mark done** | `toggleDone()` | ~2069 | Also activates parent task |
| **Set working task** | Inside `cycleStatus()` | ~2000-2050 | Enforces single working task |
| **Auto-collapse completed** | `autoCollapseCompleted()` | ~2490 | Hides completed subtrees |
| **Golden path rendering** | `getWorkingTaskPath()`, render loop | ~5462, ~5900 | Highlights ancestor path |
| **Task node colors** | CSS `.task-node.pending/working/done` | ~250-400 | Status-based styling |

### 🔗 Relationships

| Feature | Location | Line Range | Notes |
|---------|----------|------------|-------|
| **Add dependency (Alt+drag)** | `onCanvasMouseUp()` → dependency logic | ~4400-4450 | Alt key detection |
| **Remove dependency** | `removeDependency()` | ~4542 | Cleanup from both tasks |
| **Reparent task (Ctrl+drag)** | `onCanvasMouseUp()` → reparent logic | ~4350-4400 | Updates mainParent |
| **Cycle detection** | `wouldCreateCycle()` | ~4584 | Prevents circular dependencies |
| **Relationship cleanup** | Inside `deleteTask()` | ~2355-2400 | Removes orphaned links |

### 🖱️ Mouse Interactions

| Feature | Location | Line Range | Notes |
|---------|----------|------------|-------|
| **Mouse down handler** | `onCanvasMouseDown()` | ~3995 | Detects drag mode |
| **Mouse move handler** | `onCanvasMouseMove()` | ~4082 | Drag preview, cursor arrow |
| **Mouse up handler** | `onCanvasMouseUp()` | ~4268 | Completes drag, executes action |
| **Context menu** | `onTaskNodeRightClick()` | ~5050-5133 | Right-click menu |
| **Click vs drag detection** | Inside `onCanvasMouseUp()` | ~4268-4350 | 200ms + 5px threshold |
| **Drag modes (shift/ctrl/alt)** | Inside `onCanvasMouseDown()` | ~4000-4080 | Modifier key detection |
| **Box selection** | `startBoxSelect()`, `updateBoxSelect()` | ~4700-4850 | Shift+drag on canvas |

### ⌨️ Keyboard Shortcuts

| Feature | Location | Line Range | Notes |
|---------|----------|------------|-------|
| **Keyboard event handler** | `setupEventListeners()` → keydown | ~1490-1518 | Main keyboard dispatcher |
| **Undo (Ctrl+Z)** | `undo()` | ~6664 | Restores previous state |
| **Redo (Ctrl+Shift+Z)** | `redo()` | ~6702 | Restores next state |
| **Delete selected (Delete/Backspace)** | Keydown handler → delete logic | ~1500-1510 | Calls deleteMultipleTasks() |
| **Jump to working (J)** | Keydown handler → jump logic | ~1500-1510 | Shows dropdown or jumps |
| **Jump to home (0-9)** | Keydown handler → home jump | ~1500-1510 | Direct bookmark navigation |
| **Escape (clear selection)** | Keydown handler → clear | ~1500-1510 | Clears selectedTaskIds |
| **Shortcuts modal** | `showShortcutsModal()` | ~5324 | **⚠️ MUST UPDATE when adding shortcuts** |

### 🎨 Rendering & Visuals

| Feature | Location | Line Range | Notes |
|---------|----------|------------|-------|
| **Main render loop** | `render()` | ~5497 | Renders all nodes and links |
| **Render task nodes** | Inside `render()` → node loop | ~5650-5900 | SVG rect + text generation |
| **Render links** | Inside `render()` → link loop | ~5900-6100 | Parent, dependency, other-parent lines |
| **Golden path arrows** | Inside render → link styling | ~5950-6000 | Amber arrows for working task path |
| **Offscreen indicators** | `renderOffscreenIndicators()` | ~6131 | Arrows pointing to off-canvas working tasks |
| **Cursor arrow (drag preview)** | `createCursorArrow()`, `removeCursorArrow()` | ~6429, ~6459 | Shows drag direction |
| **SVG coordinate conversion** | `getSVGPoint()` | ~5281 | Mouse → SVG coords |
| **Node width calculation** | Inside `render()` → width calc | ~5700-5750 | Uses charWidth, nodePadding |

### 🧭 Navigation

| Feature | Location | Line Range | Notes |
|---------|----------|------------|-------|
| **Zoom in/out** | `zoomIn()`, `zoomOut()` | ~2566, ~2573 | Adjusts zoomLevel |
| **Reset zoom** | `resetZoom()` | ~2580 | Sets zoom to 1.0 |
| **Fit to screen** | `zoomToFit()` | ~2587 | Auto-scales to show all tasks |
| **Pan canvas** | `onCanvasMouseMove()` → pan mode | ~4100-4150 | Middle-drag or no-task drag |
| **Jump to working task** | `jumpToWorkingTask()` | ~7082 | Animated pan+zoom |
| **Homes (bookmarks)** | `renderHomesDropdown()`, `createHomeFromModal()` | ~7555, ~7632 | Save/restore viewport |
| **Working tasks dropdown** | `showWorkingTasksDropdown()` | ~7100-7200 | Shows all working tasks |

### 💾 Data Management

| Feature | Location | Line Range | Notes |
|---------|----------|------------|-------|
| **Save to localStorage** | `saveToStorage()` | ~6762 | Auto-saves on every change |
| **Load from localStorage** | `loadFromStorage()` | ~6843 | Loads on init |
| **Export JSON** | `exportData()` | ~3280 | Downloads tasks as JSON file |
| **Import JSON** | `importData()` | ~3962 | Loads tasks from JSON |
| **Copy JSON to clipboard** | `copyDataToClipboard()` | ~3300-3350 | For sharing/backup |
| **Clear all data** | `clearAllData()` | ~2947 | Wipes tasks and localStorage |
| **Repair working tasks** | `repairWorkingTasks()` | ~2964 | Fixes corrupted states |

### ⏮️ Undo/Redo System

| Feature | Location | Line Range | Notes |
|---------|----------|------------|-------|
| **Save snapshot** | `saveSnapshot()` | ~6500 | **⚠️ Call BEFORE modifying tasks** |
| **Undo** | `undo()` | ~6664 | Pop from undoStack |
| **Redo** | `redo()` | ~6702 | Pop from redoStack |
| **Clear history** | `clearUndoHistory()` | ~6631 | Wipes both stacks |
| **Enforce undo limit** | `enforceUndoLimit()` | ~6623 | Keeps stack ≤ maxUndoSteps |
| **Smart edit grouping** | Inside `saveSnapshot()` | ~6550-6600 | Groups rapid edits to same task |

**⚠️ CRITICAL**: ALL operations that modify `app.tasks` MUST call `saveSnapshot()` first!

Integration checklist at line ~3426 (in JavaScript section).

### 🎛️ Settings & Configuration

| Feature | Location | Line Range | Notes |
|---------|----------|------------|-------|
| **Settings modal** | `showSettingsModal()`, `applySettings()` | ~3413, ~3699 | User preferences UI |
| **Default config** | `app` object initialization | ~1365-1433 | All configurable parameters |
| **Config definitions** | Inside `showSettingsModal()` → configDefs | ~3450-3650 | Metadata for settings UI |
| **Dark mode toggle** | `toggleDarkMode()` | ~2552 | Switches theme |
| **Font settings** | App state → fontFamily, fontWeight | ~1380-1390 | Typography config |
| **Node sizing** | App state → charWidth, nodePadding, min/maxNodeWidth | ~1370-1380 | Layout config |

### 🎭 UI Components

| Feature | Location | Line Range | Notes |
|---------|----------|------------|-------|
| **Context menu** | `onTaskNodeRightClick()` | ~5050-5133 | Right-click on task |
| **Status bar** | `updateStatusBar()` | ~2215 | Shows working task path |
| **Shortcuts modal** | `showShortcutsModal()` | ~5324 | Keyboard reference |
| **Modal system (confirm/alert/prompt)** | `showConfirm()`, `showAlert()`, `showPrompt()` | ~3319-3410 | Custom dialogs |
| **Import modal** | `showImportModal()`, `importData()` | ~3308, ~3962 | JSON import UI |
| **Homes dropdown** | `toggleHomesDropdown()` | ~7500-7555 | Bookmark menu |
| **Working tasks dropdown** | `showWorkingTasksDropdown()` | ~7100-7200 | Jump menu for working tasks |

### 🧪 Testing & Debugging

| Feature | Location | Line Range | Notes |
|---------|----------|------------|-------|
| **Test checklist** | `loadTestChecklist()` | ~3825 | Injects test task data |
| **Console logging** | `console.log()` calls throughout | Various | Debug output |
| **Data repair** | `repairWorkingTasks()` | ~2964 | Fixes corrupted data |

---

## 📦 App State Object (`app`)

**Location**: Lines ~1365-1433

**Core Properties**:
```javascript
app = {
    // Data
    tasks: [],                      // Array of all tasks
    taskIdCounter: 0,               // ID generator

    // Selection
    selectedTaskIds: Set,           // Multi-select
    selectedLine: null,             // Selected relationship line

    // Editing
    editingTaskId: null,            // Currently editing task

    // Viewport
    viewBox: {x, y, width, height}, // Pan/zoom state
    zoomLevel: 1.0,

    // Drag state
    dragMode: 'node'|'subtree'|'reparent'|'dependency',
    dragStart: {x, y},
    dragOriginalPos: {x, y},

    // Visual config
    charWidth: 8.5,
    nodePadding: 15,
    minNodeWidth: 100,
    maxNodeWidth: 600,
    fontFamily: '...',

    // Bookmarks
    homes: [],

    // Undo/redo
    undoStack: [],
    redoStack: [],

    // Methods (all app logic)
    init() {},
    render() {},
    saveToStorage() {},
    // ... 100+ methods
}
```

---

## 🏗️ Architecture Patterns

### State Mutation Flow
```
User Action → Event Handler → saveSnapshot() → Modify app.tasks → saveToStorage() → render()
```

### Rendering Pipeline
```
render() → getWorkingTaskPath() → [loop tasks] → create SVG nodes → create SVG links
```

### Drag Interaction Flow
```
onCanvasMouseDown() → detect modifier keys → set dragMode → dragStart = mouse pos
onCanvasMouseMove() → update tempLine/cursorArrow → show preview
onCanvasMouseUp() → execute action based on dragMode → cleanup
```

### Click Detection
```
onCanvasMouseDown() → save dragOriginalPos
onCanvasMouseUp() → calculate distance moved
  if distance < 5px → treat as click → show context menu after 200ms
  if double-click within 200ms → cancel menu → startEditing()
```

---

## 🚨 Common Modification Patterns

### Adding a New Keyboard Shortcut

1. **Add handler** in `setupEventListeners()` keydown (line ~1500)
2. **Update shortcuts modal** in `showShortcutsModal()` (line ~5324) ⚠️ **REQUIRED**
3. **Update help text** in `updateShortcutsHelp()` (line ~1459) if major shortcut
4. **Document in README**

### Adding a New Task Property

1. **Update task creation** in `addChildTask()` (line ~1878) and `addRootTaskAtPosition()` (line ~1949)
2. **Update rendering** in `render()` (line ~5497) if visual changes needed
3. **Add to config** if user-customizable (app state ~1365 + settings modal ~3450)

### Adding a New Relationship Type

1. **Add array to task model** (e.g., `blockedBy: []`)
2. **Add visual rendering** in render() link section (line ~5900)
3. **Add interaction handler** with new modifier key in `onCanvasMouseDown()` (line ~4000)
4. **Add removal method** (similar to `removeDependency()` at line ~4542)
5. **Add cycle detection** if bidirectional

### Adding a New Modal

1. **Add HTML** in modals section (lines 1220-1348)
2. **Add CSS** in modal styles (lines ~801-1000)
3. **Add show/hide methods** (pattern: `showXModal()`, `hideXModal()`)
4. **Add trigger** in controls or context menu

### Integrating with Undo/Redo

1. **Add `saveSnapshot("Description")` call** BEFORE modifying tasks
2. **Update integration checklist** in comments (line ~3426)
3. **Test**: Do action → Undo → Redo → verify state

---

## 🎯 LLM Usage Tips

### For Targeted Edits
```
Example: "Fix zoom-to-fit calculation"
1. Read MODULE-MAP.md (this file)
2. Lookup "Fit to screen" → zoomToFit() at line ~2587
3. Read lines 2587-2625 (just that function)
4. Read render() header (lines 5497-5550) to understand node positions
5. Make fix
```

### For Feature Additions
```
Example: "Add 'Jump to parent' shortcut"
1. Read keyboard shortcuts section (lines ~1490-1518)
2. Read jump logic (lines ~7082-7200)
3. Read shortcuts modal (lines ~5324-5447)
4. Implement: keydown handler → jump logic → update modal
```

### For Debugging
```
Example: "Why aren't dependencies rendering?"
1. Read render() link section (lines ~5900-6100)
2. Read dependency creation (lines ~4400-4450)
3. Check task data structure (line ~1365)
4. Add console.log in render loop to inspect
```

---

## 📚 Cross-File References (Future Modular Structure)

When this gets refactored into modules, dependencies will be:

```
app.js
  ├─ state.js
  ├─ config.js
  ├─ core/tasks.js
  │   └─ data/undo-redo.js
  ├─ core/status.js
  ├─ core/relationships.js
  │   └─ utils/cycle-detection.js
  ├─ rendering/render.js
  │   ├─ rendering/nodes.js
  │   ├─ rendering/links.js
  │   └─ rendering/golden-path.js
  ├─ interactions/mouse.js
  │   └─ interactions/drag.js
  ├─ interactions/keyboard.js
  ├─ navigation/viewport.js
  ├─ navigation/jump.js
  ├─ ui/modals.js
  └─ data/persistence.js
```

See `REFACTORING-PROPOSAL.md` for full modular structure plan.

---

## 🤖 For Claude Code

When editing task-tree.html:
1. **Always check this file first** to find exact line ranges
2. **Read only the specific function/section** you need to edit
3. **Search for function name** instead of reading whole file
4. **Use line ranges** to load minimal context
5. **Update this file** if you discover incorrect line numbers

**Example workflow**:
```
User: "Fix the undo system"
Claude:
1. Read MODULE-MAP.md line 200-250 (undo/redo section)
2. Read task-tree.html lines 6500-6740 (just undo/redo code)
3. Make fix
4. Test with Ctrl+Z and Ctrl+Shift+Z
5. Update MODULE-MAP.md if line numbers shifted
```

---

## 📝 Maintenance

**When line numbers shift**:
- Update this file with new ranges
- Run search for function names to verify locations
- Document major structural changes in CHANGELOG

**Last updated**: 2025-10-31
**File version**: task-tree.html (7,817 lines)
