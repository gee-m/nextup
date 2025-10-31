/**
 * @order 10
 * @category Data
 * @description Undo/Redo system implementation
 *
 * This module provides:
 * - saveSnapshot() - Captures current state before modifications (with smart grouping)
 * - undo() - Restores previous state from undoStack
 * - redo() - Restores future state from redoStack
 * - enforceUndoLimit() - Trims undo history to configured limit
 * - clearUndoHistory() - Clears all undo/redo history (with confirmation)
 *
 * SNAPSHOT-BASED APPROACH:
 * - undoStack: Array of {tasks, description, timestamp} snapshots (max 50)
 * - redoStack: Array of snapshots for redo operations
 * - isUndoing: Flag to prevent recursive snapshots during undo/redo
 *
 * SMART GROUPING:
 * - Edits to same task within 2 seconds are grouped (prevents char-by-char undo)
 * - Detected by taskId parameter and timestamp comparison
 *
 * INTEGRATION CHECKLIST (19 integration points):
 * See inline comments in saveSnapshot() for complete list of integrated operations
 *
 * IMPORTANT: New operations that modify tasks MUST call saveSnapshot() BEFORE modification
 */

/**
 * Save current state to undo stack before modifying tasks
 * @param {string} description - Human-readable action description
 * @param {number|null} taskId - Optional task ID for smart grouping of repeated edits
 */
app.saveSnapshot = function(description, taskId = null) {
    // SNAPSHOT MECHANISM:
    // Call this BEFORE modifying this.tasks to save current state for undo
    // Creates deep clone of tasks array and stores it in undoStack
    // Clears redoStack (new action invalidates future states)
    //
    // PARAMETERS:
    // - description: Human-readable action description (e.g., "Created task")
    // - taskId: Optional - for smart grouping of repeated edits to same task
    //
    // SMART GROUPING:
    // If editing same task within 2 seconds, replaces last snapshot instead
    // of creating new one (prevents character-by-character undo when typing)

    // Don't save during undo/redo operations (prevents infinite loops)
    if (this.isUndoing) return;

    const now = Date.now();
    const timeSinceLastSnapshot = now - this.lastSnapshotTime;

    // Smart grouping: Replace last snapshot if editing same task within 2 seconds
    const shouldGroup =
        taskId !== null &&
        taskId === this.lastSnapshotTaskId &&
        timeSinceLastSnapshot < 2000 &&
        this.undoStack.length > 0 &&
        this.undoStack[this.undoStack.length - 1].description.startsWith('Edited task');

    if (shouldGroup) {
        // Replace the last snapshot instead of creating a new one
        this.undoStack[this.undoStack.length - 1] = {
            tasks: JSON.parse(JSON.stringify(this.tasks)),
            description: description,
            timestamp: now
        };
    } else {
        // Create new snapshot
        const snapshot = {
            tasks: JSON.parse(JSON.stringify(this.tasks)),
            description: description,
            timestamp: now
        };

        this.undoStack.push(snapshot);

        // Enforce undo limit
        this.enforceUndoLimit();
    }

    // Clear redo stack when new action is performed
    this.redoStack = [];

    // Update tracking for grouping
    this.lastSnapshotTime = now;
    this.lastSnapshotTaskId = taskId;
};

// ========================================================================
// ⚠️ UNDO/REDO INTEGRATION CHECKLIST ⚠️
// ========================================================================
// When adding a NEW operation that modifies task data, you MUST call
// this.saveSnapshot("Description") BEFORE the modification.
//
// CURRENT INTEGRATION POINTS (19 total):
// ✅ addChildTask() - line 1878
// ✅ addRootTaskAtPosition() - line 1949
// ✅ cycleStatus() - lines 1981+ (3 state transitions)
// ✅ toggleDone() - lines 2050+ (done ↔ pending, also has flow-state logic)
// ✅ toggleHidden() - line ~2180
// ✅ deleteTask() - line ~2220
// ✅ finishEditing() - line ~2430 (with smart grouping)
// ✅ clearAllData() - line ~2450
// ✅ importData() - line ~2950
// ✅ Right-click menu creation - line ~4875
// ✅ Move subtree - line 2454
// ✅ Move single task - line 2473
// ✅ addDependency() - lines 2579, 2596 (add & remove toggle)
// ✅ removeDependency() - line 2608
// ❌ Canvas panning - INTENTIONALLY NOT UNDOABLE (viewport navigation)
//
// TYPES OF OPERATIONS:
// 1. Content Modification (MUST be undoable):
//    - Create/delete tasks
//    - Edit task properties
//    - Change relationships (parent/child, dependencies)
//    - Change task positions (moves individual tasks/subtrees)
//    - Change status (pending/working/done)
//    - Bulk operations (import, clear all)
//
// 2. Viewport Navigation (NOT undoable - doesn't clear redo stack):
//    - Pan canvas
//    - Zoom in/out
//    - Fit to screen
//
// HOW TO ADD UNDO TO A NEW OPERATION:
// 1. Identify: Is this a content modification or viewport navigation?
// 2. If content modification: Add this.saveSnapshot("Action description")
//    BEFORE modifying this.tasks
// 3. Use descriptive text: "Created task", "Deleted task 'Title'", etc.
// 4. For repeated edits to same task: Pass taskId as 2nd param for grouping
// 5. Update this checklist with the new integration point
// 6. Update README.md operation count and list
//
// TESTING YOUR INTEGRATION:
// 1. Perform the new operation
// 2. Press Ctrl+Z → Should undo the operation
// 3. Press Ctrl+Shift+Z → Should redo the operation
// 4. Do operation, pan canvas, undo → Redo should still work (redo not cleared)
// ========================================================================

