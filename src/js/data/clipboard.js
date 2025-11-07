/**
 * @order 13
 * @category Data
 * @description Copy/paste subtree operations
 *
 * This module provides:
 * - copySubtree() - Copies task and all descendants to internal clipboard
 * - pasteSubtree() - Pastes copied subtree at specified position or as child
 * - pasteFromClipboard() - Reads JSON from system clipboard and pastes (cross-app support)
 *
 * CLIPBOARD FORMAT:
 * {
 *   version: 1,
 *   rootId: number,
 *   subtree: Array<Task>,
 *   metadata: { nodeCount, timestamp, sourceApp }
 * }
 *
 * COPY BEHAVIOR:
 * - Deep clones all tasks in subtree
 * - Cleans external references (dependencies/parents outside subtree)
 * - Resets working state and hidden flags
 * - Preserves relative positions
 *
 * PASTE BEHAVIOR:
 * - Generates new IDs for all tasks
 * - Remaps all internal references (children, dependencies, parents)
 * - Offsets positions to avoid overlap
 * - Can paste as root task or as child of existing task
 * - Creates undo snapshot before paste
 *
 * VALIDATION (pasteFromClipboard):
 * - Checks for Clipboard API availability
 * - Validates JSON format
 * - Validates required fields (version, subtree, rootId, metadata)
 * - Validates each task structure
 * - Shows detailed error messages
 */

/**
 * Copy task and all descendants to clipboard
 * @param {number} taskId - Root task ID to copy
 */
app.copySubtree = function(taskId) {
    const rootTask = this.tasks.find(t => t.id === taskId);
    if (!rootTask) return;

    // 1. Collect all descendants recursively
    const subtreeTasks = [];
    const subtreeIds = new Set();

    const collectNode = (id) => {
        if (subtreeIds.has(id)) return;

        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        subtreeIds.add(id);
        subtreeTasks.push(task);

        // Recurse into children
        task.children.forEach(childId => collectNode(childId));
    };

    collectNode(taskId);

    // 2. Clean and prepare tasks for clipboard
    const cleanedTasks = subtreeTasks.map(task => {
        const cleaned = JSON.parse(JSON.stringify(task));  // Deep clone

        // Clean external references
        cleaned.mainParent = task.id === taskId ? null : task.mainParent;
        cleaned.otherParents = cleaned.otherParents.filter(id => subtreeIds.has(id));
        cleaned.dependencies = cleaned.dependencies.filter(id => subtreeIds.has(id));
        cleaned.currentlyWorking = false;  // Never copy working state
        cleaned.hidden = false;  // Reset hidden state

        // Remove runtime velocity properties
        delete cleaned.vx;
        delete cleaned.vy;

        return cleaned;
    });

    // 3. Store in clipboard with metadata
    this.copiedSubtree = {
        version: 1,
        rootId: taskId,
        subtree: cleanedTasks,
        metadata: {
            nodeCount: cleanedTasks.length,
            timestamp: Date.now(),
            sourceApp: 'Task Tree'
        }
    };

    // 4. Also copy to system clipboard for cross-app support
    const clipboardJSON = JSON.stringify(this.copiedSubtree, null, 2);
    navigator.clipboard.writeText(clipboardJSON).then(() => {
        const nodeWord = cleanedTasks.length === 1 ? 'node' : 'nodes';
        this.showToast(`✓ Copied ${cleanedTasks.length} ${nodeWord} to clipboard`, 'success', 2000);
    }).catch(err => {
        // Fallback: Still show success even if system clipboard fails
        const nodeWord = cleanedTasks.length === 1 ? 'node' : 'nodes';
        this.showToast(`✓ Copied ${cleanedTasks.length} ${nodeWord}`, 'success', 2000);
    });
};

/**
 * Paste copied subtree at specified position or as child
 * @param {number|null} parentId - If provided, paste as child; if null, paste as root
 * @param {number|null} x - X coordinate for paste (if null, uses auto-offset)
 * @param {number|null} y - Y coordinate for paste (if null, uses auto-offset)
 */
