import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlPath = path.join(__dirname, '../../task-tree.html');

test('check arrow coordinates after reparenting', async ({ page }) => {
    await page.goto(`file://${htmlPath}`);
    await page.waitForLoadState('networkidle');

    console.log('\n=== Setting up test: Create A and B, reparent A to B ===\n');

    // Create two tasks and reparent directly via app methods
    const result = await page.evaluate(() => {
        // Create task A at (200, 300)
        app.addRootTaskAtPosition(200, 300);
        const taskA = app.tasks[app.tasks.length - 1];
        taskA.title = 'A';
        console.log(`Created task A: id=${taskA.id}, pos=(${taskA.x}, ${taskA.y})`);

        // Create task B at (600, 300)
        app.addRootTaskAtPosition(600, 300);
        const taskB = app.tasks[app.tasks.length - 1];
        taskB.title = 'B';
        console.log(`Created task B: id=${taskB.id}, pos=(${taskB.x}, ${taskB.y})`);

        // Reparent A to B (B becomes parent of A)
        console.log(`\nReparenting A (id=${taskA.id}) to B (id=${taskB.id})`);
        app.reparentTask({ taskId: taskA.id, newParentId: taskB.id });

        // Force render
        app.render();

        // Find any line or path elements in the SVG
        const lines = Array.from(document.querySelectorAll('line, path'));
        console.log(`\nFound ${lines.length} total lines/paths`);

        lines.forEach((line, i) => {
            const classes = line.className.baseVal || line.getAttribute('class') || '';
            console.log(`  ${i}: ${line.tagName} - classes: "${classes}"`);
        });

        // Look for any link between our tasks (exclude temp-line)
        const parentLink = lines.find(link => {
            const classes = link.className.baseVal || link.getAttribute('class') || '';
            return !classes.includes('temp-line');
        });

        if (!parentLink) {
            return {
                error: 'No link found',
                taskA: { id: taskA.id, x: taskA.x, y: taskA.y, mainParent: taskA.mainParent },
                taskB: { id: taskB.id, x: taskB.x, y: taskB.y, children: taskB.children }
            };
        }

        console.log(`\nUsing link: ${parentLink.tagName} with classes "${parentLink.className.baseVal || ''}"`);

        let linkCoords;

        if (parentLink.tagName === 'line') {
            linkCoords = {
                x1: parseFloat(parentLink.getAttribute('x1')),
                y1: parseFloat(parentLink.getAttribute('y1')),
                x2: parseFloat(parentLink.getAttribute('x2')),
                y2: parseFloat(parentLink.getAttribute('y2'))
            };
        } else if (parentLink.tagName === 'path') {
            // Parse path d attribute: "M x1 y1 ... x2 y2"
            const d = parentLink.getAttribute('d');
            const match = d.match(/M\s*([\d.]+)\s+([\d.]+).*?([\d.]+)\s+([\d.]+)$/);
            if (match) {
                linkCoords = {
                    x1: parseFloat(match[1]),
                    y1: parseFloat(match[2]),
                    x2: parseFloat(match[3]),
                    y2: parseFloat(match[4])
                };
            } else {
                return { error: `Could not parse path d="${d}"` };
            }
        } else {
            return { error: `Unknown element type: ${parentLink.tagName}` };
        }

        console.log(`\nLink coordinates:`);
        console.log(`  x1=${linkCoords.x1}, y1=${linkCoords.y1} (start)`);
        console.log(`  x2=${linkCoords.x2}, y2=${linkCoords.y2} (end)`);

        return {
            taskA: {
                id: taskA.id,
                x: taskA.x,
                y: taskA.y,
                mainParent: taskA.mainParent
            },
            taskB: {
                id: taskB.id,
                x: taskB.x,
                y: taskB.y,
                children: taskB.children
            },
            link: linkCoords,
            marker: parentLink.getAttribute('marker-end')
        };
    });

    if (result.error) {
        console.log(`\n❌ ${result.error}`);
        console.log('Task A:', result.taskA);
        console.log('Task B:', result.taskB);
        throw new Error(result.error);
    }

    console.log('\n=== Analysis ===\n');
    console.log(`Task A: id=${result.taskA.id}, pos=(${result.taskA.x}, ${result.taskA.y})`);
    console.log(`        mainParent=${result.taskA.mainParent} (should be ${result.taskB.id})`);
    console.log(`Task B: id=${result.taskB.id}, pos=(${result.taskB.x}, ${result.taskB.y})`);
    console.log(`        children=[${result.taskB.children}] (should include ${result.taskA.id})`);

    console.log(`\nLink coordinates:`);
    console.log(`  Start: (${result.link.x1}, ${result.link.y1})`);
    console.log(`  End:   (${result.link.x2}, ${result.link.y2})`);
    console.log(`  Marker: ${result.marker}`);

    // Calculate which task each endpoint is closer to
    const distX1ToA = Math.abs(result.link.x1 - result.taskA.x);
    const distY1ToA = Math.abs(result.link.y1 - result.taskA.y);
    const distX1ToB = Math.abs(result.link.x1 - result.taskB.x);
    const distY1ToB = Math.abs(result.link.y1 - result.taskB.y);

    const distX2ToA = Math.abs(result.link.x2 - result.taskA.x);
    const distY2ToA = Math.abs(result.link.y2 - result.taskA.y);
    const distX2ToB = Math.abs(result.link.x2 - result.taskB.x);
    const distY2ToB = Math.abs(result.link.y2 - result.taskB.y);

    const dist1ToA = Math.sqrt(distX1ToA ** 2 + distY1ToA ** 2);
    const dist1ToB = Math.sqrt(distX1ToB ** 2 + distY1ToB ** 2);
    const dist2ToA = Math.sqrt(distX2ToA ** 2 + distY2ToA ** 2);
    const dist2ToB = Math.sqrt(distX2ToB ** 2 + distY2ToB ** 2);

    console.log(`\nDistance analysis:`);
    console.log(`  Start point (x1,y1) distance to A: ${dist1ToA.toFixed(1)}`);
    console.log(`  Start point (x1,y1) distance to B: ${dist1ToB.toFixed(1)}`);
    console.log(`  End point (x2,y2) distance to A: ${dist2ToA.toFixed(1)}`);
    console.log(`  End point (x2,y2) distance to B: ${dist2ToB.toFixed(1)}`);

    console.log(`\n=== Arrow Direction ===\n`);

    if (dist1ToB < dist1ToA && dist2ToA < dist2ToB) {
        console.log('✅ CORRECT: Arrow goes from B (parent) → A (child)');
        console.log('   Start near B, end near A, marker points to A');
    } else if (dist1ToA < dist1ToB && dist2ToB < dist2ToA) {
        console.log('❌ WRONG: Arrow goes from A (child) → B (parent)');
        console.log('   Start near A, end near B, marker points to B');
        console.log('   This is backwards!');
    } else {
        console.log('⚠️  UNCLEAR: Arrow endpoints ambiguous');
        console.log(`   Start closer to: ${dist1ToA < dist1ToB ? 'A' : 'B'}`);
        console.log(`   End closer to: ${dist2ToA < dist2ToB ? 'A' : 'B'}`);
    }

    // Verify relationship is correct
    expect(result.taskA.mainParent).toBe(result.taskB.id);
    expect(result.taskB.children).toContain(result.taskA.id);

    // Verify no NaN
    expect(result.link.x1).not.toBeNaN();
    expect(result.link.y1).not.toBeNaN();
    expect(result.link.x2).not.toBeNaN();
    expect(result.link.y2).not.toBeNaN();

    console.log('\n=== Test complete ===\n');
});
