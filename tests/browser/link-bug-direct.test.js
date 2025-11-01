/**
 * Test: Reproduce NaN bug by directly calling app methods
 * This bypasses mouse simulation issues and directly tests the linking logic
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlPath = path.resolve(__dirname, '../../dist/task-tree.html');

test.describe('Link Bug - Direct Method Calls', () => {
    test('should link two tasks without NaN coordinates', async ({ page }) => {
        // Navigate and wait for app
        await page.goto(`file://${htmlPath}`);
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => {
            return typeof app !== 'undefined' &&
                   typeof app.init === 'function' &&
                   typeof app.tasks !== 'undefined';
        });

        // Capture ALL console messages
        const consoleMessages = [];
        page.on('console', msg => {
            const text = msg.text();
            consoleMessages.push(text);
            console.log(`[BROWSER CONSOLE] ${text}`);
        });

        // Clear localStorage and start fresh
        await page.evaluate(() => {
            localStorage.clear();
            app.tasks = [];
            app.taskIdCounter = 0;
        });

        console.log('\n=== Creating two tasks directly ===');

        // Create two tasks programmatically with known coordinates
        const { task1Id, task2Id } = await page.evaluate(() => {
            // Create first task at x=200, y=300
            app.addRootTaskAtPosition(200, 300);
            const task1Id = app.tasks[app.tasks.length - 1].id;

            // Create second task at x=600, y=300
            app.addRootTaskAtPosition(600, 300);
            const task2Id = app.tasks[app.tasks.length - 1].id;

            return { task1Id, task2Id };
        });

        console.log(`Task 1 ID: ${task1Id}, Task 2 ID: ${task2Id}`);

        // Get task coordinates BEFORE linking
        const tasksBefore = await page.evaluate(() => {
            return app.tasks.map(t => ({
                id: t.id,
                title: t.title,
                x: t.x,
                y: t.y,
                mainParent: t.mainParent
            }));
        });
        console.log('\n=== Tasks BEFORE linking ===');
        console.log(JSON.stringify(tasksBefore, null, 2));

        // Now try to reparent task1 to task2 (make task1 a child of task2)
        console.log('\n=== Calling reparentTask ===');
        console.log(`reparentTask({ taskId: ${task1Id}, newParentId: ${task2Id} })`);

        await page.evaluate((ids) => {
            app.reparentTask({ taskId: ids.task1Id, newParentId: ids.task2Id });
        }, { task1Id, task2Id });

        // Wait for any async operations
        await page.waitForTimeout(500);

        // Get task coordinates AFTER linking
        const tasksAfter = await page.evaluate(() => {
            return app.tasks.map(t => ({
                id: t.id,
                title: t.title,
                x: t.x,
                y: t.y,
                mainParent: t.mainParent
            }));
        });
        console.log('\n=== Tasks AFTER linking ===');
        console.log(JSON.stringify(tasksAfter, null, 2));

        // Check for NaN in console messages
        console.log('\n=== All Console Messages ===');
        consoleMessages.forEach((msg, i) => {
            console.log(`${i + 1}. ${msg}`);
        });

        const nanMessages = consoleMessages.filter(msg =>
            msg.includes('NaN') || msg.includes('[REPARENT]') || msg.includes('[RENDER]')
        );

        console.log('\n=== NaN/Diagnostic Messages ===');
        if (nanMessages.length > 0) {
            nanMessages.forEach(msg => console.log(`  - ${msg}`));
        } else {
            console.log('No NaN or diagnostic messages found');
        }

        // Check if any task has NaN coordinates
        const hasNaNCoordinates = tasksAfter.some(t =>
            !isFinite(t.x) || !isFinite(t.y) || isNaN(t.x) || isNaN(t.y)
        );

        if (hasNaNCoordinates) {
            console.error('\n❌ TEST FAILED: Tasks have NaN coordinates after linking!');
            const nanTasks = tasksAfter.filter(t => !isFinite(t.x) || !isFinite(t.y));
            console.error('Tasks with NaN:', JSON.stringify(nanTasks, null, 2));
            throw new Error('NaN coordinates detected after reparenting');
        }

        // Check if NaN appeared in console
        const hasNaNInConsole = consoleMessages.some(msg =>
            msg.toLowerCase().includes('nan') && !msg.includes('isFinite')
        );

        if (hasNaNInConsole) {
            console.error('\n❌ TEST FAILED: NaN errors in console!');
            throw new Error('NaN errors detected in console during reparenting');
        }

        console.log('\n✅ TEST PASSED: No NaN errors detected');
    });
});
