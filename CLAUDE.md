# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## ⚠️ CRITICAL WORKFLOW RULE - READ THIS FIRST

**ALWAYS follow this sequence when working on this project:**

1. **📖 READ `README.md` FIRST** - Get complete context of current project state, all features, and architecture
2. **🔨 DO the requested work** - Implement features, fix bugs, make improvements
3. **📝 UPDATE `README.md` LAST** - Document ALL changes made in the appropriate sections

**If you skip step 3, you WILL lose project continuity on the next session.**

The README.md contains:
- Complete feature list with implementation details
- Testing guide and checklist
- Full architecture documentation
- Development history
- Future improvements roadmap

Always update the README when you:
- Add/modify/remove any feature
- Fix significant bugs
- Change architecture or patterns
- Learn important implementation lessons

**This is not optional - it's the PRIMARY way to maintain context across sessions.**

---

## 💾 Git Commit Workflow

**After user confirms changes are working and stable:**

1. **Stage all changes**: `git add .`
2. **Commit with descriptive message**: Use conventional commit format
   - Format: `git commit -m "type: brief description"`
   - Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`
   - Example: `git commit -m "feat: add golden path visualization for working task ancestors"`
3. **Include co-author footer**:
   ```bash
   git commit -m "$(cat <<'EOF'
   feat: brief description of changes

   - Detailed point 1
   - Detailed point 2

   🤖 Generated with Claude Code

   Co-Authored-By: Claude <noreply@anthropic.com>
   EOF
   )"
   ```
4. **Push to main**: `git push origin main`
   - **CRITICAL**: Always push after committing - this triggers deployment
   - Pushing to main deploys the changes
   - Verify push succeeds with `git status`

**When to commit**:
- ✅ User explicitly confirms: "looks good", "works perfectly", "stable", "commit this"
- ✅ Feature is fully implemented and tested
- ❌ NEVER commit without user confirmation
- ❌ NEVER commit if tests are failing or errors exist

**Important**: Always wait for user's explicit confirmation before staging and committing. This ensures only stable, verified changes enter the git history.

**Deployment**: Pushing to main automatically deploys the application. Always push after committing to ensure changes go live.

---

## Project Overview

**Task Tree** is a single-file web application for hierarchical task management with dependency tracking. It visualizes todos as an interactive graph where tasks have parent-child relationships, dependencies, and work-in-progress states.

**Core Philosophy**: Tasks exist within context - they have parents (larger goals), children (subtasks), and dependencies (prerequisites). The visual graph makes these relationships explicit.

**File**: `task-tree.html` - Single HTML file containing CSS, HTML structure, and JavaScript (~1750 lines)

## Running the Application

1. Open `task-tree.html` directly in a web browser (no build step required)
2. The app uses localStorage for persistence - no backend needed
3. Works offline once loaded

## Development Commands

No build process is required. Simply:
1. Edit `task-tree.html`
2. Refresh browser to see changes
3. Use the built-in "🧪 Test Checklist" button to inject test tasks

## Code Structure

The file is organized as:
- **Lines 1-350**: CSS styling (task nodes, links, modals, status bar)
- **Lines 351-367**: HTML structure (controls panel, SVG canvas, modals)
- **Lines 368-1750**: JavaScript application logic

### Key JavaScript Sections
- **App State** (~line 421): `app` object with tasks array, drag modes, physics settings
- **Event Handlers** (lines 445-535): Mouse/keyboard interactions
- **Task Management** (lines 537-844): Create, edit, delete, cycle status
- **Relationship Management** (lines 1306-1425): Dependencies, reparenting, cycle detection
- **Rendering** (lines 1584-1715): SVG generation, visual states
- **Physics Simulation** (lines 1518-1582): Optional force-directed layout
- **Persistence** (lines 1725-1747): localStorage save/load

## Architecture Principles

### Task Data Model
Each task is an object with:
```javascript
{
    id: number,              // Unique identifier
    title: string,           // Task name
    x, y: number,            // Canvas position
    vx, vy: number,          // Velocity (for physics)
    mainParent: number|null, // Primary parent task ID
    otherParents: [ids],     // Secondary parent relationships
    children: [ids],         // Child task IDs
    dependencies: [ids],     // Tasks this depends on
    status: 'pending'|'done',
    currentlyWorking: boolean,  // Only one task can be "working"
    hidden: boolean          // For collapsed subtrees
}
```

### Mouse Interaction Model
Different modifier keys enable different operations:
- **No modifier**: Drag single node / Click for menu
- **Shift**: Drag entire subtree (preserves relative positions)
- **Ctrl/Cmd**: Reparent task to new parent
- **Alt**: Create/remove dependencies
- **Middle-click**: Cycle status (pending → working → done → pending)
- **Double-click**: Edit task name inline

### Click vs Drag Detection
Uses a 200ms timeout and 5px distance threshold:
1. Store position on mousedown (`dragOriginalPos`)
2. On mouseup, calculate distance moved
3. If <5px: treat as click, show menu after 200ms delay
4. If double-click occurs within 200ms: cancel menu, enter edit mode

### Visual States
- **Pending**: White background, gray border
- **Working**: Yellow background, yellow border (only one task at a time)
- **Done**: Green background, green border
- **Parent of Working**: Orange border with glow (shows goal path)
- **Incomplete Child of Working**: Red border (highlights blockers)

## Important Implementation Constraints

### Sandboxing
The app runs in a sandboxed iframe, which blocks:
- `prompt()`, `confirm()`, `alert()` - Uses custom modal system instead
- File input dialogs - Uses textarea paste for JSON import

### Circular Dependency Prevention
`wouldCreateCycle()` (line 1407) checks if adding A→B would create a cycle by traversing dependencies from B back to A.

### Auto-collapse Behavior
When a task and all its children are marked done, the subtree automatically collapses (`autoCollapseCompleted()`, line 781).

### Dependency Cleanup on Reparent
When reparenting task A to parent B via Alt+drag:
1. Remove B from A's dependencies (redundant - parent relationship implies ordering)
2. Remove A from B's dependencies (circular - parent can't depend on child)

### Single Working Task Rule
Only one task can have `currentlyWorking: true` at a time. When marking a new task as working, all other tasks are set to `false`.

### Flow State Pattern
When a task that is currently being worked on (`currentlyWorking: true`) is marked as done:
1. The task's `currentlyWorking` flag is set to `false`
2. The task's `status` is set to `'done'`
3. **Automatic parent activation**: If the task has a parent (`mainParent !== null`) and the parent is not already done:
   - The parent's `currentlyWorking` is set to `true`
   - A toast notification shows: "⬆️ Now working on parent: [Parent Name]"
4. This maintains productivity flow: complete subtask → immediately continue on parent goal

**Implementation locations**:
- `cycleStatus()` - line ~1197 (middle-click cycling)
- `toggleDone()` - line ~1233 (context menu mark done)

### Golden Path Visualization
Visual hierarchy showing the full context of the currently working task through colored arrows.

**What it shows**:
- **Ancestor path** (golden/amber #f59e0b): Arrows from working task ALL the way to root
- **Direct children**: Red (#f44336) for incomplete, Green (#4caf50) for done

**Implementation**:
1. **Helper function**: `getWorkingTaskPath()` (line ~2871)
   - Returns `{ workingTaskId, ancestorPath: Set, directChildren: Array }`
   - Builds ancestorPath: Set containing working task ID + all ancestor IDs up to root
   - **Critical**: Must include working task itself in the set, not just ancestors
   - Collects directChildren with completion status: `[{id, isDone}, ...]`

2. **Rendering logic**: In `render()` (line ~2974)
   - For each main parent link, check if part of golden path
   - **Ancestor check** (BOTH must be true):
     - `ancestorPath.has(task.id)` - task is on the path
     - `ancestorPath.has(task.mainParent)` - parent is on the path
   - **Child check**:
     - Find child in directChildren array
     - Check if `task.mainParent === workingTaskId`
     - Apply red if `!isDone`, green if `isDone`
   - Apply golden styling + glow filter to ancestor links
   - Apply red/green styling to child links based on completion

3. **SVG markers**: Custom arrowheads (line ~772)
   - `#arrowhead-golden`: For ancestor path only
   - Regular `#arrowhead`: For children (colored via stroke)