app.pasteSubtree = function(parentId = null, x = null, y = null) {
    if (!this.copiedSubtree) {
        this.showToast('❌ Clipboard empty - copy a subtree first', 'error', 2000);
        return;
    }

    const clipboard = this.copiedSubtree;
    const oldRootId = clipboard.rootId;

    this.saveSnapshot(`Pasted subtree (${clipboard.metadata.nodeCount} nodes)`);

    // 1. Create ID mapping (oldId → newId)
    const idMap = new Map();
    clipboard.subtree.forEach(task => {
        idMap.set(task.id, this.taskIdCounter++);
    });

    // 2. Find root task to calculate position offset
    const oldRoot = clipboard.subtree.find(t => t.id === oldRootId);

    // Determine paste position
    let newRootX, newRootY;
    if (x !== null && y !== null) {
        // Explicit position provided
        newRootX = x;
        newRootY = y;
    } else {
        // Auto-offset: place 300px right, 100px down from original
        newRootX = oldRoot.x + 300;
        newRootY = oldRoot.y + 100;
    }

    const deltaX = newRootX - oldRoot.x;
    const deltaY = newRootY - oldRoot.y;

    // 3. Clone, remap IDs, and adjust positions
    const newTasks = clipboard.subtree.map(oldTask => {
        const newTask = { ...oldTask };

        // Remap ID
        newTask.id = idMap.get(oldTask.id);

        // Remap parent (if pasting as root, clear mainParent)
        if (oldTask.id === oldRootId && parentId !== null) {
            newTask.mainParent = parentId;
        } else if (oldTask.id === oldRootId) {
            newTask.mainParent = null;
        } else {
            newTask.mainParent = idMap.get(oldTask.mainParent);
        }

        // Remap children, otherParents, dependencies
        newTask.children = oldTask.children.map(childId => idMap.get(childId)).filter(id => id !== undefined);
        newTask.otherParents = oldTask.otherParents.map(parentId => idMap.get(parentId)).filter(id => id !== undefined);
        newTask.dependencies = oldTask.dependencies.map(depId => idMap.get(depId)).filter(id => id !== undefined);

        // Adjust position
        newTask.x = oldTask.x + deltaX;
        newTask.y = oldTask.y + deltaY;

        // Reset runtime properties
        newTask.vx = 0;
        newTask.vy = 0;
        newTask.currentlyWorking = false;
        newTask.hidden = false;

        return newTask;
    });

    // 4. Add to tasks array
    this.tasks.push(...newTasks);

    // 5. If pasting as child, update parent
    if (parentId !== null) {
        const parent = this.tasks.find(t => t.id === parentId);
        if (parent) {
            parent.children.push(idMap.get(oldRootId));
        }
    }

    this.saveToStorage();
    this.updateStatusBar();
    this.render();

    const nodeWord = newTasks.length === 1 ? 'node' : 'nodes';
    this.showToast(`✓ Pasted ${newTasks.length} ${nodeWord}`, 'success', 2000);
};

/**
 * Read system clipboard and paste if it contains valid subtree JSON
 * Supports cross-app subtree sharing
 * @param {number|null} parentId - If provided, paste as child; if null, paste as root
 * @param {number|null} x - X coordinate for paste
 * @param {number|null} y - Y coordinate for paste
 */
app.pasteFromClipboard = async function(parentId = null, x = null, y = null) {
    // Read clipboard and paste if it contains valid subtree JSON
    try {
        // Check if Clipboard API is available
        if (!navigator.clipboard || !navigator.clipboard.readText) {
            this.showToast('❌ Clipboard API not available in this browser', 'error', 3000);
            return;
        }

        // Read clipboard text
        const clipboardText = await navigator.clipboard.readText();

        if (!clipboardText || clipboardText.trim() === '') {
            this.showToast('❌ Clipboard is empty', 'error', 2000);
            return;
        }

        // Try to parse as JSON
        let clipboardData;
        try {
            clipboardData = JSON.parse(clipboardText);
        } catch (parseError) {
            this.showToast('❌ Clipboard does not contain valid JSON', 'error', 3000);
            return;
        }

        // Validate subtree format
        if (!clipboardData.version || !clipboardData.subtree || !Array.isArray(clipboardData.subtree) || !clipboardData.rootId || !clipboardData.metadata) {
            this.showToast('❌ Clipboard JSON is not a valid subtree format', 'error', 3000);
            return;
        }

        // Validate each task has required fields
        for (const task of clipboardData.subtree) {
            if (typeof task.id !== 'number' || !task.title || typeof task.x !== 'number' || typeof task.y !== 'number') {
                this.showToast('❌ Invalid task format in subtree', 'error', 3000);
                return;
            }
        }

        // Check rootId exists in subtree
        if (!clipboardData.subtree.find(t => t.id === clipboardData.rootId)) {
            this.showToast('❌ Root task not found in subtree', 'error', 3000);
            return;
        }

        // Valid subtree! Store temporarily and paste
        this.copiedSubtree = clipboardData;
        this.pasteSubtree(parentId, x, y);

        // Show success message mentioning import
        const nodeCount = clipboardData.metadata.nodeCount || clipboardData.subtree.length;
        const nodeWord = nodeCount === 1 ? 'node' : 'nodes';
        this.showToast(`📋 Imported and pasted ${nodeCount} ${nodeWord} from clipboard`, 'success', 3000);

    } catch (error) {
        console.error('Paste from clipboard error:', error);
        this.showToast(`❌ Failed to read clipboard: ${error.message}`, 'error', 3000);
    }
};

