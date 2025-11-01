# Modular Refactoring Verification Plan

## Objective
Systematically verify that ALL functions from the monolithic task-tree.html have been properly extracted into the 33 module files, with NO placeholders remaining.

## Verification Strategy

### Phase 1: Automated Placeholder Detection
- [x] List all 33 module files
- [ ] Grep for placeholder indicators in all files:
  - `"Placeholder"` string
  - `"NOTE: ... remains in task-tree.html"` patterns
  - `"This file documents"` (documentation-only files)
  - Empty mixin objects: `export const XMixin = {};` or `= { };`

### Phase 2: Per-File Deep Verification

#### **CORE MODULES** (5 files)

##### 1. src/js/state.js (@order 1)
- [ ] Check: Contains app object initialization with ALL properties
- [ ] Verify properties: tasks, taskIdCounter, selectedTaskIds, viewBox, zoomLevel, darkMode, homes, homeIdCounter, undoStack, redoStack, etc.
- [ ] Count properties: Should have 40+ properties
- [ ] No placeholder comments

##### 2. src/js/config.js (@order 2)
- [ ] Check: Contains configurable defaults
- [ ] Verify: textLengthThreshold, charWidth, nodePadding, wheelZoomSpeed, minNodeWidth, fontFamily, fontWeight, etc.
- [ ] Count properties: Should have 15+ config properties
- [ ] Each has default value

##### 3. src/js/core/tasks.js (@order 15)
- [ ] Check functions exist: addRootTask, addChildTask, deleteTask, getAncestors, getDescendants
- [ ] Count functions: Should have 5+ functions
- [ ] Each function has real implementation (not empty)
- [ ] Verify against task-tree.html lines 1862-2137

##### 4. src/js/core/status.js (@order 16)
- [ ] Check functions: cycleStatus, toggleDone, toggleHidden
- [ ] Count functions: Should have 3+ functions
- [ ] Flow state logic present (done → parent)
- [ ] Verify against task-tree.html lines 2139-2303

##### 5. src/js/core/relationships.js (@order 17)
- [ ] Check functions: reparentTask, addDependency, removeDependency, wouldCreateCycle
- [ ] Count functions: Should have 4+ functions
- [ ] Cycle detection logic present
- [ ] Verify against task-tree.html lines 2305-2535

#### **UTILS MODULES** (3 files)

##### 6. src/js/utils/platform.js (@order 5)
- [ ] Check functions: getModifierKey, getAltKey, getShiftKey, platform detection
- [ ] Count functions: Should have 3+ functions
- [ ] Platform booleans: isMac, isWindows
- [ ] Verify against task-tree.html lines 1455-1503

##### 7. src/js/utils/svg.js (@order 6)
- [ ] Check functions: getSVGPoint, createLine, getLineEndAtRectEdge
- [ ] Count functions: Should have 3+ functions
- [ ] SVG coordinate transformation present
- [ ] Verify against task-tree.html lines 1505-1582

##### 8. src/js/utils/cycle-detection.js (@order 8)
- [ ] Check function: wouldCreateCycle
- [ ] Graph traversal logic present
- [ ] Verify against task-tree.html lines 2437-2468

#### **DATA MODULES** (4 files)

##### 9. src/js/data/undo-redo.js (@order 10)
- [ ] Check functions: saveSnapshot, undo, redo, enforceUndoLimit
- [ ] Count functions: Should have 4+ functions
- [ ] Smart grouping logic (2-second window)
- [ ] isUndoing flag logic
- [ ] Verify against task-tree.html lines 2537-2645

##### 10. src/js/data/persistence.js (@order 11)
- [ ] Check functions: saveToStorage, loadFromStorage, debouncedSaveToStorage
- [ ] Count functions: Should have 3 functions
- [ ] QuotaExceededError handling
- [ ] Migration logic for old "origin" system
- [ ] Verify against task-tree.html lines 2647-2717

