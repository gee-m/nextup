# JavaScript Module Extraction Map

This document maps ALL JavaScript functions from task-tree.html to their target module files.
**Total functions to extract: ~90 functions across 20+ files**

## Extraction Status

- ✅ **tasks.js** - COMPLETE (9 functions, lines 1878-2453)
- ✅ **status.js** - COMPLETE (13 functions, lines 1981-3034)
- 🔄 **relationships.js** - IN PROGRESS
- ⏳ **selection.js** - PENDING
- ⏳ **golden-path.js** - PENDING
- ⏳ **indicators.js** - PENDING
- ⏳ **nodes.js** - PENDING
- ⏳ **links.js** - PENDING
- ⏳ **render.js** - PENDING
- ⏳ **mouse.js** - PENDING
- ⏳ **keyboard.js** - PENDING
- ⏳ **drag.js** - PENDING
- ⏳ **edit.js** - PENDING
- ⏳ **modals.js** - PENDING
- ⏳ **context-menu.js** - PENDING
- ⏳ **status-bar.js** - PENDING
- ⏳ **settings.js** - PENDING
- ⏳ **shortcuts.js** - PENDING
- ⏳ **test-checklist.js** - PENDING
- ⏳ **viewport.js** - PENDING
- ⏳ **homes.js** - PENDING
- ⏳ **jump.js** - PENDING
- ⏳ **text-lock.js** - PENDING

---

## Phase 3: Core Domain Logic (@order: 15-19)

### ✅ src/js/core/tasks.js (@order: 15)
**COMPLETE** - 9 functions extracted

| Function | Lines | Description |
|----------|-------|-------------|
| addChildTask() | 1878-1910 | Create child task with random offset |
| createChildAtPosition() | 1912-1947 | Create child at specific coordinates |
| addRootTaskAtPosition() | 1949-1979 | Create root task at specific coordinates |
| deleteTask() | 2355-2398 | Delete task and descendants with confirmation |
| deleteMultipleTasks() | 2400-2440 | Bulk delete selected tasks |
| getDescendants() | 2442-2452 | Recursively get all descendants |
| getRootTask() | 2454-2465 | Find root task of tree |
| getAncestors() | 2467-2474 | Get all ancestors up to root |
| getPathToRoot() | 2476-2488 | Get title path from task to root |

### ✅ src/js/core/status.js (@order: 16)
**COMPLETE** - 13 functions extracted

| Function | Lines | Description |
|----------|-------|-------------|
| cycleStatus() | 1981-2067 | Cycle: pending → working → done → pending |
| toggleDone() | 2069-2125 | Toggle done status with flow state |
| toggleWorking() | 2127-2165 | Toggle working state only |
| setPriority() | 2167-2183 | Set task priority (high/medium/normal) |
| cyclePriority() | 2185-2194 | Cycle through priority levels |
| selectNode() | 2196-2213 | Single-node selection |
| toggleHiddenSelf() | 2294-2309 | Hide/show the task itself |
| toggleHidden() | 2311-2343 | Hide/show all descendants |
| getHiddenChildrenCount() | 2345-2353 | Count hidden children |
| autoCollapseCompleted() | 2490-2544 | Auto-hide completed subtrees |
| clearCompleted() | 2546-2550 | Remove all done tasks |
| toggleDarkMode() | 2552-2564 | Toggle dark mode |
| repairWorkingTasks() | 2964-3034 | Fix multiple working tasks bug |

### 🔄 src/js/core/relationships.js (@order: 17)
**Relationships and dependencies**

| Function | Lines | Description |
|----------|-------|-------------|
| reparentTask() | 4421-4473 | Change task's parent (Ctrl+drag) |
| addDependency() | 4508-4540 | Add dependency between tasks (Alt+drag) |
| removeDependency() | 4542-4553 | Remove specific dependency |
| deleteLine() | 4555-4582 | Delete link (dependency or parent) |
| wouldCreateCycle() | 4584-4602 | Check if dependency would create cycle |

### ⏳ src/js/core/selection.js (@order: 18)
**Multi-select and box selection**

| Function | Lines | Description |
|----------|-------|-------------|
| (box selection logic) | TBD | Extract from setupEventListeners() |
| (multi-select toggle) | TBD | Extract from mouse handlers |
| (select all in subtree) | TBD | Extract from context menu |

### ⏳ src/js/core/helpers.js (@order: 19)
**Utility functions**

