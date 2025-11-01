import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlPath = path.join(__dirname, '../../task-tree.html');

test('verify temp arrow by directly calling createTempLine and updateTempLine', async ({ page }) => {
    await page.goto(`file://${htmlPath}`);
    await page.waitForLoadState('networkidle');

    console.log('\n=== Testing TEMP ARROW internals ===\n');

    const result = await page.evaluate(() => {
        // Create tasks
        app.addRootTaskAtPosition(200, 300);
        const taskA = app.tasks[app.tasks.length - 1];
        taskA.title = 'A';

        app.addRootTaskAtPosition(600, 300);
        const taskB = app.tasks[app.tasks.length - 1];
        taskB.title = 'B';

        app.render();

        console.log(`Task A: id=${taskA.id}, pos=(${taskA.x}, ${taskA.y})`);
        console.log(`Task B: id=${taskB.id}, pos=(${taskB.x}, ${taskB.y})`);

        // Manually set up reparent drag state
        app.selectedNode = taskA.id;
        app.dragMode = 'reparent';

        // Create the temp line
        const mockEvent = {
            clientX: taskA.x,
            clientY: taskA.y
        };
        app.createTempLine(mockEvent);

        if (!app.tempLine) {
            return { error: 'Failed to create temp line' };
        }

        console.log('\n✓ Temp line created');
        console.log(`Initial coords: x1=${app.tempLine.getAttribute('x1')}, y1=${app.tempLine.getAttribute('y1')}, x2=${app.tempLine.getAttribute('x2')}, y2=${app.tempLine.getAttribute('y2')}`);

        // Now test the reparent drag behavior - simulate moving cursor to different positions
        const positions = [
            { name: 'A + 10px', x: taskA.x + 10, y: taskA.y },
            { name: 'Midpoint', x: (taskA.x + taskB.x) / 2, y: (taskA.y + taskB.y) / 2 },
            { name: 'Near B', x: taskB.x, y: taskB.y }
        ];

        const results = [];

        for (const pos of positions) {
            // Simulate getSVGPoint output
            const pt = { x: pos.x, y: pos.y };

            // This is what happens in onCanvasMouseMove for reparent mode
            const sourceTask = app.tasks.find(t => t.id === app.selectedNode);
            if (sourceTask && app.tempLine) {
                // This is the code from mouse.js lines 240-245 (reparent mousemove)
                // Arrow goes from source to cursor (A → B)
                app.tempLine.setAttribute('x1', sourceTask.x);
                app.tempLine.setAttribute('y1', sourceTask.y);
                app.tempLine.setAttribute('x2', pt.x);
                app.tempLine.setAttribute('y2', pt.y);

                const coords = {
                    x1: parseFloat(app.tempLine.getAttribute('x1')),
                    y1: parseFloat(app.tempLine.getAttribute('y1')),
                    x2: parseFloat(app.tempLine.getAttribute('x2')),
                    y2: parseFloat(app.tempLine.getAttribute('y2'))
                };

                console.log(`\nCursor at ${pos.name} (${pos.x}, ${pos.y}):`);
                console.log(`  Line: (${coords.x1}, ${coords.y1}) → (${coords.x2}, ${coords.y2})`);

                results.push({
                    position: pos.name,
                    cursor: { x: pos.x, y: pos.y },
                    line: coords
                });
            }
        }

        return {
            taskA: { id: taskA.id, x: taskA.x, y: taskA.y },
            taskB: { id: taskB.id, x: taskB.x, y: taskB.y },
            results: results
        };
    });

    if (result.error) {
        console.log(`\n❌ ${result.error}`);
        throw new Error(result.error);
    }

    console.log('\n=== Analysis ===\n');

    // Check the final position (cursor near B)
    const finalResult = result.results[result.results.length - 1];
    const { taskA, taskB } = result;

    console.log(`\nWhen cursor is at B (${taskB.x}, ${taskB.y}):`);
    console.log(`  Temp line: (${finalResult.line.x1}, ${finalResult.line.y1}) → (${finalResult.line.x2}, ${finalResult.line.y2})`);

    // Calculate distances
    const distX1ToA = Math.abs(finalResult.line.x1 - taskA.x);
    const distY1ToA = Math.abs(finalResult.line.y1 - taskA.y);
    const distX1ToB = Math.abs(finalResult.line.x1 - taskB.x);
    const distY1ToB = Math.abs(finalResult.line.y1 - taskB.y);

    const distX2ToA = Math.abs(finalResult.line.x2 - taskA.x);
    const distY2ToA = Math.abs(finalResult.line.y2 - taskA.y);
    const distX2ToB = Math.abs(finalResult.line.x2 - taskB.x);
    const distY2ToB = Math.abs(finalResult.line.y2 - taskB.y);

    const dist1ToA = Math.sqrt(distX1ToA ** 2 + distY1ToA ** 2);
    const dist1ToB = Math.sqrt(distX1ToB ** 2 + distY1ToB ** 2);
    const dist2ToA = Math.sqrt(distX2ToA ** 2 + distY2ToA ** 2);
    const dist2ToB = Math.sqrt(distX2ToB ** 2 + distY2ToB ** 2);

    console.log(`\nDistances:`);
    console.log(`  Start (x1,y1) to A: ${dist1ToA.toFixed(1)}`);
    console.log(`  Start (x1,y1) to B: ${dist1ToB.toFixed(1)}`);
    console.log(`  End (x2,y2) to A: ${dist2ToA.toFixed(1)}`);
    console.log(`  End (x2,y2) to B: ${dist2ToB.toFixed(1)}`);

    console.log('\n=== Expected vs Actual ===\n');
    console.log('Expected: source (A) → cursor (B)');
    console.log('  Start at A, End near B');
    console.log('  Arrow follows drag motion (A dragged to B)\n');

    if (dist1ToA < 10 && dist2ToB < 10) {
        console.log('✅ CORRECT: Temp arrow goes source (A) → cursor (B)');
        console.log('   Arrow follows drag direction!');
    } else if (dist1ToB < 10 && dist2ToA < 10) {
        console.log('❌ WRONG: Temp arrow goes cursor (B) → source (A)');
        console.log('   Arrow is backwards from drag direction!');
        throw new Error('Temp arrow direction is backwards');
    } else {
        console.log('⚠️  Unexpected arrow direction');
        console.log(`   Start closest to: ${dist1ToA < dist1ToB ? 'A' : 'B'}`);
        console.log(`   End closest to: ${dist2ToA < dist2ToB ? 'A' : 'B'}`);
        throw new Error('Arrow direction unclear');
    }

    console.log('\n=== Test complete ===\n');
});
