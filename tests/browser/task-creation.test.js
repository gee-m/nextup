import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.resolve(__dirname, '../../dist/task-tree.html');

test.describe('Task Creation and Selection', () => {
    let page;
    let consoleErrors = [];
    let consoleWarnings = [];

    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();

        // Capture console messages
        consoleErrors = [];
        consoleWarnings = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            } else if (msg.type() === 'warning') {
                consoleWarnings.push(msg.text());
            }
        });

        // Load the page
        await page.goto(`file://${htmlPath}`);
        await page.waitForLoadState('networkidle');

        // Wait for app initialization
        await page.waitForFunction(() => {
            return typeof app !== 'undefined' &&
                   typeof app.init === 'function' &&
                   typeof app.tasks !== 'undefined';
        });

        // Debug: check if init was called
        const initCalled = await page.evaluate(() => {
            // Check if event listeners are attached
            const svg = document.getElementById('canvas');
            const listeners = window.getEventListeners ? window.getEventListeners(svg) : null;
            return {
                tasksLength: app.tasks.length,
                editingTaskId: app.editingTaskId,
                hasSetupEventListeners: typeof app.setupEventListeners === 'function',
                hasListeners: listeners ? Object.keys(listeners) : 'getEventListeners not available'
            };
        });
        console.log('App initialization state:', initCalled);
    });

    test.afterEach(async () => {
        await page.close();
    });

    test('create task with Ctrl+double-click, enter text, press Enter, then click to select', async () => {
        // Step 1: Get SVG canvas
        const canvas = await page.locator('#canvas');
        await expect(canvas).toBeVisible();

        // Step 2: Get canvas bounding box for positioning
        const canvasBox = await canvas.boundingBox();

        // Calculate click position (center of canvas)
        const clickX = canvasBox.x + canvasBox.width / 2;
        const clickY = canvasBox.y + canvasBox.height / 2;

        console.log(`Clicking at position: (${clickX}, ${clickY})`);

        // Step 3: Add debug listener and trigger dblclick event
        const result = await page.evaluate(({x, y}) => {
            const canvas = document.getElementById('canvas');
            const rect = canvas.getBoundingClientRect();

            // Add debug listener to check if event fires
            let eventFired = false;
            const debugListener = () => { eventFired = true; };
            canvas.addEventListener('dblclick', debugListener, { once: true });

            const event = new MouseEvent('dblclick', {
                bubbles: true,
                cancelable: true,
                view: window,
                ctrlKey: true,
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2
            });
            canvas.dispatchEvent(event);

            return {
                eventFired,
                tasksAfter: app.tasks.length,
                editingTaskId: app.editingTaskId
            };
        }, { x: clickX, y: clickY });

        console.log('After dblclick:', result);

        // Wait longer for editing mode and render to complete
        await page.waitForTimeout(500);

        // Check what happened after the timeout
        const afterTimeout = await page.evaluate(() => {
            return {
                tasks: app.tasks,
                editingTaskId: app.editingTaskId,
                taskNodes: document.querySelectorAll('.task-node').length
            };
        });
        console.log('After timeout:', afterTimeout);
        console.log('Console errors:', consoleErrors);
        console.log('Console warnings:', consoleWarnings);

        // Debug: Try calling render manually and check calculateTaskDimensions
        const renderDebug = await page.evaluate(() => {
            const task = app.tasks[0];
            let dims = null;
            let renderError = null;
            try {
                dims = app.calculateTaskDimensions(task);
            } catch (e) {
                renderError = e.message;
            }
            return {
                hasCalculateTaskDimensions: typeof app.calculateTaskDimensions === 'function',
                dimensions: dims,
                error: renderError
            };
        });
        console.log('Render debug:', renderDebug);

        // Check if required DOM elements exist
        const domCheck = await page.evaluate(() => {
            return {
                hasCanvas: !!document.getElementById('canvas'),
                hasLinks: !!document.getElementById('links'),
                hasNodes: !!document.getElementById('nodes'),
                nodesChildren: document.getElementById('nodes')?.childElementCount || 0
            };
        });
        console.log('DOM check:', domCheck);

        // Step 4: Check if textarea appeared (editing mode)
        const textarea = await page.locator('#edit-input');
        await expect(textarea).toBeVisible({ timeout: 2000 });
        console.log('✓ Textarea appeared - editing mode active');

        // Step 5: Type text into the textarea
        const taskText = 'Test Task Created via Playwright';
        await textarea.fill(taskText);
        console.log(`✓ Entered text: "${taskText}"`);

        // Verify text was entered
        const textareaValue = await textarea.inputValue();
        expect(textareaValue).toBe(taskText);

        // Step 6: Press Enter to save
        await textarea.press('Enter');
        console.log('✓ Pressed Enter to save');

        // Wait for textarea to disappear (editing finished)
        await expect(textarea).not.toBeVisible({ timeout: 2000 });
        console.log('✓ Textarea disappeared - editing finished');

        // Step 7: Wait for render to complete
        await page.waitForTimeout(200);

        // Step 8: Verify task was created in app.tasks
        const taskCount = await page.evaluate(() => app.tasks.length);
        expect(taskCount).toBe(1);
        console.log(`✓ Task created - total tasks: ${taskCount}`);

        // Step 9: Get the created task details
        const taskDetails = await page.evaluate(() => {
            const task = app.tasks[0];
            return {
                id: task.id,
                title: task.title,
                x: task.x,
                y: task.y
            };
        });

        console.log(`✓ Task details:`, taskDetails);
        expect(taskDetails.title).toBe(taskText);

        // Step 10: Find the task node in the DOM
        const taskNode = await page.locator(`.task-node[data-id="${taskDetails.id}"]`);
        await expect(taskNode).toBeVisible({ timeout: 2000 });
        console.log('✓ Task node visible in DOM');

        // Step 11: Get the task node's bounding box
        const taskNodeBox = await taskNode.boundingBox();
        expect(taskNodeBox).not.toBeNull();
        console.log(`✓ Task node position: (${taskNodeBox.x}, ${taskNodeBox.y}), size: ${taskNodeBox.width}x${taskNodeBox.height}`);

        // Step 12: Click on the task node to select it
        const nodeClickX = taskNodeBox.x + taskNodeBox.width / 2;
        const nodeClickY = taskNodeBox.y + taskNodeBox.height / 2;

        console.log(`Clicking node at: (${nodeClickX}, ${nodeClickY})`);
        await page.mouse.click(nodeClickX, nodeClickY);

        // Wait for selection to process
        await page.waitForTimeout(100);

        // Step 13: Verify the task is selected
        const isSelected = await page.evaluate((taskId) => {
            return app.selectedTaskIds.has(taskId);
        }, taskDetails.id);

        expect(isSelected).toBe(true);
        console.log('✓ Task is selected');

        // Step 14: Verify the node has selected styling
        const hasSelectedClass = await taskNode.evaluate(node => {
            return node.classList.contains('selected') ||
                   node.querySelector('rect.selected') !== null ||
                   node.querySelector('rect[stroke="#007bff"]') !== null;
        });

        console.log(`Selected class present: ${hasSelectedClass}`);

        // Step 15: Check for any console errors
        if (consoleErrors.length > 0) {
            console.error('Console errors detected:', consoleErrors);
        }
        expect(consoleErrors).toHaveLength(0);

        // Step 16: Take a screenshot for debugging
        await page.screenshot({
            path: 'tests/screenshots/task-creation-selection.png',
            fullPage: true
        });
        console.log('✓ Screenshot saved to tests/screenshots/task-creation-selection.png');
    });

    test('verify task node responds to hover', async () => {
        // Create a task first
        const canvas = await page.locator('#canvas');
        const canvasBox = await canvas.boundingBox();
        const clickX = canvasBox.x + canvasBox.width / 2;
        const clickY = canvasBox.y + canvasBox.height / 2;

        // Trigger dblclick event with ctrlKey
        await page.evaluate(() => {
            const canvas = document.getElementById('canvas');
            const rect = canvas.getBoundingClientRect();
            const event = new MouseEvent('dblclick', {
                bubbles: true,
                cancelable: true,
                view: window,
                ctrlKey: true,
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2
            });
            canvas.dispatchEvent(event);
        });

        await page.waitForTimeout(100);
        const textarea = await page.locator('#edit-input');
        await textarea.fill('Hover Test Task');
        await textarea.press('Enter');
        await page.waitForTimeout(200);

        // Get task details
        const taskId = await page.evaluate(() => app.tasks[0].id);
        const taskNode = await page.locator(`.task-node[data-id="${taskId}"]`);
        const taskNodeBox = await taskNode.boundingBox();

        // Hover over the node
        await page.mouse.move(
            taskNodeBox.x + taskNodeBox.width / 2,
            taskNodeBox.y + taskNodeBox.height / 2
        );

        await page.waitForTimeout(100);

        // Check if hoveredTaskId is set
        const hoveredId = await page.evaluate(() => app.hoveredTaskId);
        console.log(`Hovered task ID: ${hoveredId}, Expected: ${taskId}`);

        // Note: hoveredTaskId might not be set if mouse event isn't bound
        // This test will help diagnose the issue
    });

    test('verify click event reaches the task node', async () => {
        // Create a task
        const canvas = await page.locator('#canvas');
        const canvasBox = await canvas.boundingBox();
        const clickX = canvasBox.x + canvasBox.width / 2;
        const clickY = canvasBox.y + canvasBox.height / 2;

        // Trigger dblclick event with ctrlKey
        await page.evaluate(() => {
            const canvas = document.getElementById('canvas');
            const rect = canvas.getBoundingClientRect();
            const event = new MouseEvent('dblclick', {
                bubbles: true,
                cancelable: true,
                view: window,
                ctrlKey: true,
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2
            });
            canvas.dispatchEvent(event);
        });

        await page.waitForTimeout(100);
        const textarea = await page.locator('#edit-input');
        await textarea.fill('Click Test Task');
        await textarea.press('Enter');
        await page.waitForTimeout(200);

        // Add a click event listener to track clicks
        await page.evaluate(() => {
            window.clickEvents = [];
            document.getElementById('canvas').addEventListener('click', (e) => {
                window.clickEvents.push({
                    target: e.target.tagName,
                    targetClass: e.target.getAttribute('class'),
                    targetId: e.target.getAttribute('data-id')
                });
            }, true); // Use capture phase
        });

        // Get task node and click it
        const taskId = await page.evaluate(() => app.tasks[0].id);
        const taskNode = await page.locator(`.task-node[data-id="${taskId}"]`);
        const taskNodeBox = await taskNode.boundingBox();

        await page.mouse.click(
            taskNodeBox.x + taskNodeBox.width / 2,
            taskNodeBox.y + taskNodeBox.height / 2
        );

        await page.waitForTimeout(100);

        // Check what was clicked
        const clickEvents = await page.evaluate(() => window.clickEvents);
        console.log('Click events captured:', JSON.stringify(clickEvents, null, 2));

        expect(clickEvents.length).toBeGreaterThan(0);
    });
});
