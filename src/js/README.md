# JavaScript Modules - Quick Reference

This directory contains modular JavaScript extracted from task-tree.html.

## Directory Structure

```
js/
├── utils/                  # Utility functions (@order: 5-9)
│   ├── platform.js         # Platform detection & keyboard symbols
│   ├── svg.js              # SVG coordinate transformation
│   └── cycle-detection.js  # Dependency cycle prevention
│
├── data/                   # Data management (@order: 10-14)
│   ├── undo-redo.js        # Undo/redo system
│   ├── persistence.js      # localStorage layer
│   ├── import-export.js    # JSON import/export
│   └── clipboard.js        # Copy/paste subtrees
│
├── LOAD_ORDER.md           # Detailed load order documentation
└── README.md               # This file
```

## Quick Start

### 1. Load modules in order

```html
<!-- Utils -->
<script src="src/js/utils/platform.js"></script>
<script src="src/js/utils/svg.js"></script>
<script src="src/js/utils/cycle-detection.js"></script>

<!-- Data -->
<script src="src/js/data/undo-redo.js"></script>
<script src="src/js/data/persistence.js"></script>
<script src="src/js/data/import-export.js"></script>
<script src="src/js/data/clipboard.js"></script>
```

### 2. Verify in console

```javascript
// Should see 7 load messages
[platform.js] Platform detection and keyboard utilities loaded
[svg.js] SVG coordinate utilities loaded
[cycle-detection.js] Dependency cycle detection loaded
[undo-redo.js] Undo/redo system loaded
[persistence.js] localStorage persistence layer loaded
[import-export.js] JSON import/export functionality loaded
[clipboard.js] Copy/paste subtree operations loaded
```

### 3. Check app object

```javascript
console.log(app.isMac);              // true/false
console.log(app.getModifierKey());   // "Cmd" or "Ctrl"
console.log(typeof app.undo);        // "function"
```

## API Reference

### Utils Layer

#### platform.js
```javascript
app.isMac          // boolean
app.isWindows      // boolean
app.isLinux        // boolean
app.getModifierKey(short)  // string: "⌘"/"Cmd" or "Ctrl"
app.getAltKey(short)       // string: "⌥"/"Option" or "Alt"
app.getShiftKey(short)     // string: "⇧" or "Shift"
```

#### svg.js
```javascript
app.getSVGPoint(mouseEvent)  // {x, y} in SVG coordinates
```

#### cycle-detection.js
```javascript
app.wouldCreateCycle(fromId, toId)  // boolean
```

### Data Layer

#### undo-redo.js
```javascript
app.saveSnapshot(description, taskId?)  // void
app.undo()                              // void
app.redo()                              // void
app.enforceUndoLimit()                  // void
app.clearUndoHistory()                  // void (shows confirmation)
```

#### persistence.js
```javascript
app.saveToStorage()     // void
app.loadFromStorage()   // void
```

#### import-export.js
```javascript
app.exportData()                    // void (downloads JSON)
app.copyDataToClipboard(event)      // void (copies to clipboard)
app.importData()                    // void (reads from textarea)
app.showImportModal()               // void
app.hideImportModal()               // void
```

#### clipboard.js
```javascript
app.copySubtree(taskId)                     // void
app.pasteSubtree(parentId?, x?, y?)        // void
app.pasteFromClipboard(parentId?, x?, y?)  // async void
```

## Common Patterns

### Adding Undo to an Operation

```javascript
// 1. BEFORE modifying tasks, save snapshot
this.saveSnapshot("Action description");

// 2. Modify tasks
this.tasks.push(newTask);

// 3. Save to localStorage
this.saveToStorage();

// 4. Update UI
this.render();
this.updateStatusBar();
```

### Smart Grouping (for text edits)

```javascript
// Pass taskId for grouping edits within 2 seconds
this.saveSnapshot(`Edited task '${title}'`, taskId);
```

### Handling Cycles

