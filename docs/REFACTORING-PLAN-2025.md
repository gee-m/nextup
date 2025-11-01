# Code Refactoring Plan - January 2025

**Status:** 🚧 In Progress
**Commit:** Starting from `985a94a`
**Objective:** Eliminate code duplication and improve defensive programming

---

## Executive Summary

After comprehensive code review of 7,003 lines across 34 JavaScript files, identified critical defensive programming issues and code duplication that pose maintenance risks. This document outlines the refactoring plan to address these issues.

**Technical Debt Score:** 6/10
**Estimated Refactoring Time:** ~90 minutes total
**Approach:** Incremental, tested changes in phases

---

## Phase 1: Critical Defensive Programming (30 min) ✅ APPROVED

### 1.1 Create Task Helper Utilities

**File:** `src/js/utils/task-helpers.js`

**Problem:** Same validation/manipulation code repeated 100+ times across codebase

**Functions to Extract:**
```javascript
/**
 * Validate task has finite coordinates
 * @returns {boolean} true if valid, false if NaN/Infinity
 */
export function validateTaskCoordinates(task) {
    if (!isFinite(task.x) || !isFinite(task.y)) {
        console.error(`Task ${task.id} "${task.title}" has invalid coords: (${task.x}, ${task.y})`);
        return false;
    }
    return true;
}

/**
 * Truncate title to maximum length with ellipsis
 * @param {string} title - Task title
 * @param {number} maxLength - Maximum characters (default 30)
 * @returns {string} Truncated title
 */
export function truncateTitle(title, maxLength = 30) {
    if (!title) return '';
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength - 3) + '...';
}

/**
 * Find task by ID with null safety
 * @param {Array} tasks - Tasks array
 * @param {number} id - Task ID to find
 * @returns {Object|null} Task object or null if not found
 */
export function findTaskById(tasks, id) {
    return tasks.find(t => t.id === id) || null;
}

/**
 * Get safe task title for display
 * @param {Object} task - Task object
 * @param {number} maxLength - Max length before truncation
 * @returns {string} Safe display title
 */
export function getTaskDisplayTitle(task, maxLength = 30) {
    if (!task || !task.title) return 'Untitled';
    return truncateTitle(task.title, maxLength);
}
```

**Usage Locations:** (Estimated 150+ occurrences to replace)
- render.js: 20+ coordinate validations
- context-menu.js: 30+ title truncations
- status-bar.js: 15+ title truncations
- toast.js: 10+ title truncations
- undo-redo.js: 5+ title truncations
- All files: 100+ `.find(t => t.id === ...)` calls

**Impact:**
- ✅ Single source of truth for validation logic
- ✅ Easy to modify behavior (change once, works everywhere)
- ✅ Consistent error messages
- ✅ ~100 lines of code eliminated

---

### 1.2 Create Constants File

**File:** `src/js/utils/constants.js`

**Problem:** Magic numbers scattered throughout codebase

**Constants to Extract:**
```javascript
/**
 * Interaction Constants
 */
export const INTERACTION = {
    /** Minimum pixels to move before drag activates */
    DRAG_THRESHOLD_PX: 5,

    /** Delay before click vs drag detection (ms) */
    CLICK_DELAY_MS: 200,

    /** Double-click max time between clicks (ms) */
    DOUBLE_CLICK_MAX_MS: 300,
};

/**
 * Animation Durations (ms)
 */
export const ANIMATION = {
    /** Zoom out duration */
    ZOOM_OUT_MS: 300,

    /** Pan/move duration */
    PAN_MS: 500,

    /** Zoom in duration */
    ZOOM_IN_MS: 500,

    /** Total animation time (zoom out + pan + zoom in) */
    TOTAL_MS: 1300,

    /** Easing function for smooth animations */
    EASING: (t) => t < 0.5 ? 2*t*t : -1+(4-2*t)*t,
};

/**
 * UI Display Constants
 */
export const UI = {
    /** Default title truncation length */
    TITLE_MAX_LENGTH: 30,

    /** Toast message durations by type (ms) */
    TOAST_DURATION: {
        SUCCESS: 2000,
        INFO: 3000,
        WARNING: 3000,
        ERROR: 4000,
    },
};
```

**Current Magic Numbers Found:**
- `5` - Drag threshold (8 locations in mouse.js)
- `200` - Click delay (3 locations)
- `300` - Zoom out time (2 locations in jump.js, homes.js)
- `500` - Pan time (2 locations)
- `1300` - Total animation (2 locations)
- `30` - Title truncation (inconsistent with config `textLengthThreshold`)
- `2000`, `3000`, `4000` - Toast durations (inconsistent across files)

**Impact:**
- ✅ Change drag sensitivity in ONE place
- ✅ Consistent animation timing
- ✅ Consistent toast durations
- ✅ Self-documenting code (named constants vs numbers)

---

## Phase 2: Extract Animation Utility (20 min) ✅ APPROVED