##### 11. src/js/data/import-export.js (@order 12)
- [ ] Check functions: exportData, importData, showImportModal, hideImportModal
- [ ] Count functions: Should have 4+ functions
- [ ] JSON export/import logic
- [ ] Verification against task-tree.html lines 2719-2848

##### 12. src/js/data/clipboard.js (@order 13)
- [ ] Check functions: copySelectedTasks, pasteTasksFromClipboard
- [ ] Count functions: Should have 2+ functions
- [ ] Deep copy logic for task structure
- [ ] Verify against task-tree.html lines 2850-2942

#### **RENDERING MODULES** (5 files)

##### 13. src/js/rendering/golden-path.js (@order 20)
- [ ] Check function: getWorkingTaskPath
- [ ] Returns: workingTaskId, ancestorPath (Set), directChildren (Array)
- [ ] Ancestor traversal to root
- [ ] Children completion status
- [ ] Verify against task-tree.html lines 5465-5498

##### 14. src/js/rendering/indicators.js (@order 21)
- [ ] Check functions: renderOffScreenIndicators, renderLinkIcons, renderTextLockButton
- [ ] Count functions: Should have 3+ functions
- [ ] Off-screen arrow logic
- [ ] Verify against task-tree.html lines 3084-3267

##### 15. src/js/rendering/nodes.js (@order 22)
- [ ] Check functions: calculateTaskDimensions, wrapText, renderTaskNode
- [ ] Count functions: Should have 3+ functions
- [ ] Multiline text wrapping
- [ ] Word wrap logic
- [ ] Verify against task-tree.html lines 2944-3082

##### 16. src/js/rendering/links.js (@order 23)
- [ ] Check function: renderLinks
- [ ] Parent links rendering
- [ ] Dependency links rendering
- [ ] Golden path coloring logic
- [ ] Verify against task-tree.html lines 5583-5726 (within render())

##### 17. src/js/rendering/render.js (@order 24)
- [ ] Check function: render, updateViewBoxOnly
- [ ] Count functions: Should have 2 functions
- [ ] SVG viewBox calculation
- [ ] Calls to renderLinks and renderNodes
- [ ] Verify against task-tree.html lines 5500-6002

#### **INTERACTIONS MODULES** (4 files)

##### 18. src/js/interactions/mouse.js (@order 25)
- [ ] Check functions: onCanvasMouseDown, onCanvasMouseMove, onCanvasMouseUp
- [ ] Count functions: Should have 3 functions
- [ ] Drag modes: node, canvas, reparent, dependency, subtree
- [ ] Modifier key detection
- [ ] Verify against task-tree.html lines 3995-4419

##### 19. src/js/interactions/keyboard.js (@order 26)
- [ ] Check function: onKeyDown
- [ ] Keyboard shortcuts: Backspace, P, J, Escape, Cmd+Z, Cmd+Shift+Z, Cmd+K, etc.
- [ ] Platform-aware modifier keys
- [ ] Verify against task-tree.html lines 4421-4602

##### 20. src/js/interactions/drag.js (@order 27)
- [ ] Check functions: drag helpers if any
- [ ] May be integrated into mouse.js
- [ ] Verify no standalone drag functions remain in task-tree.html

##### 21. src/js/interactions/edit.js (@order 28)
- [ ] Check functions: startEditing, finishEditing, cancelEditing
- [ ] Count functions: Should have 3+ functions
- [ ] Inline editing with foreignObject
- [ ] URL auto-detection logic
- [ ] Verify against task-tree.html lines 4779-4933

#### **UI MODULES** (7 files)

##### 22. src/js/ui/modals.js (@order 30)
- [ ] Check functions: showAlert, hideAlert, showConfirm, showPrompt
- [ ] Count functions: Should have 4+ functions
- [ ] Modal positioning and styling
- [ ] Verify against task-tree.html lines 4935-5134