| Function | Lines | Description |
|----------|-------|-------------|
| getSubtreeSize() | 3036-3053 | Count nodes in subtree |
| copySubtree() | 3055-3124 | Copy subtree to clipboard |
| pasteSubtree() | 3125-3279 | Paste subtree from clipboard |
| getSVGPoint() | 5281-5295 | Convert screen coords to SVG coords |
| getModifierKey() | 5297-5305 | Get Ctrl/Cmd key name |
| getAltKey() | 5307-5315 | Get Alt/Option key name |
| getShiftKey() | 5317-5322 | Get Shift key name |
| wrapText() | 2834-2902 | Wrap text with word/character wrap |
| extractURLsFromText() | 2904-2911 | Extract URLs from text |
| removeURLsFromText() | 2913-2923 | Remove URLs from text |
| shortenURL() | 2925-2936 | Shorten URL for display |
| isValidURL() | 2938-2945 | Validate URL format |

---

## Phase 4: Rendering (@order: 20-24)

### ⏳ src/js/rendering/golden-path.js (@order: 20)
**Golden path visualization**

| Function | Lines | Description |
|----------|-------|-------------|
| getWorkingTaskPath() | 5462-5495 | Get working task + ancestors + children |

### ⏳ src/js/rendering/indicators.js (@order: 21)
**Off-screen indicators**

| Function | Lines | Description |
|----------|-------|-------------|
| renderOffscreenIndicators() | 6131-6207 | Render arrows for off-screen working tasks |
| createDirectionalIndicator() | 6209-6304 | Create arrow pointing to off-screen task |

### ⏳ src/js/rendering/nodes.js (@order: 22)
**Task node rendering**

| Function | Lines | Description |
|----------|-------|-------------|
| calculateTaskDimensions() | 6306-6337 | Calculate rect width/height for task |
| calculateTextBoxDimensions() | 2765-2792 | Calculate dimensions for text |
| (node SVG generation) | ~5500-5900 | Extract from render() - task nodes section |

### ⏳ src/js/rendering/links.js (@order: 23)
**Link rendering**

| Function | Lines | Description |
|----------|-------|-------------|
| createLine() | 6379-6393 | Create straight line element |
| createCurvedPath() | 6395-6427 | Create curved path element |
| getLineEndAtRectEdge() | 6339-6377 | Calculate line endpoint at rect edge |
| createCursorArrow() | 6429-6457 | Create temp arrow cursor during drag |
| removeCursorArrow() | 6459-6467 | Remove temp arrow cursor |
| updateCursorArrow() | 6469-6485 | Update arrow position during drag |
| markOrigin() | 6487-6498 | Mark drag origin with circle |
| createTempLine() | 4475-4499 | Create temporary line during drag |
| removeTempLine() | 4501-4506 | Remove temporary line |
| (link SVG generation) | ~5900-6050 | Extract from render() - links section |

### ⏳ src/js/rendering/render.js (@order: 24)
**Main render function**

| Function | Lines | Description |
|----------|-------|-------------|
| render() | 5497-6129 | Main SVG rendering orchestrator |

---

## Phase 5: Interactions (@order: 25-29)

### ⏳ src/js/interactions/mouse.js (@order: 25)
**Mouse event handlers**

| Function | Lines | Description |
|----------|-------|-------------|
| onCanvasMouseDown() | 3995-4080 | Handle mouse down on canvas/tasks |
| onCanvasMouseMove() | 4082-4266 | Handle dragging |
| onCanvasMouseUp() | 4268-4419 | Handle mouse up - complete drag/click |

### ⏳ src/js/interactions/keyboard.js (@order: 26)
**Keyboard event handlers**

| Function | Lines | Description |
|----------|-------|-------------|
| (keyboard handler) | ~1476-1877 | Extract from setupEventListeners() |

### ⏳ src/js/interactions/drag.js (@order: 27)
**Drag mode logic**

| Function | Lines | Description |
|----------|-------|-------------|
| (drag node logic) | TBD | Extract from onCanvasMouseMove() |
| (drag subtree logic) | TBD | Extract from onCanvasMouseMove() |
| (reparent drag logic) | TBD | Extract from onCanvasMouseMove() |
| (dependency drag logic) | TBD | Extract from onCanvasMouseMove() |

### ⏳ src/js/interactions/edit.js (@order: 28)
**Inline text editing**

| Function | Lines | Description |
|----------|-------|-------------|
| startEditing() | 2702-2714 | Start inline editing |
| finishEditing() | 2716-2763 | Save/cancel editing |
| resizeEditingBox() | 2794-2832 | Dynamically resize edit box |