**Colors chosen**:
- Golden/amber: Matches "working" yellow theme, shows goal hierarchy
- Red: Matches existing "incomplete children" indicator, highlights blockers
- Green: Matches "done" task color, shows completed subtasks
- Semantic meaning: Red = action needed, Green = completed, Golden = context path

## Configuration Pattern

**IMPORTANT**: Any user-customizable parameter should be added to the `app` state object, NOT hardcoded.

**Examples of parameters in app state**:
- `charWidth: 8` - Pixels per character for node width calculation
- `nodePadding: 5` - Left/right padding inside rectangles (5px per side)
- `minNodeWidth: 80` - Minimum rectangle width
- `fontFamily: "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace"` - Font stack for task text
- `textLengthThreshold: 60` - Character limit for truncation
- `physicsEnabled`, `darkMode`, `zoomLevel`, etc.

**Why**: Enables future UI controls or JSON import/export for user customization without code changes.

**How to add a new config parameter**:
1. Add to app state object (around line 760)
2. Replace hardcoded values with `this.paramName`
3. Add to `configDefs` in Settings modal with metadata (type, label, default, description)
4. Add to `saveToStorage()` and `loadFromStorage()` for persistence
5. Document in README under "Configuration"

**Supported input types in configDefs**:
- `type: 'number'` - Number input with min/max range
- `type: 'text'` - Text input for strings (e.g., fontFamily)
- `type: 'select'` - Dropdown with predefined options (e.g., fontWeight)
- `type: 'checkbox'` - Boolean toggle (e.g., showDeleteConfirmation)