##### 23. src/js/ui/context-menu.js (@order 31)
- [ ] Check functions: showNodeMenu, showEmptySpaceMenu, closeMenu, attachLink, openLink, etc.
- [ ] Count functions: Should have 10+ functions
- [ ] Multi-select handling
- [ ] Priority submenu
- [ ] Dependencies display with removal
- [ ] Verify against task-tree.html lines 4604-5279

##### 24. src/js/ui/status-bar.js (@order 32)
- [ ] Check functions: updateStatusBar, renderWorkingTaskStatus
- [ ] Count functions: Should have 2+ functions
- [ ] Path compression (>4 levels)
- [ ] Children completion percentage
- [ ] Verify against task-tree.html lines 6004-6175

##### 25. src/js/ui/settings.js (@order 33)
- [ ] Check functions: showSettingsModal, hideSettingsModal, applySettings, resetSettings, exportSettings
- [ ] Count functions: Should have 5 functions
- [ ] configDefs with 17 properties
- [ ] Form generation logic
- [ ] charWidth calibration integration
- [ ] Verify against task-tree.html lines 3413-3797

##### 26. src/js/ui/shortcuts.js (@order 34)
- [ ] Check functions: showShortcutsModal, hideShortcutsModal
- [ ] Count functions: Should have 2 functions
- [ ] 7 shortcut categories
- [ ] Platform-aware key names
- [ ] Verify against task-tree.html lines 5327-5463

##### 27. src/js/ui/test-checklist.js (@order 35)
- [ ] Check function: loadTestChecklist
- [ ] Injects test tasks
- [ ] Test scenarios for features
- [ ] Verify against task-tree.html lines 3825-4087

##### 28. src/js/ui/toast.js (@order 36)
- [ ] Check function: showToast
- [ ] Toast container creation
- [ ] Auto-dismiss timer
- [ ] Verify against task-tree.html lines 3799-3823

#### **NAVIGATION MODULES** (4 files)

##### 29. src/js/navigation/viewport.js (@order 40)
- [ ] Check functions: fitToScreen, updateZoomDisplay, zoomIn, zoomOut, onWheel
- [ ] Count functions: Should have 5+ functions
- [ ] viewBox calculations
- [ ] Zoom clamping (0.1-10)
- [ ] Verify against task-tree.html lines 6177-6419

##### 30. src/js/navigation/homes.js (@order 41)
- [ ] Check functions: markOrigin, createHome, jumpToHome, updateHome, deleteHome, setKeybindForHome, renameHome, toggleHomesDropdown, renderHomesDropdown, showCreateHomeModal, hideCreateHomeModal, createHomeFromModal, showManageHomesModal, hideManageHomesModal, renderManageHomesModal
- [ ] Count functions: Should have 15 functions
- [ ] 3-phase animation (zoom out → pan → zoom in)
- [ ] Keybind conflict resolution
- [ ] Verify against task-tree.html lines 6493-7778

##### 31. src/js/navigation/jump.js (@order 42)
- [ ] Check functions: jumpToWorkingTask, showWorkingTasksDropdown
- [ ] Count functions: Should have 2 functions
- [ ] Cinematic animation
- [ ] Numbered menu (1-9 keys)
- [ ] lastWorkingTaskId tracking
- [ ] Verify against task-tree.html lines 7088-7387

##### 32. src/js/navigation/text-lock.js (@order 43)
- [ ] Check functions: updateTextLengthThreshold, expandText, toggleTextLock
- [ ] Count functions: Should have 3 functions
- [ ] Text expansion logic
- [ ] Lock button rendering
- [ ] Verify against task-tree.html lines 7776-7817

#### **APP MODULE** (1 file)

##### 33. src/js/app.js (@order 100)
- [ ] Check function: init
- [ ] DOMContentLoaded listener
- [ ] Initialization sequence
- [ ] Verify against task-tree.html lines 8090-8160

### Phase 3: Search for Remaining Functions

