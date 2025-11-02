# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## ⚠️ CRITICAL WORKFLOW - READ FIRST

**ALWAYS follow this sequence:**

1. **📖 READ README.md FIRST** - Get complete context of current state, features, architecture
2. **🔨 DO the requested work** - Implement features, fix bugs, make improvements
3. **📝 UPDATE README.md LAST** - Document ALL changes in appropriate sections
4. **🏗️ BUILD** - Always run `node build.js` after editing source files

**If you skip step 3, you WILL lose project continuity on the next session.**

---

## 🎯 FEATURE DEVELOPMENT PROCESS

**EVERY time you implement a new feature, follow this rigorous process:**

### Step 1: 🧠 Think & Plan

**Understand the problem deeply before writing code:**

1. **What is the user trying to accomplish?**
2. **What are the edge cases?** (empty state, errors, conflicts)
3. **How does this fit with existing features?**
4. **What are the UX implications?** (feedback, animations, keyboard shortcuts)

**Document your thinking** - write it out before coding!

### Step 2: 📝 Identify All Files & Functions

**List EVERYTHING you'll need to touch:**

1. **Files to modify:**
   - `src/js/interactions/mouse.js` - Mouse event handling
   - `src/js/rendering/render.js` - Visual preview
   - etc.

2. **Functions to add or modify:**
   - `onCanvasMouseMove()` - Add preview rendering logic
   - `onCanvasMouseUp()` - Create task on empty space
   - `render()` - Draw preview node and arrow
   - etc.

**Use the function extraction tool** to explore existing code:

```bash
# List all functions in a specific file
node scripts/list-functions.cjs mouse

# List all functions in a directory
node scripts/list-functions.cjs core

# List all functions everywhere
node scripts/list-functions.cjs
```

**Check for existing utilities** - Review defensive programming section above!

### Step 3: 🧪 Plan Tests

**Before implementing, define how you'll test:**

**Unit/Integration Tests (JavaScript):**
- What specific scenarios must work?
- What should throw errors?
- What edge cases need coverage?

**Playwright Tests (E2E):**
- What user flows must be tested?
- What visual states need verification?
- What should the user experience feel like?

**Example:**
```
JavaScript tests:
- Ctrl+drag from node to empty space creates child
- Ctrl+drag sets correct parent relationship
- New node appears at cursor position

Playwright tests:
- Preview arrow appears during drag
- Preview node ghost appears at cursor
- Node created on mouseup
- Keyboard shortcut updated in modal
```

### Step 4: ⚙️ Clean Implementation

**Write the code using defensive programming:**

1. **Use existing utilities:**
   - Constants from `src/js/utils/constants.js`
   - Helpers from `src/js/utils/task-helpers.js`
   - Animation from `src/js/utils/viewport-animation.js`

2. **Follow existing patterns:**
   - Check how similar features work (e.g., how does Alt+drag work for dependencies?)
   - Match naming conventions
   - Use consistent error handling

3. **Add proper JSDoc:**
   ```javascript
   /**
    * Create new task when ctrl+dragging to empty space
    * @param {MouseEvent} e - Mouse event
    * @param {number} parentId - ID of parent task
    */
   ```

4. **Update shortcuts modal:**
   - Location: `src/js/ui/shortcuts.js`
   - Add new shortcut to appropriate category
   - Add pro tip if helpful

5. **Integrate undo/redo:**
   - Call `this.saveSnapshot("Action description")` BEFORE modifying
   - Never snapshot viewport navigation

### Step 5: ✅ Verify & Document

**Before marking complete:**

- [ ] All tests pass (run `npm run test:browser`)
- [ ] Build succeeds (run `node build.js`)
- [ ] Feature works in browser
- [ ] Shortcuts modal updated (if keyboard shortcut added)
- [ ] README.md updated with new feature
- [ ] No console errors or warnings

### Step 6: 📸 UX/UI Screenshot Verification (for visual features)

**If your feature includes new UI, interactions, or visual previews:**

Create a Playwright test to capture screenshots of the feature:

```javascript
// Example: tests/browser/ctrl-drag-preview.test.js
test('Ctrl+drag preview visual verification', async ({ page }) => {
    await page.goto('file://' + path.resolve('dist/task-tree.html'));

    // Setup: Create task
    await page.evaluate(() => app.addRootTaskAtPosition(200, 300));

    // Trigger preview state
    const task = await page.locator('.task-node').first();
    await task.dispatchEvent('mousedown', { button: 0, ctrlKey: true });
    await page.mouse.move(600, 400); // Move to empty space

    // Capture screenshot
    await page.screenshot({
        path: 'tests/screenshots/ctrl-drag-preview.png',
        fullPage: true
    });
});
```

**Provide file:// links to screenshots for user review:**
- `file:///path/to/tests/screenshots/ctrl-drag-preview.png`
- User can verify visual correctness (arrow endpoints, colors, positioning)

**Why this matters:**
- Visual bugs (like arrows pointing to wrong positions) are easy to miss
- Screenshots provide proof that UX/UI works as intended
- User can quickly spot issues that automated assertions can't catch

**This process ensures quality and maintainability!**

---

## 🛡️ DEFENSIVE PROGRAMMING - ALWAYS USE UTILITIES

**CRITICAL**: Before writing ANY code, check if a utility already exists for the task.

### Available Utility Modules

#### 1. Constants (`src/js/utils/constants.js` @order 8)

**Use these instead of magic numbers:**

```javascript
// DON'T: Hard-code thresholds
if (distance >= 5) { ... }

// DO: Use named constant
if (distance >= this.INTERACTION.DRAG_THRESHOLD_PX) { ... }
```

**Available Constants:**
- `app.INTERACTION.DRAG_THRESHOLD_PX` - Drag vs click threshold (5px)
- `app.INTERACTION.CLICK_DELAY_MS` - Click menu delay (200ms)
- `app.INTERACTION.DOUBLE_CLICK_MAX_MS` - Double-click window (300ms)
- `app.INTERACTION.PASTE_OFFSET_X/Y` - Paste offset (100px)
- `app.ANIMATION.ZOOM_OUT_MS` - Zoom out duration (300ms)
- `app.ANIMATION.PAN_MS` - Pan duration (500ms)
- `app.ANIMATION.ZOOM_IN_MS` - Zoom in duration (500ms)
- `app.ANIMATION.EASING` - Easing function (ease-in-out quadratic)
- `app.UI.TITLE_MAX_LENGTH` - Title truncation length (30 chars)
- `app.UI.TOAST_DURATION.{SUCCESS|INFO|WARNING|ERROR}` - Toast durations
- `app.CANVAS.*` - Canvas dimensions, zoom limits
- `app.STORAGE.*` - localStorage keys, undo limits

#### 2. Task Helpers (`src/js/utils/task-helpers.js` @order 9)

**Use these to eliminate duplicate validation/display code:**

```javascript
// DON'T: Inline validation
if (!isFinite(task.x) || !isFinite(task.y)) {
    console.error(`Task ${task.id} has invalid coords...`);
    return;
}

// DO: Use helper
if (!this.validateTaskCoordinates(task)) return;
```

**Available Helpers:**
- `this.validateTaskCoordinates(task)` - Check for NaN/Infinity coords
- `this.truncateTitle(title, maxLength)` - Truncate with ellipsis
- `this.findTaskById(tasks, id)` - Null-safe find with fallback
- `this.getTaskDisplayTitle(task, maxLength)` - Safe title with 'Untitled' fallback
- `this.getAncestors(tasks, task)` - Get all parent chain up to root
- `this.getDescendants(tasks, task, includeHidden)` - Get all children recursively
- `this.hasIncompleteChildren(tasks, task)` - Check for incomplete children
- `this.countChildrenByStatus(tasks, task)` - Count children by status
- `this.formatTaskPath(tasks, task, separator, maxLen)` - Format "Root > Parent > Task"

#### 3. Viewport Animation (`src/js/utils/viewport-animation.js` @order 39)

**Use these for smooth navigation:**

```javascript
// DON'T: Duplicate animation code
// 60+ lines of requestAnimationFrame logic...

// DO: Use utility
this.animateViewportTo(targetX, targetY, targetZoom, {
    overviewZoom: 0.3,
    onComplete: () => {
        this.updateZoomDisplay();
        this.saveToStorage();
        this.showToast('Jumped!', 'success');
    }
});
```