/**
 * Paste image from clipboard as a new task node
 * @param {number|null} parentId - Optional parent task ID
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
app.pasteImage = async function(parentId = null, x = null, y = null) {
    try {
        // Check if Clipboard API is available
        if (!navigator.clipboard || !navigator.clipboard.read) {
            this.showToast('❌ Clipboard API not available in this browser', 'error', 3000);
            return;
        }

        // Read clipboard
        const clipboardItems = await navigator.clipboard.read();

        // Find first image item
        let imageBlob = null;
        for (const item of clipboardItems) {
            for (const type of item.types) {
                if (type.startsWith('image/')) {
                    imageBlob = await item.getType(type);
                    break;
                }
            }
            if (imageBlob) break;
        }

        if (!imageBlob) {
            this.showToast('❌ No image found in clipboard', 'error', 2000);
            return;
        }

        // Check image size (limit to 5MB)
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (imageBlob.size > MAX_SIZE) {
            this.showToast(`❌ Image too large (${(imageBlob.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.`, 'error', 3000);
            return;
        }

        // Save image to IndexedDB
        const imageId = await this.saveImage(imageBlob);

        // Get original image dimensions
        const blobUrl = URL.createObjectURL(imageBlob);
        const img = new Image();
        await new Promise((resolve) => {
            img.onload = resolve;
            img.src = blobUrl;
        });
        const imageWidth = img.naturalWidth;
        const imageHeight = img.naturalHeight;
        URL.revokeObjectURL(blobUrl);

        // Create new task with image
        if (x === null || y === null) {
            x = this.viewBox.x + this.viewBox.width / 2;
            y = this.viewBox.y + this.viewBox.height / 2;
        }

        const snapped = this.snapPointToGrid(x, y);

        this.saveSnapshot(`Pasted image`);

        const newTask = {
            id: this.taskIdCounter++,
            title: '',  // Empty title for image-only nodes
            x: snapped.x,
            y: snapped.y,
            vx: 0,
            vy: 0,
            mainParent: parentId,
            otherParents: [],
            children: [],
            dependencies: [],
            status: 'pending',
            currentlyWorking: false,
            hidden: false,
            textExpanded: false,
            textLocked: false,
            links: [],
            imageId: imageId,  // Reference to IndexedDB image
            imageWidth: imageWidth,  // Original width
            imageHeight: imageHeight,  // Original height
            priority: 'normal',
            customAttachPoints: {},
            customSourcePoints: {},
            timeTracking: {
                totalSeconds: 0,
                sessions: []
            }
        };

        this.tasks.push(newTask);

        // If pasting as child, update parent's children array
        if (parentId !== null) {
            const parent = this.tasks.find(t => t.id === parentId);
            if (parent) {
                parent.children.push(newTask.id);
            }
        }

        this.saveToStorage();
        this.render();

        const sizeMB = (imageBlob.size / 1024 / 1024).toFixed(2);
        this.showToast(`✓ Pasted image (${sizeMB}MB)`, 'success', 2000);

    } catch (error) {
        console.error('Paste image error:', error);
        this.showToast(`❌ Failed to paste image: ${error.message}`, 'error', 3000);
    }
};

/**
 * Smart paste - auto-detects clipboard content type
 * Tries image first, falls back to subtree/JSON
 * @param {number|null} parentId - Optional parent task ID
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
app.smartPaste = async function(parentId = null, x = null, y = null) {
    try {
        // Use last mouse position if not specified
        if (x === null || y === null) {
            x = this.lastMousePosition.x;
            y = this.lastMousePosition.y;
        }

        // Check if Clipboard API is available
        if (!navigator.clipboard || !navigator.clipboard.read) {
            // Fall back to subtree paste
            if (this.copiedSubtree) {
                this.pasteSubtree(parentId, x, y);
            } else {
                this.showToast('❌ Clipboard empty', 'error', 2000);
            }
            return;
        }

        // Read clipboard
        const clipboardItems = await navigator.clipboard.read();

        // Check for image first
        let hasImage = false;
        for (const item of clipboardItems) {
            if (item.types.some(type => type.startsWith('image/'))) {
                hasImage = true;
                break;
            }
        }

        if (hasImage) {
            // Paste image
            await this.pasteImage(parentId, x, y);
        } else {
            // No image - try subtree paste
            if (this.copiedSubtree) {
                this.pasteSubtree(parentId, x, y);
            } else {
                this.showToast('❌ Clipboard empty - copy a subtree first (Ctrl+C)', 'error', 2000);
            }
        }
    } catch (error) {
        console.error('Smart paste error:', error);
        // Fall back to subtree paste on error
        if (this.copiedSubtree) {
            this.pasteSubtree(parentId, x, y);
        } else {
            this.showToast('❌ Clipboard empty', 'error', 2000);
        }
    }
};

console.log('[clipboard.js] Copy/paste subtree operations loaded');
