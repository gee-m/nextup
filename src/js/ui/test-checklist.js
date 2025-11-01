/**
 * @module ui/test-checklist
 * @order 35
 * @category ui
 *
 * Test data injection - comprehensive checklist for testing features
 *
 * KEY FUNCTION:
 *
 * loadTestChecklist() - Inject comprehensive test task tree
 * - Creates hierarchical test structure
 * - Root: "🧪 Test Recent Changes"
 * - 7 categories with specific test scenarios
 * - Positioned at (200, 200) with children spread out
 * - Shows alert notification when loaded
 *
 * TEST CATEGORIES:
 *
 * 1. Middle-Click Status Cycling
 *    - Pending → Working → Done → Pending cycle
 *    - Status bar updates
 *    - Single working task constraint
 *
 * 2. Shift+Drag Subtree Movement
 *    - Entire subtree moves together
 *    - Relative positions preserved
 *    - Distances unchanged
 *
 * 3. Incomplete Children Highlighting
 *    - Working task with children
 *    - Red borders on incomplete children
 *    - Disappear when marked done
 *
 * 4. Custom Modals Work
 *    - Delete confirmation modal
 *    - Cancel vs Yes buttons
 *    - Clear All Data modal
 *
 * 5. Enhanced Status Bar
 *    - Full path display
 *    - Completion percentage
 *    - Incomplete children list
 *    - Path compression (>4 levels)
 *
 * 6. Dependency Cleanup on Reparent
 *    - Create dependency
 *    - Reparent removes dependency
 *    - Visual verification
 *
 * 7. Visual Alt+Drag Distinction
 *    - Ctrl+drag = dashed blue (reparent)
 *    - Alt+drag = solid green (dependency)
 *
 * USAGE:
 * - Click "🧪 Test Checklist" button to inject
 * - Mark tasks as done after verifying
 * - Provides known-good state for debugging
 * - Covers all major features systematically
 */

export const TestChecklistMixin = {
    loadTestChecklist() {
        // Create root test node
        const testRoot = {
            id: this.taskIdCounter++,
            title: '🧪 Test Recent Changes',
            x: 200,
            y: 200,
            vx: 0,
            vy: 0,
            mainParent: null,
            otherParents: [],
            children: [],
            dependencies: [],
            status: 'pending',
            hidden: false,
            currentlyWorking: false
        };
        this.tasks.push(testRoot);

        // Test items for recent features
        const tests = [
            {
                title: 'Middle-Click Status Cycling',
                children: [
                    'Middle-click pending task → becomes Working (yellow)',
                    'Middle-click again → becomes Done (green)',
                    'Middle-click again → becomes Pending (white)',
                    'Verify status bar updates when task is Working',
                    'Verify only one task can be Working at a time'
                ]
            },
            {
                title: 'Shift+Drag Subtree Movement',
                children: [
                    'Create task with children',
                    'Shift+drag parent task',
                    'Verify entire subtree moves together',
                    'Verify relative positions preserved',
                    'Verify distances between nodes unchanged'
                ]
            },
            {
                title: 'Incomplete Children Highlighting',
                children: [
                    'Create task with children',
                    'Mark task as "Working"',
                    'Verify incomplete children have red border',
                    'Mark a child done - red border should disappear'
                ]
            },
            {
                title: 'Custom Modals Work',
                children: [
                    'Click Delete on a task - modal should appear',
                    'Click Cancel - modal closes, task remains',
                    'Click Delete again > Yes - task deletes',
                    'Test Clear All Data modal works'
                ]
            },
            {
                title: 'Enhanced Status Bar',
                children: [
                    'Mark nested task as Working',
                    'Verify full path shows (Root > ... > Current)',
                    'Check completion percentage displays',
                    'Verify incomplete children listed by name',
                    'Path compresses correctly if >4 levels deep'
                ]
            },
            {
                title: 'Dependency Cleanup on Reparent',
                children: [
                    'Create dependency A→B with Ctrl+drag',
                    'Alt+drag A to B (reparent)',
                    'Verify dependency arrow disappears',
                    'Verify A is now child of B'
                ]
            },
            {
                title: 'Visual Alt+Drag Distinction',
                children: [
                    'Ctrl+drag - verify dashed blue line',
                    'Alt+drag - verify solid green line',
                    'Complete both operations successfully'
                ]
            }
        ];

        let yOffset = 0;
        tests.forEach((category, idx) => {
            const categoryTask = {
                id: this.taskIdCounter++,
                title: category.title,
                x: 400,
                y: 200 + yOffset,
                vx: 0,
                vy: 0,
                mainParent: testRoot.id,
                otherParents: [],
                children: [],
                dependencies: [],
                status: 'pending',
                hidden: false,
                currentlyWorking: false
            };
            this.tasks.push(categoryTask);
            testRoot.children.push(categoryTask.id);

            category.children.forEach((testName, childIdx) => {
                const testTask = {
                    id: this.taskIdCounter++,
                    title: testName,
                    x: 600,
                    y: 200 + yOffset + (childIdx * 60),
                    vx: 0,
                    vy: 0,
                    mainParent: categoryTask.id,
                    otherParents: [],
                    children: [],
                    dependencies: [],
                    status: 'pending',
                    hidden: false,
                    currentlyWorking: false
                };
                this.tasks.push(testTask);
                categoryTask.children.push(testTask.id);
            });

            yOffset += category.children.length * 60 + 80;
        });

        this.saveToStorage();
        this.render();

        this.showAlert('Test Checklist Loaded', 'Testing tasks have been added to your graph. Check them off as you test!');
    }
};

console.log('[test-checklist.js] Test data injection loaded');