#### Grep Patterns to Run:
```bash
# Find all function definitions in task-tree.html after line 1500 (after app object starts)
grep -n "^\s*\w\+(" task-tree.html | awk -F: '$1 > 1500'

# Find all arrow functions
grep -n "^\s*\w\+\s*=" task-tree.html | awk -F: '$1 > 1500'

# Find all "this." function calls that might indicate missing extractions
grep -n "this\.\w\+(" task-tree.html | awk -F: '$1 > 1500' | head -50

# Search for specific patterns
grep -n "showSettingsModal\|showShortcutsModal\|jumpToHome\|createHome" task-tree.html
```

### Phase 4: Function Count Verification

Create a table of expected vs actual function counts:

| Module | Expected Functions | Actual Count | Status |
|--------|-------------------|--------------|--------|
| state.js | 1 (app object) | ? | ⏳ |
| config.js | 15+ properties | ? | ⏳ |
| tasks.js | 5+ | ? | ⏳ |
| status.js | 3+ | ? | ⏳ |
| relationships.js | 4+ | ? | ⏳ |
| platform.js | 3+ | ? | ⏳ |
| svg.js | 3+ | ? | ⏳ |
| cycle-detection.js | 1 | ? | ⏳ |
| undo-redo.js | 4+ | ? | ⏳ |
| persistence.js | 3 | ? | ⏳ |
| import-export.js | 4+ | ? | ⏳ |
| clipboard.js | 2+ | ? | ⏳ |
| golden-path.js | 1 | ? | ⏳ |
| indicators.js | 3+ | ? | ⏳ |
| nodes.js | 3+ | ? | ⏳ |
| links.js | 1 | ? | ⏳ |
| render.js | 2 | ? | ⏳ |
| mouse.js | 3 | ? | ⏳ |
| keyboard.js | 1 (large) | ? | ⏳ |
| drag.js | integrated? | ? | ⏳ |
| edit.js | 3+ | ? | ⏳ |
| modals.js | 4+ | ? | ⏳ |
| context-menu.js | 10+ | ? | ⏳ |
| status-bar.js | 2+ | ? | ⏳ |
| settings.js | 5 | ? | ⏳ |
| shortcuts.js | 2 | ? | ⏳ |
| test-checklist.js | 1 | ? | ⏳ |
| toast.js | 1 | ? | ⏳ |
| viewport.js | 5+ | ? | ⏳ |
| homes.js | 15 | ? | ⏳ |
| jump.js | 2 | ? | ⏳ |
| text-lock.js | 3 | ? | ⏳ |
| app.js | 1 | ? | ⏳ |

### Phase 5: Build & Test Verification
- [ ] Run `node build.js` - Should succeed with no warnings
- [ ] Check dist/task-tree.html size - Should be ~320-330KB
- [ ] Run all browser tests - Should pass 8/8
- [ ] Manually test in browser:
  - [ ] Create task
  - [ ] Edit task
  - [ ] Delete task
  - [ ] Undo/Redo
  - [ ] Middle-click status cycle
  - [ ] Jump to working task (J key)
  - [ ] Open settings modal
  - [ ] Open shortcuts modal
  - [ ] Create/jump to home
  - [ ] Context menus work
  - [ ] Right-click on node
  - [ ] Right-click on empty space

### Phase 6: Final Report

Generate markdown report with:
- Total functions extracted
- Total lines extracted
- Any remaining placeholders
- Any missing functions
- Build status
- Test status
- Deployment status

## Execution Order

1. Run automated placeholder detection (grep patterns)
2. Manually verify each file in category order (Core → Utils → Data → Rendering → Interactions → UI → Navigation → App)
3. Search for remaining functions in task-tree.html
4. Count functions and fill verification table
5. Run build & tests
6. Generate final report
7. Update README.md with results

## Success Criteria

✅ All verification checkboxes checked
✅ No placeholder indicators found
✅ Function counts match expectations
✅ All 8 browser tests passing
✅ Build completes with no errors
✅ Manual browser testing confirms all features work
✅ README.md updated with extraction summary
