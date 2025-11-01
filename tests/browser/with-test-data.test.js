/**
 * Browser Tests - With Pre-loaded Test Data
 *
 * Tests the app with a pre-loaded task graph in localStorage
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlPath = path.resolve(__dirname, '../../dist/task-tree.html');

// Sample test data - a simple task graph
const testData = {
    tasks: [
        {
            id: 0,
            title: 'Project Root',
            x: 500,
            y: 100,
            mainParent: null,
            children: [1, 2],
            dependencies: [],
            status: 'pending',
            currentlyWorking: false,
            hidden: false,
        },
        {
            id: 1,
            title: 'Backend API',
            x: 300,
            y: 300,
            mainParent: 0,
            children: [3],
            dependencies: [],
            status: 'pending',
            currentlyWorking: true,
            hidden: false,
        },
        {
            id: 2,
            title: 'Frontend UI',
            x: 700,
            y: 300,
            mainParent: 0,
            children: [],
            dependencies: [1],  // Depends on Backend API
            status: 'pending',
            currentlyWorking: false,
            hidden: false,
        },
        {
            id: 3,
            title: 'Database Schema',
            x: 300,
            y: 500,
            mainParent: 1,
            children: [],
            dependencies: [],
            status: 'done',
            currentlyWorking: false,
            hidden: false,
        },
    ],
    taskIdCounter: 4,
    workingTasksByRoot: {},
    darkMode: false,
    zoomLevel: 1,
    viewBoxX: 0,
    viewBoxY: 0,
    homes: [],
    homeIdCounter: 1,
    undoStack: [],
    redoStack: []
};

test.describe('Application with Test Data', () => {
    test.beforeEach(async ({ page }) => {
        // Set up context with localStorage BEFORE navigating
        await page.goto(`file://${htmlPath}`);

        // Inject test data into localStorage with correct key
        await page.evaluate((data) => {
            localStorage.setItem('taskTree', JSON.stringify(data));
        }, testData);

        // Reload the page to load the data
        await page.reload();

        // Wait for app to initialize
        await page.waitForLoadState('domcontentloaded');
        await page.waitForFunction(() => typeof app !== 'undefined', { timeout: 5000 });
    });

    test('loads with pre-populated task graph', async ({ page }) => {
        // Wait for app to initialize
        await page.waitForFunction(() => typeof app !== 'undefined' && app.tasks.length > 0);

        const result = await page.evaluate(() => {
            return {
                taskCount: app.tasks.length,
                firstTask: app.tasks[0],
                workingTask: app.tasks.find(t => t.currentlyWorking),
            };
        });

        expect(result.taskCount).toBe(4);
        expect(result.firstTask.title).toBe('Project Root');
        expect(result.workingTask.title).toBe('Backend API');
    });

    test('renders dependency links', async ({ page }) => {
        await page.waitForFunction(() => typeof app !== 'undefined');

        // Check that dependency links are rendered
        const linkCount = await page.evaluate(() => {
            const links = document.querySelectorAll('.link.dependency');
            return links.length;
        });

        expect(linkCount).toBeGreaterThan(0);
    });
});