```javascript
if (this.wouldCreateCycle(fromId, toId)) {
    this.showAlert('Error', 'Cannot create circular dependency');
    return;
}
// Safe to add dependency
task.dependencies.push(toId);
```

### Platform-Specific UI

```javascript
const mod = this.getModifierKey();      // "Cmd" or "Ctrl"
const modSymbol = this.getModifierKey(true);  // "⌘" or "Ctrl"

helpText.textContent = `${mod}+C to copy`;  // "Cmd+C" or "Ctrl+C"
```

### Mouse Coordinate Conversion

```javascript
onCanvasMouseDown(e) {
    const pt = this.getSVGPoint(e);  // Convert screen to SVG coords
    const task = {
        x: pt.x,
        y: pt.y
    };
}
```

## Error Handling

### QuotaExceededError (localStorage full)
```javascript
// Automatically handled by saveToStorage()
// - Trims undo history to last 10
// - Shows toast notification
// - Retries save
```

### Clipboard API Unavailable
```javascript
// Handled by pasteFromClipboard()
// Shows error: "Clipboard API not available in this browser"
```

### Invalid Import Data
```javascript
// Handled by importData()
// Shows error: "Invalid JSON data: [error message]"
```

## Module Guidelines

### DO:
✅ Call `saveSnapshot()` BEFORE modifying tasks
✅ Use `this` to reference other app methods
✅ Add @order header to new modules
✅ Document exported functions
✅ Include console.log on module load
✅ Handle errors gracefully

### DON'T:
❌ Call `saveSnapshot()` during undo/redo operations
❌ Modify tasks without creating undo snapshot
❌ Skip module load order
❌ Create circular dependencies
❌ Forget to call `saveToStorage()` after modifications

## File Sizes

| Module | Lines | Size |
|--------|-------|------|
| platform.js | 62 | ~2 KB |
| svg.js | 36 | ~1 KB |
| cycle-detection.js | 44 | ~1 KB |
| undo-redo.js | 293 | ~10 KB |
| persistence.js | 199 | ~7 KB |
| import-export.js | 121 | ~4 KB |
| clipboard.js | 271 | ~9 KB |
| **TOTAL** | **1,026** | **~34 KB** |

## Testing

Each module can be tested independently:

```javascript
// Platform detection
console.assert(typeof app.getModifierKey() === 'string');

// SVG utilities
const pt = app.getSVGPoint({clientX: 100, clientY: 100});
console.assert(typeof pt.x === 'number');

// Cycle detection
console.assert(app.wouldCreateCycle(1, 1) === true);

// Undo/redo
app.saveSnapshot("Test");
console.assert(app.undoStack.length > 0);
app.undo();
app.redo();

// Persistence
app.saveToStorage();
app.loadFromStorage();
console.assert(Array.isArray(app.tasks));

// Export/import
app.exportData();  // Should download file
```

## Future Modules (TODO)

### Phase 3: Core Logic (@order: 15-19)
- task-management.js
- status-management.js
- relationship-management.js

### Phase 4: UI Layer (@order: 20-24)
- event-handlers.js
- rendering.js
- modals.js
- menus.js

### Phase 5: Features (@order: 25+)
- navigation.js
- homes.js
- settings.js
- status-bar.js

## Contributing

When adding new modules:

1. Choose appropriate @order number
2. Add comprehensive header documentation
3. Export functions as app methods
4. Update LOAD_ORDER.md
5. Update this README
6. Test independently

## Resources

- **EXTRACTION_SUMMARY.md** - Detailed extraction report
- **LOAD_ORDER.md** - Load sequence and dependencies
- **task-tree.html** - Original source file

## Support

For issues or questions about modules:
1. Check LOAD_ORDER.md for dependency issues
2. Verify module load messages in console
3. Check browser console for errors
4. Verify app object has required state

---

**Last Updated:** 2025-10-31
**Status:** Phases 1-2 complete (7 modules, 1,026 lines)
**Next:** Phase 3 - Core Logic extraction
