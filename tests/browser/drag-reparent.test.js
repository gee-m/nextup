import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlPath = path.join(__dirname, '../../task-tree.html');

test('verify Ctrl+drag reparenting: drag A to B makes A parent of B', async ({ page }) => {
    await page.goto(`file://${htmlPath}`);
    await page.waitForLoadState('networkidle');

    console.log('\n=== Testing Ctrl+drag reparenting semantics ===\n');

    const result = await page.evaluate(() => {
        // Create tasks
        app.addRootTaskAtPosition(200, 300);
        const taskA = app.tasks[app.tasks.length - 1];
        taskA.title = 'A';

        app.addRootTaskAtPosition(600, 300);
        const taskB = app.tasks[app.tasks.length - 1];
        taskB.title = 'B';

        app.render();

        console.log(`Created: A (id=${taskA.id}), B (id=${taskB.id})`);
        console.log(`Before drag: A.mainParent=${taskA.mainParent}, B.mainParent=${taskB.mainParent}`);

        // Simulate the exact flow of Ctrl+drag from A to B
        const canvas = document.getElementById('canvas');

        // Step 1: Ctrl+mousedown on A
        app.selectedNode = taskA.id;
        app.dragMode = 'reparent-pending';
        app.dragStartOriginal = { x: taskA.x, y: taskA.y };

        // Step 2: Move mouse (triggers reparent mode)
        const pt = { x: taskA.x + 10, y: taskA.y };
        const distance = 10; // >5px threshold

        // This simulates what happens in onCanvasMouseMove
        app.dragMode = 'reparent';
        app.createTempLine({ clientX: taskA.x, clientY: taskA.y });

        // Step 3: Mouseup on B (this is what calls reparentTask)
        // This simulates the onCanvasMouseUp logic
        const targetId = taskB.id;

        console.log(`\nSimulating drag from A (${taskA.id}) to B (${taskB.id})`);
        console.log(`selectedNode = ${app.selectedNode}`);
        console.log(`targetId = ${targetId}`);

        // This is the actual call from mouse.js line 327 (NEW CODE)
        app.reparentTask({ taskId: targetId, newParentId: app.selectedNode });

        app.render();

        // Check final state
        const taskAFinal = app.tasks.find(t => t.title === 'A');
        const taskBFinal = app.tasks.find(t => t.title === 'B');

        console.log(`\nAfter drag:`);
        console.log(`  A.mainParent = ${taskAFinal.mainParent}`);
        console.log(`  A.children = [${taskAFinal.children}]`);
        console.log(`  B.mainParent = ${taskBFinal.mainParent}`);
        console.log(`  B.children = [${taskBFinal.children}]`);

        // Find the arrow
        const lines = Array.from(document.querySelectorAll('line, path'));
        const mainLink = lines.find(link => {
            const classes = link.className.baseVal || link.getAttribute('class') || '';
            return !classes.includes('temp-line') && !classes.includes('dependency');
        });

        let linkCoords = null;
        if (mainLink) {
            if (mainLink.tagName === 'line') {
                linkCoords = {
                    x1: parseFloat(mainLink.getAttribute('x1')),
                    y1: parseFloat(mainLink.getAttribute('y1')),
                    x2: parseFloat(mainLink.getAttribute('x2')),
                    y2: parseFloat(mainLink.getAttribute('y2'))
                };
            }
        }

        return {
            taskA: {
                id: taskAFinal.id,
                x: taskAFinal.x,
                y: taskAFinal.y,
                mainParent: taskAFinal.mainParent,
                children: taskAFinal.children
            },
            taskB: {
                id: taskBFinal.id,
                x: taskBFinal.x,
                y: taskBFinal.y,
                mainParent: taskBFinal.mainParent,
                children: taskBFinal.children
            },
            link: linkCoords
        };
    });

    console.log('\n=== Expected Behavior ===');
    console.log('Drag from A to B should make A the parent of B');
    console.log('  A.mainParent should be null');
    console.log('  A.children should include B');
    console.log('  B.mainParent should be A');
    console.log('  Arrow should go A → B\n');

    console.log('=== Actual Behavior ===');
    console.log(`  A.mainParent = ${result.taskA.mainParent} (expected: null)`);
    console.log(`  A.children = [${result.taskA.children}] (expected: [${result.taskB.id}])`);
    console.log(`  B.mainParent = ${result.taskB.mainParent} (expected: ${result.taskA.id})`);
    console.log(`  B.children = [${result.taskB.children}] (expected: [])`);

    if (result.link) {
        console.log(`\nArrow: (${result.link.x1}, ${result.link.y1}) → (${result.link.x2}, ${result.link.y2})`);

        const distX1ToA = Math.abs(result.link.x1 - result.taskA.x);
        const distX1ToB = Math.abs(result.link.x1 - result.taskB.x);
        const distX2ToA = Math.abs(result.link.x2 - result.taskA.x);
        const distX2ToB = Math.abs(result.link.x2 - result.taskB.x);

        if (distX1ToA < 50 && distX2ToB < 50) {
            console.log('  ✅ Arrow goes A → B (correct!)');
        } else {
            console.log('  ❌ Arrow direction unexpected');
        }
    }

    // Verify expectations
    expect(result.taskA.mainParent).toBe(null);
    expect(result.taskA.children).toContain(result.taskB.id);
    expect(result.taskB.mainParent).toBe(result.taskA.id);
    expect(result.taskB.children).toEqual([]);

    console.log('\n✅ Test passed! A is parent of B\n');
});
