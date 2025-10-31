# Task Tree - Refactoring Proposal

## Current State
- **Single file**: `task-tree.html` (7,817 lines, 348 KB)
- **Structure**: CSS (1,145 lines) + HTML (212 lines) + JavaScript (6,452 lines)
- **Benefits**: No build process, easy to share, runs anywhere
- **Problems**: Hard to navigate, poor context loading for LLMs, difficult to maintain

---

## Proposed Modular Structure

### Option A: Hybrid Approach (RECOMMENDED)
Keep single-file distribution but develop with modules. Best of both worlds.

```
graphdo/
├── src/
│   ├── index.html              # Main HTML structure (minimal)
│   ├── styles/
│   │   ├── base.css            # Resets, body, global (~50 lines)
│   │   ├── controls.css        # Top bar, buttons (~200 lines)
│   │   ├── task-nodes.css      # Node styling, status colors (~300 lines)
│   │   ├── links.css           # SVG lines, arrows, animations (~200 lines)
│   │   ├── modals.css          # All modal dialogs (~300 lines)
│   │   └── dark-mode.css       # Dark theme overrides (~100 lines)
│   │
│   ├── js/
│   │   ├── app.js              # Main app object, initialization (~200 lines)
│   │   ├── state.js            # App state definition (~100 lines)
│   │   ├── config.js           # Default configuration (~50 lines)
│   │   │
│   │   ├── core/
│   │   │   ├── tasks.js        # Task CRUD operations (~400 lines)
│   │   │   ├── relationships.js # Dependencies, reparenting (~300 lines)
│   │   │   ├── selection.js    # Multi-select, box select (~200 lines)
│   │   │   └── status.js       # Status cycling, working task logic (~250 lines)
│   │   │
│   │   ├── interactions/
│   │   │   ├── mouse.js        # Mouse event handlers (~600 lines)
│   │   │   ├── keyboard.js     # Keyboard shortcuts (~400 lines)
│   │   │   ├── drag.js         # Drag modes, drag logic (~500 lines)
│   │   │   └── edit.js         # Inline text editing (~200 lines)
│   │   │
│   │   ├── rendering/
│   │   │   ├── render.js       # Main render loop (~400 lines)
│   │   │   ├── nodes.js        # SVG node generation (~300 lines)
│   │   │   ├── links.js        # SVG link generation (~300 lines)
│   │   │   ├── indicators.js   # Offscreen indicators (~200 lines)
│   │   │   └── golden-path.js  # Working task path visualization (~150 lines)
│   │   │
│   │   ├── navigation/
│   │   │   ├── viewport.js     # Pan, zoom, fit-to-screen (~300 lines)
│   │   │   ├── homes.js        # Bookmarks/homes system (~400 lines)
│   │   │   └── jump.js         # Jump to working task (~200 lines)
│   │   │
│   │   ├── ui/
│   │   │   ├── modals.js       # Modal system (confirm, alert, prompt) (~300 lines)
│   │   │   ├── context-menu.js # Right-click context menu (~500 lines)
│   │   │   ├── status-bar.js   # Bottom status bar (~200 lines)
│   │   │   ├── settings.js     # Settings modal (~400 lines)
│   │   │   └── shortcuts.js    # Shortcuts modal (~200 lines)
│   │   │
│   │   ├── data/
│   │   │   ├── persistence.js  # localStorage save/load (~200 lines)
│   │   │   ├── import-export.js # JSON import/export (~300 lines)
│   │   │   ├── clipboard.js    # Copy/paste subtrees (~200 lines)
│   │   │   └── undo-redo.js    # Undo/redo system (~350 lines)
│   │   │
│   │   └── utils/
│   │       ├── svg.js          # SVG utilities, coordinate conversion (~150 lines)
│   │       ├── geometry.js     # Distance, collision detection (~100 lines)
│   │       ├── cycle-detection.js # Circular dependency checks (~100 lines)
│   │       └── platform.js     # OS detection, keyboard symbols (~50 lines)
│   │
│   └── test-data/
│       └── checklist.json      # Test checklist data
│
├── dist/
│   └── task-tree.html          # Built single-file version (for distribution)
│
├── build.js                    # Script to combine src/ → dist/task-tree.html
├── REFACTORING-GUIDE.md        # This file - explains structure for LLMs
└── MODULE-MAP.md               # Quick reference: "Need X? Edit Y file"
```