**Configuration persistence**: All config values in app state are now persisted to localStorage via expanded saveToStorage/loadFromStorage. Use null-coalescing operator (??) for proper defaults when loading.

## Common Development Tasks

### Adding a New Task Property
1. Update task creation in `addRootTask()` (line 537) and `addChildTask()` (line 564)
2. Update rendering in `render()` (line 1584) if visual changes needed
3. Property automatically persists via `saveToStorage()` (line 1725)

### Adding a New Relationship Type
1. Add array to task model (e.g., `blockedBy: []`)
2. Add visual rendering in the links section of `render()` (line 1601)
3. Add interaction handler with new modifier key (in `onCanvasMouseDown()`, line 1116)
4. Add removal method (similar to `removeDependency()`, line 1398)

### Adding a New Visual State
1. Add CSS class in the `<style>` section (e.g., `.task-node.urgent rect { ... }`)
2. Add logic in `render()` to apply class conditionally (line 1643)
3. Add UI to toggle state (e.g., context menu option)

### Modifying Mouse Interactions
- Mouse event handlers start at line 445
- Drag modes are distinguished in `onCanvasMouseDown()` (line 1116)
- Drag behavior implemented in `onCanvasMouseMove()` (line 1182)
- Drag completion in `onCanvasMouseUp()` (line 1232)

### 🔄 How Undo/Redo Works (Implementation Details)

#### The Snapshot-Based Approach

**Data Structure**:
- `undoStack`: Array of snapshots (max 50), each snapshot = `{ tasks: [...], description: string, timestamp: number }`
- `redoStack`: Array of snapshots (same structure)
- `isUndoing`: Boolean flag to prevent recursive snapshots during undo/redo

**Core Mechanism**:

**When user performs an action** (e.g., creates a task):
```javascript
this.saveSnapshot("Created task");  // BEFORE modifying tasks
// Stores deep clone of current state to undoStack
// Clears redoStack (new action invalidates redo history)
this.tasks.push(newTask);           // AFTER snapshot
```

**When user presses Ctrl+Z (undo)**:
```javascript
undo() {
    1. Set isUndoing = true                           // Prevent recursive snapshots
    2. Save CURRENT state → push to redoStack         // So we can redo later
    3. Pop snapshot from undoStack                    // Get previous state
    4. Restore: this.tasks = snapshot.tasks (deep clone)
    5. Set isUndoing = false
    6. saveToStorage() + render()
}
```

**When user presses Ctrl+Shift+Z (redo)**:
```javascript
redo() {
    1. Set isUndoing = true                           // Prevent recursive snapshots
    2. Save CURRENT state → push to undoStack         // So we can undo the redo
    3. Pop snapshot from redoStack                    // Get the "future" state
    4. Restore: this.tasks = snapshot.tasks (deep clone)
    5. Set isUndoing = false
    6. saveToStorage() + render()
}
```

**Stack Behavior Example**:
```
Initial:           undoStack: [A], redoStack: []
Action B:          undoStack: [A, B], redoStack: []
Undo (B→A):        undoStack: [A], redoStack: [B]
Undo (A→∅):        undoStack: [], redoStack: [A, B]
Redo (∅→A):        undoStack: [A], redoStack: [B]
New Action C:      undoStack: [A, C], redoStack: []  ← C clears redo stack!
```

