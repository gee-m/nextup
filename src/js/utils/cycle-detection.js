/**
 * @order 14
 * @category Utils
 * @description Dependency cycle detection
 *
 * This module provides:
 * - wouldCreateCycle() - Checks if adding a dependency would create a circular dependency
 *
 * ALGORITHM: Breadth-first search (BFS)
 * - Start from the target task (toId)
 * - Follow all dependency chains
 * - If we reach the source task (fromId), a cycle exists
 *
 * USAGE: Called before adding dependencies via Alt+drag
 * Prevents: A → B → C → A (circular dependency)
 */

/**
 * Check if adding a dependency from→to would create a cycle
 * @param {number} fromId - Task that will depend on toId
 * @param {number} toId - Task that fromId will depend on
 * @returns {boolean} True if cycle would be created, false otherwise
 */
app.wouldCreateCycle = function(fromId, toId) {
    // Check if adding dependency from->to would create a cycle
    const visited = new Set();
    const queue = [toId];

    while (queue.length > 0) {
        const current = queue.shift();
        if (current === fromId) return true;
        if (visited.has(current)) continue;

        visited.add(current);
        const task = this.tasks.find(t => t.id === current);
        if (task) {
            queue.push(...task.dependencies);
        }
    }

    return false;
};

console.log('[cycle-detection.js] Dependency cycle detection loaded');