---

## Phase 6: UI Components (@order: 30-39)

### ⏳ src/js/ui/modals.js (@order: 30)
**Modal dialog system**

| Function | Lines | Description |
|----------|-------|-------------|
| showConfirm() | 3319-3339 | Show confirmation dialog |
| hideConfirm() | 3341-3344 | Hide confirmation dialog |
| showAlert() | 3346-3357 | Show alert dialog |
| hideAlert() | 3359-3362 | Hide alert dialog |
| showPrompt() | 3364-3406 | Show input prompt dialog |
| hidePrompt() | 3408-3411 | Hide input prompt dialog |

### ⏳ src/js/ui/context-menu.js (@order: 31)
**Right-click context menus**

| Function | Lines | Description |
|----------|-------|-------------|
| showNodeMenu() | 4604-4905 | Show task node context menu |
| showEmptySpaceMenu() | 4907-5131 | Show empty space context menu |
| closeMenu() | 5133-5143 | Close context menu |
| copyTaskText() | 5145-5154 | Copy task text to clipboard |
| attachLink() | 5156-5183 | Attach link to task |
| openLink() | 5185-5192 | Open URL in new tab |
| removeAllLinks() | 5194-5210 | Remove all links from task |
| showLinksDropdown() | 5212-5274 | Show links dropdown |
| closeLinksDropdown() | 5276-5279 | Close links dropdown |

### ⏳ src/js/ui/status-bar.js (@order: 32)
**Bottom status bar**

| Function | Lines | Description |
|----------|-------|-------------|
| updateStatusBar() | 2215-2292 | Update status bar content |

### ⏳ src/js/ui/settings.js (@order: 33)
**Settings modal**

| Function | Lines | Description |
|----------|-------|-------------|
| showSettingsModal() | 3413-3676 | Show settings modal |
| hideSettingsModal() | 3678-3697 | Hide settings modal |
| applySettings() | 3699-3749 | Apply settings changes |
| resetSettings() | 3751-3774 | Reset to defaults |
| exportSettings() | 3776-3797 | Export settings as JSON |
| calibrateCharWidth() | 2647-2700 | Measure character width for font |

### ⏳ src/js/ui/shortcuts.js (@order: 34)
**Shortcuts modal**

| Function | Lines | Description |
|----------|-------|-------------|
| showShortcutsModal() | 5324-5445 | Show keyboard shortcuts modal |
| hideShortcutsModal() | 5447-5460 | Hide shortcuts modal |
| updateShortcutsHelp() | 1459-1474 | Update shortcuts help text |

### ⏳ src/js/ui/test-checklist.js (@order: 35)
**Test data injection**

| Function | Lines | Description |
|----------|-------|-------------|
| loadTestChecklist() | 3825-3961 | Inject test checklist tasks |

### ⏳ src/js/ui/toast.js (@order: 36)
**Toast notifications**

| Function | Lines | Description |
|----------|-------|-------------|
| showToast() | 3799-3823 | Show toast notification |

### ⏳ src/js/ui/import-export.js (@order: 37)
**Data import/export**

| Function | Lines | Description |
|----------|-------|-------------|
| exportData() | 3280-3289 | Export all data as JSON |
| copyDataToClipboard() | 3291-3306 | Copy data to clipboard |
| showImportModal() | 3308-3312 | Show import modal |
| hideImportModal() | 3314-3317 | Hide import modal |
| importData() | 3962-3993 | Import data from JSON |
| clearAllData() | 2947-2962 | Clear all data with confirmation |

---

## Phase 7: Navigation (@order: 40-44)

### ⏳ src/js/navigation/viewport.js (@order: 40)
**Zoom and pan**

| Function | Lines | Description |
|----------|-------|-------------|
| zoomIn() | 2566-2571 | Zoom in |
| zoomOut() | 2573-2578 | Zoom out |
| resetZoom() | 2580-2585 | Reset zoom to 100% |
| zoomToFit() | 2587-2624 | Fit all tasks in viewport |
| updateZoomDisplay() | 2626-2632 | Update zoom percentage display |
| updateViewBoxOnly() | 2634-2645 | Update SVG viewBox without full render |

### ⏳ src/js/navigation/homes.js (@order: 41)
**Bookmark/home management**