**Available Functions:**
- `this.animateViewportTo(x, y, zoom, options)` - Smooth 3-phase animation (zoom out → pan → zoom in)
- `this.jumpToPosition(x, y, zoom)` - Instant jump without animation
- `this._animatePhase(startTime, duration, onProgress, onComplete)` - Internal helper

### Code Duplication Checklist

**Before writing any code, ask yourself:**

1. **Am I validating coordinates?** → Use `validateTaskCoordinates()`
2. **Am I truncating text?** → Use `truncateTitle()`
3. **Am I finding a task by ID?** → Use `findTaskById()`
4. **Am I checking a threshold (5px, 200ms, etc)?** → Use constant from `app.INTERACTION`
5. **Am I animating the viewport?** → Use `animateViewportTo()`
6. **Am I showing a toast message?** → Use duration from `app.UI.TOAST_DURATION`

**If you find yourself copying code from elsewhere in the project:**
- ⛔ **STOP** - Don't paste it!
- 📝 Create a utility function instead
- 🔄 Replace all instances with the new utility
- 📚 Document it in this file

---

## 📁 PROJECT STRUCTURE

This project uses a **modular architecture** with an **auto-discovery build system**.

### Build System

**Edit files in `src/`, NOT `dist/`!**

```bash
node build.js   # Auto-discovers all files, sorts by @order, builds dist/task-tree.html
```

**How it works:**
1. Scans `src/styles/` and `src/js/` recursively
2. Sorts by `@order` header (lower = loads first)
3. **Transforms ES6 modules**: `export const Mixin = {...}` → `Object.assign(app, {...})`
4. **Validates syntax** before building (catches errors early!)
5. Injects into `src/index.html` at markers
6. Outputs `dist/task-tree.html` (single file)

### Directory Structure

```
src/
├── index.html              # HTML template with <!-- CSS_INJECT --> and <!-- JS_INJECT --> markers
├── styles/                 # CSS modules (@order 10-70)
│   ├── base.css            # Global resets (@order 10)
│   ├── controls.css        # Buttons (@order 20)
│   ├── task-nodes.css      # Task styling (@order 30)
│   ├── links.css           # Arrows (@order 40)
│   ├── modals.css          # Dialogs (@order 50)
│   ├── status-bar.css      # Bottom bar (@order 60)
│   └── dark-mode.css       # Dark theme (@order 70)
│
└── js/                     # JavaScript modules
    ├── state.js            # App state (@order 1)
    ├── config.js           # Configuration (@order 2)
    │
    ├── utils/              # Utilities (@order 5-14)
    │   ├── platform.js     # Platform detection (@order 5)
    │   ├── svg.js          # SVG coordinates (@order 6)
    │   ├── url-helpers.js  # URL extraction (@order 7)
    │   ├── constants.js    # ✨ Constants (@order 8) - USE THESE!
    │   ├── task-helpers.js # ✨ Task utilities (@order 9) - USE THESE!
    │   ├── viewport-animation.js # ✨ Animation (@order 39) - USE THIS!
    │   └── cycle-detection.js # Cycle checking (@order 14)
    │
    ├── data/               # Data layer (@order 10-13)
    │   ├── undo-redo.js    # Undo/redo system
    │   ├── persistence.js  # localStorage
    │   ├── import-export.js # JSON import/export
    │   └── clipboard.js    # Copy/paste
    │
    ├── core/               # Domain logic (@order 15-17)
    │   ├── tasks.js        # Task CRUD
    │   ├── status.js       # Status/priority
    │   └── relationships.js # Dependencies, reparenting
    │
    ├── rendering/          # Rendering (@order 20-24)
    │   ├── golden-path.js  # Working task visualization
    │   ├── indicators.js   # Off-screen arrows
    │   ├── nodes.js        # Node dimensions
    │   ├── links.js        # SVG line utilities
    │   └── render.js       # Main render loop
    │
    ├── interactions/       # User input (@order 25-28)
    │   ├── mouse.js        # Mouse events
    │   ├── keyboard.js     # Keyboard shortcuts
    │   ├── drag.js         # Drag modes
    │   └── edit.js         # Inline editing
    │
    ├── ui/                 # UI components (@order 30-36)
    │   ├── modals.js       # Dialogs
    │   ├── context-menu.js # Right-click menus
    │   ├── status-bar.js   # Bottom bar
    │   ├── settings.js     # Settings modal
    │   ├── shortcuts.js    # Shortcuts modal
    │   ├── test-checklist.js # Test data
    │   └── toast.js        # Notifications
    │
    ├── navigation/         # Navigation (@order 40-43)
    │   ├── viewport.js     # Pan/zoom/fit
    │   ├── homes.js        # Bookmarks
    │   ├── jump.js         # Jump to working task
    │   └── text-lock.js    # Text expansion
    │
    └── app.js              # Initialization (@order 100)
```

