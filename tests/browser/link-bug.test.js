/**
 * Test: Reproduce NaN coordinates bug when linking tasks
 * Creates two tasks and attempts to link them with Ctrl+drag
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlPath = path.resolve(__dirname, '../../dist/task-tree.html');

test.describe('Link Bug Reproduction', () => {
    test('should create two tasks and link them without NaN errors', async ({ page }) => {
        // Navigate to the app
        await page.goto(`file://${htmlPath}`);
        await page.waitForLoadState('networkidle');

        // Wait for app to initialize
        await page.waitForFunction(() => {
            return typeof app !== 'undefined' &&
                   typeof app.init === 'function' &&
                   typeof app.tasks !== 'undefined';
        });

        // Listen for console messages to capture diagnostics
        const consoleMessages = [];
        page.on('console', msg => {
            const text = msg.text();
            consoleMessages.push(text);
            console.log(`[BROWSER] ${text}`);
        });

        // Listen for page errors
        page.on('pageerror', err => {
            console.error(`[PAGE ERROR] ${err.message}`);
        });

        // Clear localStorage and reinitialize
        await page.evaluate(() => {
            localStorage.clear();
            app.init();
        });

        // Wait a bit for initialization
        await page.waitForTimeout(500);

        // Get SVG canvas
        const canvas = await page.locator('#canvas');

        // Create first task on the LEFT (x=200, y=300)
        console.log('\n=== Creating LEFT task ===');
        await canvas.dblclick({
            position: { x: 200, y: 300 },
            modifiers: ['Control']
        });

        // Wait for task creation and editing to settle
        await page.waitForTimeout(300);

        // Press Escape to exit edit mode
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);

        // Verify first task was created
        let taskCount = await page.evaluate(() => app.tasks.length);
        console.log(`Task count after first creation: ${taskCount}`);

        // Create second task on the RIGHT (x=600, y=300)
        console.log('\n=== Creating RIGHT task ===');
        await canvas.dblclick({
            position: { x: 600, y: 300 },
            modifiers: ['Control']
        });

        await page.waitForTimeout(300);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);

        // Verify second task was created
        taskCount = await page.evaluate(() => app.tasks.length);
        console.log(`Task count after second creation: ${taskCount}`);

        // Get task coordinates for debugging
        const tasks = await page.evaluate(() => {
            return app.tasks.map(t => ({
                id: t.id,
                title: t.title,
                x: t.x,
                y: t.y
            }));
        });
        console.log('\n=== Task coordinates before linking ===');
        console.log(JSON.stringify(tasks, null, 2));

        // Now try to link them: Ctrl+drag from LEFT to RIGHT
        console.log('\n=== Attempting to link tasks (Ctrl+drag) ===');

        // Find the first task node element
        const firstTaskNode = await page.locator('.task-node').first();
        const firstTaskBox = await firstTaskNode.boundingBox();

        if (!firstTaskBox) {
            throw new Error('Could not find first task node bounding box');
        }

        console.log(`First task node at: (${firstTaskBox.x}, ${firstTaskBox.y})`);

        // Find the second task node element
        const secondTaskNode = await page.locator('.task-node').nth(1);
        const secondTaskBox = await secondTaskNode.boundingBox();

        if (!secondTaskBox) {
            throw new Error('Could not find second task node bounding box');
        }

        console.log(`Second task node at: (${secondTaskBox.x}, ${secondTaskBox.y})`);

        // Perform Ctrl+drag from first task to second task
        const startX = firstTaskBox.x + firstTaskBox.width / 2;
        const startY = firstTaskBox.y + firstTaskBox.height / 2;
        const endX = secondTaskBox.x + secondTaskBox.width / 2;
        const endY = secondTaskBox.y + secondTaskBox.height / 2;

        console.log(`Dragging from (${startX}, ${startY}) to (${endX}, ${endY})`);

        // Press Ctrl key
        await page.keyboard.down('Control');

        // Perform drag
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.waitForTimeout(100);
        await page.mouse.move(endX, endY, { steps: 10 });
        await page.waitForTimeout(100);
        await page.mouse.up();

        // Release Ctrl key
        await page.keyboard.up('Control');

        console.log('Drag completed');

        // Wait for any operations to complete
        await page.waitForTimeout(500);

        // Check for NaN in console messages
        const nanErrors = consoleMessages.filter(msg =>
            msg.includes('NaN') || msg.includes('[REPARENT]') || msg.includes('[RENDER]')
        );

        console.log('\n=== Diagnostic Messages ===');
        if (nanErrors.length > 0) {
            nanErrors.forEach(msg => console.log(msg));
        } else {
            console.log('No NaN errors detected!');
        }

        // Get final task coordinates
        const finalTasks = await page.evaluate(() => {
            return app.tasks.map(t => ({
                id: t.id,
                title: t.title,
                x: t.x,
                y: t.y,
                mainParent: t.mainParent
            }));
        });
        console.log('\n=== Task coordinates after linking ===');
        console.log(JSON.stringify(finalTasks, null, 2));

        // Assert no NaN errors occurred
        const hasNaN = consoleMessages.some(msg =>
            msg.includes('NaN') && !msg.includes('isFinite')
        );

        if (hasNaN) {
            console.error('\n❌ TEST FAILED: NaN errors detected during linking');
            throw new Error('NaN coordinates detected during task linking');
        } else {
            console.log('\n✅ TEST PASSED: No NaN errors detected');
        }
    });
});