**File Count**: ~35 files (vs 1 giant file)
**Avg File Size**: ~220 lines (vs 7,817 lines)

---

## Benefits for LLMs

### 1. **Targeted Context Loading**
Instead of loading 7,817 lines for every edit:
```
User: "Fix the zoom-to-fit calculation"
LLM: *reads viewport.js (300 lines) + geometry.js (100 lines)*
      ✅ 400 lines in context vs ❌ 7,817 lines
```

### 2. **Clear File Naming = Clear Purpose**
```
interactions/mouse.js       → Mouse event handling
rendering/golden-path.js    → Working task visualization
data/undo-redo.js           → History management
ui/shortcuts.js             → Keyboard shortcuts modal
```

### 3. **Dependency Tracing**
```javascript
// In rendering/render.js
import { getWorkingTaskPath } from './golden-path.js';
import { createNode } from './nodes.js';
import { createLink } from './links.js';
```
LLM can trace imports to understand dependencies.

### 4. **Parallel Edits**
Multiple LLM agents can work on different files simultaneously:
- Agent 1: Fix bug in `interactions/drag.js`
- Agent 2: Add feature to `ui/context-menu.js`
- Agent 3: Update styles in `styles/task-nodes.css`

### 5. **Reduced Cognitive Load**
```
Before: "Where in 7,817 lines is the undo system?"
After:  "Check data/undo-redo.js"
```

---

## MODULE-MAP.md (Quick Reference for LLMs)

```markdown
# Module Map - Where to Find What

## Need to edit...

### Task Operations
- **Create/delete tasks** → `js/core/tasks.js`
- **Status (pending/working/done)** → `js/core/status.js`
- **Parent-child relationships** → `js/core/relationships.js`
- **Dependencies** → `js/core/relationships.js`
- **Multi-select** → `js/core/selection.js`

### User Interactions
- **Mouse clicks/drags** → `js/interactions/mouse.js`
- **Keyboard shortcuts** → `js/interactions/keyboard.js`
- **Drag modes (shift/ctrl/alt)** → `js/interactions/drag.js`
- **Inline text editing** → `js/interactions/edit.js`

### Visual Rendering
- **Main render loop** → `js/rendering/render.js`
- **Task node appearance** → `js/rendering/nodes.js` + `styles/task-nodes.css`
- **Link lines/arrows** → `js/rendering/links.js` + `styles/links.css`
- **Golden path (working task)** → `js/rendering/golden-path.js`
- **Offscreen indicators** → `js/rendering/indicators.js`

### Navigation
- **Pan/zoom/fit** → `js/navigation/viewport.js`
- **Bookmarks (homes)** → `js/navigation/homes.js`
- **Jump to working task** → `js/navigation/jump.js`

### UI Components
- **Context menu (right-click)** → `js/ui/context-menu.js`
- **Settings modal** → `js/ui/settings.js`
- **Shortcuts modal** → `js/ui/shortcuts.js`
- **Status bar** → `js/ui/status-bar.js`
- **Modal dialogs** → `js/ui/modals.js`

### Data Management
- **Save/load (localStorage)** → `js/data/persistence.js`
- **Import/export JSON** → `js/data/import-export.js`
- **Copy/paste** → `js/data/clipboard.js`
- **Undo/redo** → `js/data/undo-redo.js`

### Styling
- **Task colors/borders** → `styles/task-nodes.css`
- **Link styling** → `styles/links.css`
- **Dark mode** → `styles/dark-mode.css`
- **Modal styling** → `styles/modals.css`
- **Top controls bar** → `styles/controls.css`

## Cross-Cutting Concerns

| Concern | Files Involved |
|---------|----------------|
| **Working Task Logic** | `core/status.js`, `rendering/golden-path.js`, `ui/status-bar.js`, `navigation/jump.js` |
| **Undo/Redo Integration** | `data/undo-redo.js` + ALL files that modify tasks must call `saveSnapshot()` |
| **Keyboard Shortcuts** | `interactions/keyboard.js` (handlers) + `ui/shortcuts.js` (modal) |
| **Dark Mode** | `styles/dark-mode.css` (styles) + `app.js` (toggle logic) |
| **Circular Dependencies** | `utils/cycle-detection.js` + `core/relationships.js` |

## Architecture Patterns

### State Management
- **Single source of truth**: `app` object in `app.js`
- **State definition**: `state.js`
- **State mutations**: Always call `saveToStorage()` + `render()` after changes

### Event Flow
```
User Action → Event Handler (interactions/) → State Update (core/) → Render (rendering/)
```

### Rendering Pipeline
```
render() → getWorkingTaskPath() → renderNodes() → renderLinks() → renderIndicators()
```

### Undo/Redo Integration
```
User Action → saveSnapshot() → Modify app.tasks → saveToStorage() → render()
```
```