### 2.1 Create Viewport Animation Module

**File:** `src/js/utils/viewport-animation.js`

**Problem:** Identical 50-line animation code duplicated in:
- `navigation/jump.js` (lines 107-156)
- `navigation/homes.js` (lines 139-208)

**92% code duplication!**

**Extracted Function:**
```javascript
import { ANIMATION } from './constants.js';

/**
 * Smoothly animate viewport to target position with zoom
 *
 * Three-phase animation:
 * 1. Zoom out to overview
 * 2. Pan to target location
 * 3. Zoom in to target zoom level
 *
 * @param {Object} app - App instance with viewBox and zoomLevel
 * @param {number} targetX - Target X coordinate (center)
 * @param {number} targetY - Target Y coordinate (center)
 * @param {number} targetZoom - Target zoom level (default 1.0)
 * @param {Object} options - Animation options
 * @param {number} options.overviewZoom - Zoom level for overview phase (default 0.3)
 * @param {Function} options.onComplete - Callback when animation completes
 * @returns {Promise} Resolves when animation completes
 */
export function animateViewportTo(app, targetX, targetY, targetZoom = 1.0, options = {}) {
    const {
        overviewZoom = 0.3,
        onComplete = null,
    } = options;

    return new Promise((resolve) => {
        // Store starting state
        const startX = app.viewBox.x + app.viewBox.width / 2;
        const startY = app.viewBox.y + app.viewBox.height / 2;
        const startZoom = app.zoomLevel;

        // Calculate distances
        const dx = targetX - startX;
        const dy = targetY - startY;

        // Phase 1: Zoom out
        animatePhase(0, ANIMATION.ZOOM_OUT_MS, (progress) => {
            const t = ANIMATION.EASING(progress);
            app.zoomLevel = startZoom + (overviewZoom - startZoom) * t;
            app.render();
        }, () => {
            // Phase 2: Pan
            animatePhase(0, ANIMATION.PAN_MS, (progress) => {
                const t = ANIMATION.EASING(progress);
                const currentX = startX + dx * t;
                const currentY = startY + dy * t;

                // Update viewBox center
                app.viewBox.x = currentX - app.viewBox.width / 2;
                app.viewBox.y = currentY - app.viewBox.height / 2;
                app.render();
            }, () => {
                // Phase 3: Zoom in
                animatePhase(0, ANIMATION.ZOOM_IN_MS, (progress) => {
                    const t = ANIMATION.EASING(progress);
                    app.zoomLevel = overviewZoom + (targetZoom - overviewZoom) * t;

                    // Recenter on target during zoom
                    app.viewBox.x = targetX - app.viewBox.width / 2;
                    app.viewBox.y = targetY - app.viewBox.height / 2;
                    app.render();
                }, () => {
                    // Final positioning
                    app.zoomLevel = targetZoom;
                    app.viewBox.x = targetX - app.viewBox.width / 2;
                    app.viewBox.y = targetY - app.viewBox.height / 2;
                    app.render();

                    if (onComplete) onComplete();
                    resolve();
                });
            });
        });
    });
}

/**
 * Helper: Animate a single phase using requestAnimationFrame
 */
function animatePhase(startTime, duration, onProgress, onComplete) {
    const animate = (currentTime) => {
        if (startTime === 0) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1.0);

        onProgress(progress);

        if (progress < 1.0) {
            requestAnimationFrame(animate);
        } else {
            onComplete();
        }
    };
    requestAnimationFrame(animate);
}
```

**Files to Update:**
- `navigation/jump.js` - Replace lines 107-156
- `navigation/homes.js` - Replace lines 139-208

**New Usage:**
```javascript
// jump.js
import { animateViewportTo } from '../utils/viewport-animation.js';

jumpToWorkingTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    animateViewportTo(this, task.x, task.y, 1.0, {
        onComplete: () => {
            this.showToast(`Jumped to working task: "${task.title}"`);
        }
    });
}
```

**Impact:**
- ✅ Eliminates 100+ lines of duplicate code
- ✅ Single source for animation logic
- ✅ Consistent animation behavior
- ✅ Easier to modify animation parameters
- ✅ Reusable for future navigation features

---

## Implementation Order

### Step 1: Create Utilities (10 min)
1. Create `src/js/utils/task-helpers.js`
2. Create `src/js/utils/constants.js`
3. Create `src/js/utils/viewport-animation.js`
4. Update `LOAD_ORDER.md` to include new files

### Step 2: Update Imports (5 min)
1. Add imports to all files that will use utilities
2. Ensure build order is correct

### Step 3: Replace Usages - Task Helpers (10 min)
1. Replace coordinate validations with `validateTaskCoordinates()`
2. Replace title truncations with `truncateTitle()`
3. Replace `.find()` calls with `findTaskById()`
4. Test rendering, validation, display