| Function | Lines | Description |
|----------|-------|-------------|
| createHome() | 6925-6969 | Create new home bookmark |
| jumpToHome() | 6971-7080 | Jump to home with animation |
| updateHome() | 7383-7403 | Update home viewport position |
| deleteHome() | 7405-7429 | Delete home bookmark |
| setKeybindForHome() | 7431-7497 | Set number keybind for home |
| renameHome() | 7499-7531 | Rename home bookmark |
| toggleHomesDropdown() | 7533-7553 | Toggle homes dropdown |
| renderHomesDropdown() | 7555-7616 | Render homes dropdown content |
| showCreateHomeModal() | 7618-7625 | Show create home modal |
| hideCreateHomeModal() | 7627-7630 | Hide create home modal |
| createHomeFromModal() | 7632-7640 | Create home from modal input |
| showManageHomesModal() | 7642-7647 | Show manage homes modal |
| hideManageHomesModal() | 7649-7652 | Hide manage homes modal |
| renderManageHomesModal() | 7654-7774 | Render manage homes modal |

### ⏳ src/js/navigation/jump.js (@order: 42)
**Jump to working tasks**

| Function | Lines | Description |
|----------|-------|-------------|
| jumpToWorkingTask() | 7082-7217 | Jump to working task with animation |
| showWorkingTasksDropdown() | 7219-7381 | Show working tasks dropdown |

### ⏳ src/js/navigation/text-lock.js (@order: 43)
**Text expansion**

| Function | Lines | Description |
|----------|-------|-------------|
| updateTextLengthThreshold() | 7776-7785 | Update text length threshold from input |
| expandText() | 7787-7795 | Expand task text |
| toggleTextLock() | 7797-7807 | Toggle text lock (persist expansion) |

---

## Special Sections

### Undo/Redo (@order: 14)
Already extracted in **state/undo.js**

| Function | Lines | Description |
|----------|-------|-------------|
| saveSnapshot() | 6500-6611 | Save undo snapshot with smart grouping |
| _trackTasksModification() | 6613-6621 | Track last tasks modification hash |
| enforceUndoLimit() | 6623-6629 | Keep undo stack under limit |
| clearUndoHistory() | 6631-6662 | Clear undo/redo stacks |
| undo() | 6664-6700 | Undo last action |
| redo() | 6702-6742 | Redo last undone action |

### Persistence (@order: 13)
Already extracted in **state/persistence.js**

| Function | Lines | Description |
|----------|-------|-------------|
| debouncedSaveToStorage() | 6744-6760 | Debounced save (not currently used) |
| saveToStorage() | 6762-6841 | Save all state to localStorage |
| loadFromStorage() | 6843-6923 | Load state from localStorage |

### Initialization (@order: 10)
Already extracted in **state/app-state.js**

| Function | Lines | Description |
|----------|-------|-------------|
| init() | 1434-1457 | Initialize application |
| setupEventListeners() | 1476-1877 | Setup all event listeners |
| updateShortcutsHelp() | 1459-1474 | Update shortcuts help text |

---

## Extraction Script Commands

```bash
# Create remaining module files using sed extraction

# Phase 3: Core Domain Logic
sed -n '4421,4473p' task-tree.html | sed 's/^            //' > src/js/core/relationships.js
# ... (add extraction commands for each file)

# Phase 4: Rendering
sed -n '5462,5495p' task-tree.html | sed 's/^            //' > src/js/rendering/golden-path.js
# ... (add extraction commands for each file)

# Phase 5: Interactions
sed -n '3995,4080p' task-tree.html | sed 's/^            //' > src/js/interactions/mouse.js
# ... (add extraction commands for each file)

# Phase 6: UI Components
sed -n '3319,3411p' task-tree.html | sed 's/^            //' > src/js/ui/modals.js
# ... (add extraction commands for each file)

# Phase 7: Navigation
sed -n '2566,2645p' task-tree.html | sed 's/^            //' > src/js/navigation/viewport.js
# ... (add extraction commands for each file)
```

---

## Next Steps

1. ✅ Complete tasks.js extraction
2. ✅ Complete status.js extraction
3. 🔄 Complete relationships.js extraction (5 functions)
4. Extract remaining 17 modules (~70 functions)
5. Add @order and @category headers to all files
6. Add module descriptions and function documentation
7. Test that all functions are accounted for
8. Update main app.js to import all mixins

---

## Total Function Count

- **Phase 1-2 (Already Done)**: ~15 functions
- **Phase 3**: 27 functions (13 done, 14 remaining)
- **Phase 4**: 8 functions
- **Phase 5**: 7 functions
- **Phase 6**: 25 functions
- **Phase 7**: 18 functions

**Grand Total: ~90 functions across 23 module files**
