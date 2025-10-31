# JavaScript Module Load Order

This file documents the required load order for all extracted JavaScript modules.

## Critical Rules

1. **Load by @order number** - Modules MUST load in ascending order (5, 6, 8, 10, 11, 12, 13, ...)
2. **Dependencies** - Later modules depend on earlier ones
3. **app object** - All modules add methods to the global `app` object
4. **Single-file compatibility** - All modules designed to work when loaded sequentially

## Phase 1: Utils Layer (@order: 5-9)

### @order: 5 - platform.js
```html
<script src="src/js/utils/platform.js"></script>
```
**Provides:** isMac, isWindows, isLinux, getModifierKey(), getAltKey(), getShiftKey()
**Dependencies:** None (pure platform detection)

---

### @order: 6 - svg.js
```html
<script src="src/js/utils/svg.js"></script>
```
**Provides:** getSVGPoint()
**Dependencies:** None (pure SVG utilities)

---

### @order: 7 - geometry.js (TODO: Phase 3)
```html
<!-- <script src="src/js/utils/geometry.js"></script> -->
```
**Provides:** getBoundingBox(), distance calculations
**Status:** Not yet extracted

---

### @order: 8 - cycle-detection.js
```html
<script src="src/js/utils/cycle-detection.js"></script>
```
**Provides:** wouldCreateCycle()
**Dependencies:** Requires `this.tasks` array to exist

---

## Phase 2: Data Layer (@order: 10-14)

### @order: 10 - undo-redo.js
```html
<script src="src/js/data/undo-redo.js"></script>
```
**Provides:** saveSnapshot(), undo(), redo(), enforceUndoLimit(), clearUndoHistory()
**Dependencies:**
- Requires `this.tasks`, `this.undoStack`, `this.redoStack` arrays
- Calls `this.saveToStorage()`, `this.render()`, `this.updateStatusBar()`
- Calls `this.showToast()`, `this.showConfirm()` (UI layer)

---

### @order: 11 - persistence.js
```html
<script src="src/js/data/persistence.js"></script>
```
**Provides:** saveToStorage(), loadFromStorage()
**Dependencies:**
- Requires all app state properties (tasks, viewBox, homes, etc.)
- Calls `this.showToast()` for error handling
- Calls `this.updateZoomDisplay()` on load

---

### @order: 12 - import-export.js
```html
<script src="src/js/data/import-export.js"></script>
```
**Provides:** exportData(), copyDataToClipboard(), importData(), showImportModal(), hideImportModal()
**Dependencies:**
- Requires `this.saveSnapshot()` (undo-redo.js)
- Requires `this.loadFromStorage()` (persistence.js)
- Calls `this.showAlert()` (UI layer)
- Calls `this.render()`, `this.updateStatusBar()` (UI layer)

---

### @order: 13 - clipboard.js
```html
<script src="src/js/data/clipboard.js"></script>
```
**Provides:** copySubtree(), pasteSubtree(), pasteFromClipboard()
**Dependencies:**
- Requires `this.tasks`, `this.copiedSubtree`, `this.taskIdCounter`
- Calls `this.saveSnapshot()` (undo-redo.js)
- Calls `this.saveToStorage()` (persistence.js)
- Calls `this.showToast()` (UI layer)
- Calls `this.render()`, `this.updateStatusBar()` (UI layer)

---

## Complete Load Sequence (Phases 1-2)

```html
<!-- Utils Layer -->
<script src="src/js/utils/platform.js"></script>      <!-- @order: 5 -->
<script src="src/js/utils/svg.js"></script>           <!-- @order: 6 -->
<!-- <script src="src/js/utils/geometry.js"></script> -->   <!-- @order: 7 - TODO -->
<script src="src/js/utils/cycle-detection.js"></script>   <!-- @order: 8 -->

<!-- Data Layer -->
<script src="src/js/data/undo-redo.js"></script>      <!-- @order: 10 -->
<script src="src/js/data/persistence.js"></script>    <!-- @order: 11 -->
<script src="src/js/data/import-export.js"></script>  <!-- @order: 12 -->
<script src="src/js/data/clipboard.js"></script>      <!-- @order: 13 -->
```

## Dependency Graph

```
platform.js (5) ───┐
svg.js (6) ────────┼─→ (No dependencies)
geometry.js (7) ───┤
cycle-detection.js (8) ───┘

undo-redo.js (10) ──────┐
                        ├─→ Needs: tasks, render(), showToast()
persistence.js (11) ────┤
                        │
import-export.js (12) ──┼─→ Needs: saveSnapshot(), loadFromStorage()
                        │
clipboard.js (13) ──────┘   Needs: saveSnapshot(), saveToStorage()
```

## Future Phases (TODO)

### Phase 3: Core Logic (@order: 15-19)
- task-management.js - Create, edit, delete tasks
- status-management.js - Cycle status, toggle working
- relationship-management.js - Reparenting, dependencies

### Phase 4: UI Layer (@order: 20-24)
- event-handlers.js - Mouse and keyboard events
- rendering.js - SVG rendering engine
- modals.js - Modal system
- menus.js - Context menus

### Phase 5: Features (@order: 25+)
- navigation.js - Zoom, pan, jump
- homes.js - Bookmark system
- settings.js - Configuration UI
- status-bar.js - Status bar updates

## Testing Load Order

To verify modules load correctly:

1. Open browser console
2. Check for load messages:
   ```
   [platform.js] Platform detection and keyboard utilities loaded
   [svg.js] SVG coordinate utilities loaded
   [cycle-detection.js] Dependency cycle detection loaded
   [undo-redo.js] Undo/redo system loaded
   [persistence.js] localStorage persistence layer loaded
   [import-export.js] JSON import/export functionality loaded
   [clipboard.js] Copy/paste subtree operations loaded
   ```

3. Verify app object has methods:
   ```javascript
   console.log(typeof app.getModifierKey);    // "function"
   console.log(typeof app.getSVGPoint);       // "function"
   console.log(typeof app.wouldCreateCycle);  // "function"
   console.log(typeof app.saveSnapshot);      // "function"
   console.log(typeof app.saveToStorage);     // "function"
   console.log(typeof app.exportData);        // "function"
   console.log(typeof app.copySubtree);       // "function"
   ```

## Common Issues

### Issue: "app is not defined"
**Cause:** Core app object not initialized before loading modules
**Fix:** Ensure app object exists before loading any module:
```javascript
const app = {
    tasks: [],
    undoStack: [],
    redoStack: [],
    // ... other state
};
```

### Issue: "this.render is not a function"
**Cause:** Module loaded before UI layer is ready
**Fix:** Respect @order sequence. Don't call functions that depend on later phases.

### Issue: Module loads but doesn't work
**Cause:** Missing state properties on app object
**Fix:** Ensure app object has all required state before init:
- tasks, taskIdCounter
- undoStack, redoStack
- copiedSubtree
- viewBox, zoomLevel
- etc.

## Migration Strategy

To integrate these modules into task-tree.html:

1. **Create app object with initial state** (around line 1364)
2. **Load all modules in order** (via script tags)
3. **Remove extracted functions from task-tree.html** (keep only app initialization)
4. **Test each phase independently** before moving to next phase

## Verification Checklist

After loading modules, verify:

- [ ] No console errors
- [ ] All 7 load messages appear
- [ ] app.getModifierKey() returns correct symbol
- [ ] app.saveSnapshot() creates undo entry
- [ ] app.undo() / app.redo() work
- [ ] app.exportData() downloads JSON
- [ ] app.copySubtree() / app.pasteSubtree() work