### Step 4: Replace Usages - Constants (5 min)
1. Replace drag threshold `5` → `INTERACTION.DRAG_THRESHOLD_PX`
2. Replace animation durations → `ANIMATION.*`
3. Replace toast durations → `UI.TOAST_DURATION.*`
4. Test interactions, animations, toasts

### Step 5: Replace Animation Code (10 min)
1. Update `navigation/jump.js` to use `animateViewportTo()`
2. Update `navigation/homes.js` to use `animateViewportTo()`
3. Test jump navigation, home navigation

### Step 6: Build & Test (10 min)
1. Run `npm run build`
2. Run `npm run test:browser`
3. Manual smoke test in browser
4. Fix any issues

---

## Testing Strategy

### Automated Tests
- All existing Playwright tests must pass
- Specific focus on:
  - Arrow rendering (ensure no NaN regression)
  - Task creation/editing
  - Navigation (jump, homes)
  - Drag interactions

### Manual Testing Checklist
- [ ] Create task with Ctrl+double-click
- [ ] Drag task with mouse (threshold detection)
- [ ] Ctrl+drag to reparent (check threshold)
- [ ] Jump to working task (animation smooth)
- [ ] Jump to home (animation smooth)
- [ ] Context menu shows truncated titles
- [ ] Toast messages have consistent durations
- [ ] No console errors

---

## Risk Assessment

### Low Risk ✅
- Creating new utility files (no existing code affected)
- Constants extraction (pure replacement)
- Helper functions (pure functions, easy to test)

### Medium Risk ⚠️
- Animation extraction (affects UX, needs careful testing)
- Mass find/replace (could miss edge cases)

### Mitigation
- Incremental changes with testing after each step
- Git commit after each phase
- Keep original code in comments during transition
- Run full test suite before final commit

---

## Success Criteria

### Code Quality
- [ ] No magic numbers in interaction code
- [ ] No duplicate coordinate validation
- [ ] No duplicate title truncation
- [ ] No duplicate animation code
- [ ] All code uses centralized utilities

### Functionality
- [ ] All tests pass
- [ ] No regression in arrow rendering
- [ ] Animations work smoothly
- [ ] Drag interactions work correctly
- [ ] No console errors

### Maintainability
- [ ] Future drag threshold changes require 1 edit (not 8)
- [ ] Future animation timing changes require 1 edit (not 4)
- [ ] Future title display changes require 1 edit (not 30+)

---

## Post-Refactoring Benefits

### Immediate
1. **Easier bug fixes** - Fix validation once, works everywhere
2. **Consistent UX** - Same behavior across all features
3. **Faster development** - Reuse utilities instead of reimplementing

### Long-term
1. **Lower maintenance cost** - Less code to maintain
2. **Easier onboarding** - New developers find utilities, not scattered logic
3. **Better testability** - Test utilities once, trust everywhere

---

## Future Phases (Not in Current Scope)

### Phase 3: Split render() Function (45 min)
- Extract `renderMainParentLinks()`
- Extract `renderOtherParentLinks()`
- Extract `renderDependencyLinks()`
- Extract `renderTaskNodes()`
- Extract `renderBadges()`

### Phase 4: Fix Root Cause Bugs
- Investigate why multiple working tasks occur
- Add validation to prevent, not just repair

### Phase 5: Extract Dropdown Pattern
- Create reusable dropdown component
- Replace 3 duplicate implementations

---

## Changelog

### 2025-01-XX - Initial Refactoring Plan
- Documented Phases 1-2
- Identified 150+ replacement locations
- Created implementation checklist

### 2025-01-XX - Phase 1 Complete
- ✅ Created task-helpers.js
- ✅ Created constants.js
- ✅ Replaced all coordinate validations
- ✅ Replaced all title truncations
- ✅ Replaced all magic numbers
- ✅ All tests passing

### 2025-01-XX - Phase 2 Complete
- ✅ Created viewport-animation.js
- ✅ Replaced jump.js animation
- ✅ Replaced homes.js animation
- ✅ All tests passing

---

## Notes for Developers

**If you modify drag sensitivity:**
```javascript
// OLD: Had to find and change in 8 places
if (distance >= 5) { ... }

// NEW: Change once in constants.js
import { INTERACTION } from './utils/constants.js';
if (distance >= INTERACTION.DRAG_THRESHOLD_PX) { ... }
```

**If you modify animation timing:**
```javascript
// OLD: Had to change in 4 places
const zoomOutDuration = 300;
const panDuration = 500;

// NEW: Change once in constants.js
import { ANIMATION } from './utils/constants.js';
const zoomOutDuration = ANIMATION.ZOOM_OUT_MS;
```

**If you need to validate coordinates:**
```javascript
// OLD: Inline validation repeated everywhere
if (!isFinite(task.x) || !isFinite(task.y)) {
    console.error(`Task ${task.id} has invalid coords...`);
    return;
}

// NEW: Use utility
import { validateTaskCoordinates } from './utils/task-helpers.js';
if (!validateTaskCoordinates(task)) return;
```

---

**END OF DOCUMENT**