### Adding New Files

**NO build.js edits needed!**

1. Create file in appropriate directory
2. Add `@order` header:
   ```javascript
   /**
    * @module category/name
    * @order 15
    * @category Core
    * @description What this does
    */
   ```
3. Run `node build.js` → auto-discovered!

---

## 💾 Git Commit Workflow

**After user confirms changes are working:**

1. **Build first**: `node build.js`
2. **Test**: Verify all tests pass
3. **Stage**: `git add .`
4. **Commit**:
   ```bash
   git commit -m "$(cat <<'EOF'
   type: brief description

   - Detail 1
   - Detail 2

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>
   EOF
   )"
   ```
5. **Push**: `git push origin main` (triggers deployment)

**When to commit:**
- ✅ User confirms: "looks good", "stable", "commit this"
- ✅ Feature fully implemented and tested
- ❌ NEVER without user confirmation
- ❌ NEVER if tests failing

---

## ⚠️ SHORTCUTS MODAL REQUIREMENT

**WHENEVER you add/modify/remove a keyboard shortcut, update the shortcuts modal!**

**Location**: `src/js/ui/shortcuts.js` - `showShortcutsModal()` function

**Categories:**
- ✏️ Editing, 🎯 Selection, 📊 Status & Priority, 🔗 Relationships
- 🚀 Navigation, 🔗 Links, ⏮️ Undo/Redo

**Example:**
```javascript
{
    category: '🎯 Selection',
    items: [
        { keys: 'Click node', description: 'Select task' },
        { keys: 'Your new shortcut', description: 'What it does' }  // ← ADD HERE
    ],
    tip: '💡 <strong>Pro Tip:</strong> Helpful workflow!'  // ← OPTIONAL
}
```

---

## 🚀 Navigation Philosophy

**When implementing navigation features:**

1. **Keyboard-first** - Every action needs a shortcut
2. **Context-aware** - Track user intent, default to likely destination
3. **Layered patterns** - Key opens menu → Key again executes default → Numbers select specific
4. **Visual feedback** - Number badges, keyboard hints, toast confirmations
5. **Progressive disclosure** - Single option? Skip menu. Multiple? Show menu.

**Fast navigation is essential for productivity!**

---

## 📚 Key Implementation Details

### Undo/Redo Integration

**When adding ANY operation that modifies task data:**

```javascript
// 1. Call BEFORE modifying
this.saveSnapshot("Description of action");

// 2. Then modify
this.tasks.push(newTask);

// 3. Save to storage
this.saveToStorage();
```

**Don't snapshot viewport navigation** (pan, zoom) - it clears redo stack!

### Task Data Model

```javascript
{
    id: number,
    title: string,
    x, y: number,           // Canvas position
    mainParent: number|null,
    otherParents: [ids],
    children: [ids],
    dependencies: [ids],
    status: 'pending'|'done',
    currentlyWorking: boolean,
    hidden: boolean,
    priority: 'low'|'normal'|'high'|'urgent',
    links: [{url, title}],
    // ... more in src/js/state.js
}
```

### Mouse Interaction Modes

- **No modifier**: Drag node / Click for menu
- **Shift**: Drag subtree (preserves positions)
- **Ctrl/Cmd**: Reparent task
- **Alt**: Create/remove dependencies
- **Middle-click**: Cycle status
- **Double-click**: Edit inline

### Finding Code

Use **MODULE-MAP.md** for quick lookup:
- Task CRUD → `core/tasks.js`
- Keyboard shortcuts → `interactions/keyboard.js`
- Rendering → `rendering/render.js`
- Settings → `ui/settings.js`

---

## 📖 Full Documentation

- **README.md** - Complete features, testing, architecture
- **MODULE-MAP.md** - Function-to-file mapping with line numbers
- **docs/REFACTORING-PLAN-2025.md** - Code quality improvements
- **src/js/LOAD_ORDER.md** - Module dependencies and load order