---

## Build System

### Simple Build Script (build.js)
```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function buildSingleFile() {
    const template = fs.readFileSync('src/index.html', 'utf8');

    // Collect all CSS
    const cssFiles = [
        'styles/base.css',
        'styles/controls.css',
        'styles/task-nodes.css',
        'styles/links.css',
        'styles/modals.css',
        'styles/dark-mode.css'
    ];
    const css = cssFiles.map(f => fs.readFileSync(`src/${f}`, 'utf8')).join('\n\n');

    // Collect all JS (in dependency order)
    const jsFiles = [
        'js/config.js',
        'js/state.js',
        'js/utils/platform.js',
        'js/utils/svg.js',
        'js/utils/geometry.js',
        'js/utils/cycle-detection.js',
        'js/data/persistence.js',
        'js/data/undo-redo.js',
        'js/data/import-export.js',
        'js/data/clipboard.js',
        'js/core/tasks.js',
        'js/core/status.js',
        'js/core/relationships.js',
        'js/core/selection.js',
        'js/rendering/nodes.js',
        'js/rendering/links.js',
        'js/rendering/golden-path.js',
        'js/rendering/indicators.js',
        'js/rendering/render.js',
        'js/interactions/mouse.js',
        'js/interactions/keyboard.js',
        'js/interactions/drag.js',
        'js/interactions/edit.js',
        'js/navigation/viewport.js',
        'js/navigation/homes.js',
        'js/navigation/jump.js',
        'js/ui/modals.js',
        'js/ui/context-menu.js',
        'js/ui/status-bar.js',
        'js/ui/settings.js',
        'js/ui/shortcuts.js',
        'js/app.js'
    ];
    const js = jsFiles.map(f => fs.readFileSync(`src/${f}`, 'utf8')).join('\n\n');

    // Inject into template
    let output = template
        .replace('<!-- CSS_INJECT -->', `<style>\n${css}\n</style>`)
        .replace('<!-- JS_INJECT -->', `<script>\n${js}\n</script>`);

    // Write output
    fs.mkdirSync('dist', { recursive: true });
    fs.writeFileSync('dist/task-tree.html', output);

    console.log('✅ Built dist/task-tree.html');
}

buildSingleFile();
```

**Usage**:
```bash
node build.js                    # Build single file
npm install -g live-server       # Optional: dev server
live-server src/                 # Dev mode with auto-reload
```

---

## Migration Strategy

### Phase 1: Setup Structure (Day 1)
1. Create `src/` directory structure
2. Create empty module files
3. Set up build script
4. Test that build produces working output

### Phase 2: Extract CSS (Day 1-2)
1. Split `<style>` section into 6 CSS files
2. Verify no regressions in styling
3. Build and test

### Phase 3: Extract Core Logic (Day 2-4)
1. **Start with utils** (no dependencies)
   - `utils/platform.js`
   - `utils/svg.js`
   - `utils/geometry.js`
   - `utils/cycle-detection.js`

2. **Then data layer** (depends on utils)
   - `data/persistence.js`
   - `data/undo-redo.js`
   - `data/import-export.js`
   - `data/clipboard.js`

3. **Then core domain** (depends on data + utils)
   - `core/tasks.js`
   - `core/status.js`
   - `core/relationships.js`
   - `core/selection.js`

### Phase 4: Extract Rendering (Day 4-5)
- `rendering/nodes.js`
- `rendering/links.js`
- `rendering/golden-path.js`
- `rendering/indicators.js`
- `rendering/render.js`

### Phase 5: Extract Interactions (Day 5-6)
- `interactions/mouse.js`
- `interactions/keyboard.js`
- `interactions/drag.js`
- `interactions/edit.js`

### Phase 6: Extract UI (Day 6-7)
- `ui/modals.js`
- `ui/context-menu.js`
- `ui/status-bar.js`
- `ui/settings.js`
- `ui/shortcuts.js`

### Phase 7: Extract Navigation (Day 7)
- `navigation/viewport.js`
- `navigation/homes.js`
- `navigation/jump.js`

### Phase 8: Final App Shell (Day 7)
- `state.js`
- `config.js`
- `app.js`