// Development helper: Detect if tasks array was modified without snapshot
// Uncomment during development to catch missing saveSnapshot() calls
/*
app._trackTasksModification = function() {
    const currentHash = JSON.stringify(this.tasks.map(t => ({id: t.id, title: t.title, status: t.status})));
    if (this._lastTasksHash && this._lastTasksHash !== currentHash && !this.isUndoing) {
        console.warn('⚠️ UNDO/REDO WARNING: tasks array modified without saveSnapshot() call!');
        console.warn('Current stack:', new Error().stack);
    }
    this._lastTasksHash = currentHash;
};
*/

/**
 * Trim undoStack to enforce user-configured limit
 * Called after adding new snapshot and when user changes maxUndoSteps in Settings
 */
app.enforceUndoLimit = function() {
    // Trim undoStack if it exceeds user-configured limit
    // Called after adding new snapshot and when user changes maxUndoSteps in Settings
    while (this.undoStack.length > this.maxUndoSteps) {
        this.undoStack.shift(); // Remove oldest snapshot
    }
};

/**
 * Clear all undo/redo history (with confirmation dialog)
 * Called from Settings modal
 */
app.clearUndoHistory = function() {
    // Clear all undo/redo history (called from Settings modal)
    const undoCount = this.undoStack.length;
    const redoCount = this.redoStack.length;

    if (undoCount === 0 && redoCount === 0) {
        this.showToast('History is already empty', 'info');
        return;
    }

    // Show confirmation dialog
    this.showConfirm(
        'Clear Undo/Redo History?',
        `This will remove ${undoCount} undo steps and ${redoCount} redo steps. This action cannot be undone.`,
        () => {
            // On confirm
            this.undoStack = [];
            this.redoStack = [];
            this.saveToStorage();
            this.updateStatusBar();
            this.showToast(`✓ History cleared (${undoCount + redoCount} steps removed)`, 'success');

            // Update stats in settings modal if it's open
            const modal = document.getElementById('settings-modal');
            if (modal && modal.classList.contains('show')) {
                document.getElementById('undo-count').textContent = '0';
                document.getElementById('redo-count').textContent = '0';
                document.getElementById('history-size').textContent = '0';
            }
        }
    );
};

/**
 * Undo the last operation
 * Restores previous state from undoStack and saves current state to redoStack
 */
app.undo = function() {
    // UNDO MECHANISM:
    // 1. Save current state to redoStack (so we can redo later)
    // 2. Pop snapshot from undoStack (the previous state)
    // 3. Restore tasks array from snapshot (deep clone)
    // 4. isUndoing flag prevents saveSnapshot() from being called during this process
    //    (otherwise saveToStorage() would trigger saveSnapshot() → clear redoStack!)

    if (this.undoStack.length === 0) {
        this.showToast('Nothing to undo', 'error');
        return;
    }

    // Save current state to redo stack (so redo can restore it)
    this.isUndoing = true;  // Prevents saveSnapshot() from clearing redoStack
    const currentState = {
        tasks: JSON.parse(JSON.stringify(this.tasks)),  // Deep clone
        description: 'Current state',
        timestamp: Date.now()
    };
    this.redoStack.push(currentState);

    // Restore previous state from undo stack
    const snapshot = this.undoStack.pop();
    this.tasks = JSON.parse(JSON.stringify(snapshot.tasks));  // Deep clone

    this.isUndoing = false;
    this.saveToStorage();  // Persist both stacks to localStorage
    this.render();
    this.updateStatusBar();

    // Show what was undone
    const desc = snapshot.description.length > 50
        ? snapshot.description.substring(0, 47) + '...'
        : snapshot.description;
    this.showToast(`✓ Undone: ${desc}`, 'success');
};

/**
 * Redo the last undone operation
 * Restores future state from redoStack and saves current state to undoStack
 */
app.redo = function() {
    // REDO MECHANISM:
    // 1. Save current state to undoStack (so we can undo the redo)
    // 2. Pop snapshot from redoStack (the "future" state we undid earlier)
    // 3. Restore tasks array from snapshot (deep clone)
    // 4. isUndoing flag prevents saveSnapshot() during this process
    //
    // SYMMETRY WITH UNDO:
    // - undo() moves snapshots: undoStack → redoStack
    // - redo() moves snapshots: redoStack → undoStack
    // Both save current state to opposite stack before restoring

    if (this.redoStack.length === 0) {
        this.showToast('Nothing to redo', 'error');
        return;
    }

    // Save current state to undo stack (so we can undo this redo)
    this.isUndoing = true;  // Prevents saveSnapshot() from clearing stacks
    const currentState = {
        tasks: JSON.parse(JSON.stringify(this.tasks)),  // Deep clone
        description: 'Current state',
        timestamp: Date.now()
    };
    this.undoStack.push(currentState);

    // Restore "future" state from redo stack
    const snapshot = this.redoStack.pop();
    this.tasks = JSON.parse(JSON.stringify(snapshot.tasks));  // Deep clone

    this.isUndoing = false;
    this.saveToStorage();  // Persist both stacks to localStorage
    this.render();
    this.updateStatusBar();

    // Show what was redone
    const desc = snapshot.description.length > 50
        ? snapshot.description.substring(0, 47) + '...'
        : snapshot.description;
    this.showToast(`✓ Redone: ${desc}`, 'success');
};

console.log('[undo-redo.js] Undo/redo system loaded');
