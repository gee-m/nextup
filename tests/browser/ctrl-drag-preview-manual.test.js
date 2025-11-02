/**
 * Manual visual verification test for Ctrl+drag create child preview
 *
 * This test directly manipulates the DOM to show the preview state
 * and captures screenshots for manual verification
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlPath = path.resolve(__dirname, '../../dist/task-tree.html');

test.describe('Ctrl+drag preview manual verification', () => {
    test('capture preview state for visual verification', async ({ page }) => {
        await page.goto(`file://${htmlPath}`);
        await page.waitForLoadState('networkidle');

        await page.waitForFunction(() => {
            return typeof app !== 'undefined' &&
                   typeof app.init === 'function' &&
                   typeof app.tasks !== 'undefined';
        });

        // Create task and manually trigger preview state
        await page.evaluate(() => {
            // Create source task
            app.addRootTaskAtPosition(200, 300);

            // Manually create the preview elements (simulating drag state)
            const sourceTask = app.tasks[0];
            const previewX = 600;
            const previewY = 400;

            // Calculate preview dimensions - MUST match actual created task (empty title)
            const previewDims = app.calculateTaskDimensions({ title: '' });

            // Create temp line
            const tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tempLine.setAttribute('stroke', '#4CAF50');
            tempLine.setAttribute('stroke-width', '3');
            tempLine.setAttribute('stroke-dasharray', '8,4');
            tempLine.setAttribute('marker-end', 'url(#arrowhead)');
            tempLine.setAttribute('pointer-events', 'none');

            // Calculate arrow endpoint at preview node edge (using getLineEndAtRectEdge)
            const arrowEnd = app.getLineEndAtRectEdge(
                sourceTask.x, sourceTask.y,
                previewX, previewY,
                previewDims.width,
                previewDims.height
            );

            tempLine.setAttribute('x1', sourceTask.x);
            tempLine.setAttribute('y1', sourceTask.y);
            tempLine.setAttribute('x2', arrowEnd.x);
            tempLine.setAttribute('y2', arrowEnd.y);

            // Create preview ghost node
            const ghostNode = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            ghostNode.id = 'preview-ghost-node';
            ghostNode.setAttribute('x', previewX - previewDims.width / 2);
            ghostNode.setAttribute('y', previewY - previewDims.height / 2);
            ghostNode.setAttribute('width', previewDims.width);
            ghostNode.setAttribute('height', previewDims.height);
            ghostNode.setAttribute('rx', '8');
            ghostNode.setAttribute('fill', 'rgba(255, 255, 255, 0.3)');
            ghostNode.setAttribute('stroke', '#2196f3');
            ghostNode.setAttribute('stroke-width', '2');
            ghostNode.setAttribute('stroke-dasharray', '5,5');
            ghostNode.setAttribute('pointer-events', 'none');

            // Add to canvas
            const canvas = document.getElementById('canvas');
            canvas.appendChild(tempLine);
            canvas.appendChild(ghostNode);

            // Trigger render to show task
            app.render();
        });

        // Wait a moment for render
        await page.waitForTimeout(300);

        // Capture screenshot
        await page.screenshot({
            path: 'tests/screenshots/ctrl-drag-preview.png',
            fullPage: true
        });

        console.log('✅ Screenshot saved: tests/screenshots/ctrl-drag-preview.png');

        // Get absolute path for file:// URL
        const screenshotPath = path.resolve('tests/screenshots/ctrl-drag-preview.png');
        console.log(`\n📸 View screenshot at: file://${screenshotPath}\n`);
    });

    test('capture arrow-to-edge detail for verification', async ({ page }) => {
        await page.goto(`file://${htmlPath}`);
        await page.waitForLoadState('networkidle');

        await page.waitForFunction(() => {
            return typeof app !== 'undefined' &&
                   typeof app.init === 'function' &&
                   typeof app.tasks !== 'undefined';
        });

        // Create task and preview with arrow pointing far away
        await page.evaluate(() => {
            app.addRootTaskAtPosition(200, 300);

            const sourceTask = app.tasks[0];
            const previewX = 700;
            const previewY = 500;

            const previewDims = app.calculateTaskDimensions({ title: '' });

            const arrowEnd = app.getLineEndAtRectEdge(
                sourceTask.x, sourceTask.y,
                previewX, previewY,
                previewDims.width,
                previewDims.height
            );

            // Create temp line
            const tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tempLine.setAttribute('stroke', '#4CAF50');
            tempLine.setAttribute('stroke-width', '3');
            tempLine.setAttribute('stroke-dasharray', '8,4');
            tempLine.setAttribute('marker-end', 'url(#arrowhead)');
            tempLine.setAttribute('x1', sourceTask.x);
            tempLine.setAttribute('y1', sourceTask.y);
            tempLine.setAttribute('x2', arrowEnd.x);
            tempLine.setAttribute('y2', arrowEnd.y);

            // Create ghost
            const ghostNode = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            ghostNode.id = 'preview-ghost-node';
            ghostNode.setAttribute('x', previewX - previewDims.width / 2);
            ghostNode.setAttribute('y', previewY - previewDims.height / 2);
            ghostNode.setAttribute('width', previewDims.width);
            ghostNode.setAttribute('height', previewDims.height);
            ghostNode.setAttribute('rx', '8');
            ghostNode.setAttribute('fill', 'rgba(255, 255, 255, 0.3)');
            ghostNode.setAttribute('stroke', '#2196f3');
            ghostNode.setAttribute('stroke-width', '2');
            ghostNode.setAttribute('stroke-dasharray', '5,5');

            document.getElementById('canvas').appendChild(tempLine);
            document.getElementById('canvas').appendChild(ghostNode);

            app.render();
        });

        await page.waitForTimeout(300);

        // Zoom in on the preview node to see arrow endpoint detail
        await page.evaluate(() => {
            app.zoomLevel = 2.0;
            app.viewBox.x = 500;
            app.viewBox.y = 300;
            app.render();
        });

        await page.screenshot({
            path: 'tests/screenshots/ctrl-drag-arrow-to-edge-detail.png',
            fullPage: true
        });

        console.log('✅ Screenshot saved: tests/screenshots/ctrl-drag-arrow-to-edge-detail.png');

        const screenshotPath = path.resolve('tests/screenshots/ctrl-drag-arrow-to-edge-detail.png');
        console.log(`\n📸 View screenshot at: file://${screenshotPath}\n`);
    });
});
