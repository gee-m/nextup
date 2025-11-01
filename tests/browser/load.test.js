/**
 * Browser Tests - Application Loading
 *
 * Tests that the built HTML file loads correctly in a real browser environment.
 * Catches runtime errors that syntax validation alone cannot detect.
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlPath = path.resolve(__dirname, '../../dist/task-tree.html');

test.describe('Application Loading', () => {
    let consoleErrors = [];
    let consoleWarnings = [];

    test.beforeEach(({ page }) => {
        // Capture console errors and warnings
        consoleErrors = [];
        consoleWarnings = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            } else if (msg.type() === 'warning') {
                consoleWarnings.push(msg.text());
            }
        });

        // Capture page errors (uncaught exceptions)
        page.on('pageerror', error => {
            consoleErrors.push(`Uncaught exception: ${error.message}`);
        });
    });

    test('loads without JavaScript errors', async ({ page }) => {
        // Load the HTML file
        await page.goto(`file://${htmlPath}`);

        // Wait for app to initialize
        await page.waitForFunction(() => {
            return typeof app !== 'undefined' && typeof app.init === 'function';
        }, { timeout: 5000 });

        // Check for console errors
        if (consoleErrors.length > 0) {
            console.error('Console errors detected:');
            consoleErrors.forEach(err => console.error(`  - ${err}`));
        }

        expect(consoleErrors, `Found ${consoleErrors.length} console errors`).toHaveLength(0);
    });

    test('app object is properly initialized', async ({ page }) => {
        await page.goto(`file://${htmlPath}`);

        // Wait for DOMContentLoaded
        await page.waitForLoadState('domcontentloaded');

        // Check that app object exists and has required methods
        const appCheck = await page.evaluate(() => {
            return {
                exists: typeof app !== 'undefined',
                hasInit: typeof app.init === 'function',
                hasRender: typeof app.render === 'function',
                hasTasks: Array.isArray(app.tasks),
                hasRepairWorkingTasks: typeof app.repairWorkingTasks === 'function',
                hasSaveToStorage: typeof app.saveToStorage === 'function',
            };
        });

        expect(appCheck.exists, 'app object should exist').toBe(true);
        expect(appCheck.hasInit, 'app.init should be a function').toBe(true);
        expect(appCheck.hasRender, 'app.render should be a function').toBe(true);
        expect(appCheck.hasTasks, 'app.tasks should be an array').toBe(true);
        expect(appCheck.hasRepairWorkingTasks, 'app.repairWorkingTasks should be a function').toBe(true);
        expect(appCheck.hasSaveToStorage, 'app.saveToStorage should be a function').toBe(true);
    });

    test('app initializes without errors', async ({ page }) => {
        await page.goto(`file://${htmlPath}`);

        // Wait for app to finish initializing
        await page.waitForFunction(() => {
            const svg = document.querySelector('#canvas');
            return svg && svg.childElementCount > 0; // SVG should have been rendered
        }, { timeout: 5000 });

        // Check that no errors occurred during initialization
        expect(consoleErrors, 'Should have no errors during initialization').toHaveLength(0);
    });

    test('critical DOM elements exist', async ({ page }) => {
        await page.goto(`file://${htmlPath}`);

        // Check for critical elements
        const elements = await page.evaluate(() => {
            return {
                canvas: !!document.querySelector('#canvas'),
                controls: !!document.querySelector('#controls'),
                statusBar: !!document.querySelector('#status-bar'),
            };
        });

        expect(elements.canvas, 'SVG canvas should exist').toBe(true);
        expect(elements.controls, 'Top controls should exist').toBe(true);
        expect(elements.statusBar, 'Status bar should exist').toBe(true);
    });

    test('can create a task programmatically', async ({ page }) => {
        await page.goto(`file://${htmlPath}`);

        // Wait for app to be ready
        await page.waitForFunction(() => typeof app !== 'undefined' && typeof app.addRootTaskAtPosition === 'function');

        // Create a task
        const result = await page.evaluate(() => {
            const initialCount = app.tasks.length;
            app.addRootTaskAtPosition(100, 100);
            // Get the task that was just added
            const lastTask = app.tasks[app.tasks.length - 1];
            return {
                success: app.tasks.length === initialCount + 1,
                taskCount: app.tasks.length,
                lastTask: lastTask,
            };
        });

        expect(result.success, 'Should add one task').toBe(true);
        expect(result.lastTask.title, 'Task should exist (empty title is valid)').toBeDefined();
        expect(result.lastTask.id, 'Task should have an ID').toBeGreaterThanOrEqual(0);
        expect(consoleErrors, 'Should have no errors when creating task').toHaveLength(0);
    });
});
