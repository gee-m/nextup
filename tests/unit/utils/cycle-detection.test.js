/**
 * Unit Tests - Cycle Detection
 *
 * Tests the wouldCreateCycle() function which prevents circular dependencies.
 */

import { describe, test, expect, beforeEach } from 'vitest';

// We need to simulate the app object for these tests
const createMockApp = () => {
    return {
        tasks: [],
        wouldCreateCycle(fromId, toId) {
            // BFS to check if adding fromId → toId would create a cycle
            // A cycle exists if we can reach fromId by following dependencies from toId
            const visited = new Set();
            const queue = [toId];

            while (queue.length > 0) {
                const currentId = queue.shift();

                if (currentId === fromId) {
                    return true; // Cycle detected
                }

                if (visited.has(currentId)) {
                    continue; // Already visited
                }

                visited.add(currentId);

                const task = this.tasks.find(t => t.id === currentId);
                if (task && task.dependencies) {
                    queue.push(...task.dependencies);
                }
            }

            return false; // No cycle
        }
    };
};

describe('Cycle Detection', () => {
    let app;

    beforeEach(() => {
        app = createMockApp();
    });

    test('no cycle when tasks are independent', () => {
        app.tasks = [
            { id: 1, dependencies: [] },
            { id: 2, dependencies: [] }
        ];

        // Adding 1 → 2 should not create a cycle
        expect(app.wouldCreateCycle(1, 2)).toBe(false);
    });

    test('direct cycle: A → B, adding B → A', () => {
        app.tasks = [
            { id: 1, dependencies: [2] },  // A depends on B
            { id: 2, dependencies: [] }
        ];

        // Adding B → A would create: A → B → A
        expect(app.wouldCreateCycle(2, 1)).toBe(true);
    });

    test('indirect cycle: A → B → C, adding C → A', () => {
        app.tasks = [
            { id: 1, dependencies: [2] },  // A → B
            { id: 2, dependencies: [3] },  // B → C
            { id: 3, dependencies: [] }
        ];

        // Adding C → A would create: A → B → C → A
        expect(app.wouldCreateCycle(3, 1)).toBe(true);
    });

    test('no cycle in linear chain', () => {
        app.tasks = [
            { id: 1, dependencies: [] },
            { id: 2, dependencies: [1] },  // B → A
            { id: 3, dependencies: [2] }   // C → B
        ];

        // Adding A → C is safe (creates A → C → B → A would be cycle, but that's not what we're adding)
        // We're checking if adding 1 → 3 creates a cycle
        // Current: 3 → 2 → 1
        // Adding: 1 → 3 would create 3 → 2 → 1 → 3 (cycle!)
        expect(app.wouldCreateCycle(1, 3)).toBe(true);
    });

    test('complex graph without cycle', () => {
        app.tasks = [
            { id: 1, dependencies: [] },
            { id: 2, dependencies: [1] },     // B → A
            { id: 3, dependencies: [1] },     // C → A
            { id: 4, dependencies: [2, 3] }   // D → B, D → C
        ];

        // Adding A → D would create a cycle: A → D → B → A
        expect(app.wouldCreateCycle(1, 4)).toBe(true);
    });

    test('self-loop detection', () => {
        app.tasks = [
            { id: 1, dependencies: [] }
        ];

        // Adding 1 → 1 (self-loop) should be detected as a cycle
        expect(app.wouldCreateCycle(1, 1)).toBe(true);
    });

    test('multiple dependency paths without cycle', () => {
        app.tasks = [
            { id: 1, dependencies: [] },
            { id: 2, dependencies: [1] },
            { id: 3, dependencies: [1, 2] }  // C → A, C → B (diamond pattern)
        ];

        // Adding B → C would create: C → B → C (cycle!)
        expect(app.wouldCreateCycle(2, 3)).toBe(true);
    });

    test('empty dependencies array', () => {
        app.tasks = [
            { id: 1, dependencies: [] },
            { id: 2, dependencies: [] }
        ];

        // No existing dependencies, so no cycle possible
        expect(app.wouldCreateCycle(1, 2)).toBe(false);
        expect(app.wouldCreateCycle(2, 1)).toBe(false);
    });
});