**Why Deep Cloning?**
```javascript
JSON.parse(JSON.stringify(this.tasks))
```
- Creates independent copy, not reference
- Prevents undo stack corruption when current tasks are modified
- Simple, works with all data types in tasks array

**The isUndoing Flag**:
```javascript
if (this.isUndoing) return;  // Inside saveSnapshot()
```
- Prevents infinite loops: undo() calls saveToStorage() → saveToStorage() shouldn't create snapshot
- Without flag: undo → saveToStorage → saveSnapshot → clears redoStack → redo breaks!

**Smart Edit Grouping**:
```javascript
// Typing "Hello" shouldn't create 5 undo steps
if (taskId === lastTaskId && timeSince < 2000) {
    undoStack[undoStack.length - 1] = newSnapshot;  // Replace, don't append
}
```

### ⚠️ Adding Undo/Redo to New Operations (CRITICAL)

**When you add ANY new operation that modifies task data, you MUST integrate it with undo/redo.**

#### Integration Checklist:
1. **Identify Operation Type**:
   - ✅ **Content Modification** (undoable): Create/delete/edit tasks, change status, add dependencies, move tasks
   - ❌ **Viewport Navigation** (NOT undoable): Pan canvas, zoom, fit to screen

2. **Add Snapshot Call** (for content modifications):
   ```javascript
   this.saveSnapshot("Description of action");
   // ... then modify this.tasks
   ```

3. **Location**: Add `saveSnapshot()` call **BEFORE** modifying `this.tasks`

4. **Smart Grouping** (for repeated edits to same task):
   ```javascript
   this.saveSnapshot("Edited task 'Title'", taskId);  // Pass taskId for grouping
   ```

5. **Update Documentation**:
   - Update the integration checklist in `task-tree.html` (after line 3426)
   - Update README.md operation count and list
   - Update line number references if they shifted

#### Complete Integration Point List (18 total):
See the detailed checklist in `task-tree.html` starting at line 3426 with exact line numbers and operation types.

#### Common Mistakes to Avoid:
- ❌ Forgetting to call `saveSnapshot()` → Operation won't be undoable (silent failure)
- ❌ Calling `saveSnapshot()` for viewport navigation → Clears redo stack (bad UX)
- ❌ Calling `saveSnapshot()` AFTER modification → Snapshot doesn't capture pre-change state
- ❌ Not updating the checklist → Future developers won't know integration is complete

#### Testing Your Integration:
```
1. Perform the new operation
2. Press Ctrl+Z → Should undo the operation
3. Press Ctrl+Shift+Z → Should redo the operation
4. Do operation → pan canvas → undo → Should still be able to redo (redo not cleared)
```

**Note**: There is NO automated enforcement. This is a manual integration pattern. The in-code checklist (line 3426) serves as your reference and reminder.

## Testing Strategy

Use the built-in test checklist system:
1. Click "🧪 Test Checklist" button to inject test tasks
2. The checklist covers all recent features with specific test scenarios
3. Mark test tasks as done after verifying functionality
4. Export/import JSON to save/restore known-good states during testing

## Technical Details

### SVG Rendering
- Uses native SVG `<line>` elements for relationships
- Uses SVG `<foreignObject>` to embed HTML `<input>` for inline editing
- Dependency lines use two overlapping paths: wide invisible for hit detection (15px), thin visible for display (2px)

### Force-Directed Physics (Optional)
When enabled via "Physics: ON" button:
- Repulsion between nodes (only when <100px apart)
- Attraction along parent-child links
- Damping (0.7 factor) prevents endless drift
- Runs in `requestAnimationFrame` loop

### Status Bar
Shows when a task is "working":
- Full path to root (compressed if >4 levels)
- Children completion percentage
- List of incomplete children by name
- Visual warning (⚠) if incomplete children exist

## Tech Stack

- **Pure Vanilla JavaScript** - No frameworks or dependencies
- **SVG** - Scalable vector graphics for nodes and links
- **HTML5 Drag & Drop API** - Native drag interactions
- **localStorage** - Automatic persistence on every change

## Design Rationale

**Single file**: No build process, easy to share, runs anywhere
**Vanilla JS**: Zero dependencies, won't break when frameworks change
**SVG**: Infinite zoom without pixelation, native event handling
**localStorage**: Zero config persistence, offline-first