### Phase 9: Documentation (Day 8)
- Write `MODULE-MAP.md`
- Write `CONTRIBUTING.md`
- Update `CLAUDE.md` with new structure
- Update `README.md`

---

## Alternative: Option B - Single File with Better Comments

If you want to keep single-file but make it LLM-friendly:

```html
<!-- ============================================================
     SECTION 1: CSS STYLES (Lines 7-1151)
     ============================================================

     SUBSECTIONS:
     - Base styles (7-50)
     - Controls bar (51-150)
     - Dropdowns (151-300)
     - Task nodes (301-600)
     - Links (601-800)
     - Modals (801-1000)
     - Dark mode (1001-1151)

     TO EDIT STYLING:
     - Task appearance: Lines 301-600
     - Link colors: Lines 601-800
     - Modal styling: Lines 801-1000
============================================================ -->
<style>
/* BASE STYLES */
* { margin: 0; padding: 0; box-sizing: border-box; }

/* CONTROLS BAR */
#controls { ... }

/* ... */
</style>

<!-- ============================================================
     SECTION 2: HTML STRUCTURE (Lines 1152-1363)
     ============================================================

     COMPONENTS:
     - Controls bar (1155-1174)
     - SVG canvas (1176-1218)
     - Modals (1220-1348)
     - Status bar (1350-1362)

     TO ADD UI ELEMENT: Add markup here, style in CSS, behavior in JS
============================================================ -->
<body>
<!-- CONTROLS BAR -->
<div id="controls">...</div>

<!-- SVG CANVAS -->
<div id="canvas-container">...</div>

<!-- MODALS -->
<div id="import-modal">...</div>
</body>

<!-- ============================================================
     SECTION 3: JAVASCRIPT (Lines 1364-7815)
     ============================================================

     MAJOR SUBSECTIONS:
     1. App State (1365-1433) - Global state object
     2. Core Logic (1434-3000)
        - Initialization (1434-1518)
        - Task CRUD (1878-2400)
        - Status management (1981-2294)
     3. Interactions (3000-5000)
        - Mouse handlers (3995-4597)
        - Keyboard shortcuts (5297-5497)
     4. Rendering (5497-6500)
        - Main render (5497-6131)
        - SVG generation (6131-6487)
     5. Data (6500-7000)
        - Undo/redo (6500-6740)
        - Persistence (6762-6960)
     6. UI (7000-7815)
        - Navigation (7082-7555)
        - Homes (7555-7810)

     MODULE MAP:
     - Fix task creation → Line 1878
     - Fix undo/redo → Line 6500
     - Fix keyboard shortcuts → Line 5297
     - Fix rendering → Line 5497
     - Fix zoom → Line 2566
============================================================ -->
<script>
// ============================================================
// APP STATE OBJECT
// Contains all application state and methods
// ============================================================
const app = {
    // State properties
    tasks: [],
    // ... methods below

    // ========================================================
    // INITIALIZATION & SETUP (Lines 1434-1518)
    // ========================================================
    init() { ... },

    // ========================================================
    // TASK CRUD OPERATIONS (Lines 1878-2400)
    // ========================================================
    addChildTask(parentId) { ... },
    deleteTask(taskId) { ... },

    // ========================================================
    // MOUSE INTERACTIONS (Lines 3995-4597)
    // ========================================================
    onCanvasMouseDown(e) { ... },

    // ... etc
};
</script>
```

---

## Recommendation

**For Active Development**: Use **Option A (Modular)** - much easier to maintain and LLMs can work 10x faster

**For Distribution**: Build to single file - users still get no-build simplicity

**For Quick Fixes**: Use **Option B (Better Comments)** as intermediate step

---

## Next Steps

1. ✅ **Get user approval** on approach
2. Create `MODULE-MAP.md` in current project (works for both single-file and modular)
3. Add section headers to current `task-tree.html` (immediate improvement)
4. Create migration plan if going modular
5. Set up build tooling
6. Migrate incrementally (can keep old version working during migration)

---

## Questions for You

1. **Do you want to go fully modular (Option A)** or keep single-file with better organization (Option B)?
2. **Are you okay with a build step** for development? (Build script is simple, just concatenation)
3. **Is the file size a problem** for users? (348 KB isn't huge, but modular would enable lazy loading in future)
4. **Do you collaborate with others?** (Modular = way easier for multiple people/LLMs to work simultaneously)

Let me know your preference and I can start implementation!
