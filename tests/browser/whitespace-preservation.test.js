import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.resolve(__dirname, '../../dist/task-tree.html');

test.describe('Whitespace Preservation', () => {
    let page;

    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();
        await page.goto(`file://${htmlPath}`);
        await page.waitForLoadState('networkidle');

        // Wait for app initialization
        await page.waitForFunction(() => {
            return typeof app !== 'undefined' &&
                   typeof app.tasks !== 'undefined';
        });
    });

    test.afterEach(async () => {
        await page.close();
    });

    test('preserves tabs in task titles', async () => {
        // Create task with tabs
        // NOTE: Tabs are stored as \t in the data model,
        // but converted to spaces for SVG display (SVG doesn't render tabs)
        const taskWithTabs = await page.evaluate(() => {
            app.addRootTaskAtPosition(300, 300);
            const task = app.tasks[0];

            // Edit with text containing tabs
            app.editingTaskId = task.id;
            const textWithTabs = "Code:\tfunction()\t{\n\treturn true;\n}";

            // Simulate finish editing with tabs
            task.title = textWithTabs;
            app.editingTaskId = null;
            app.render();

            return {
                title: task.title,
                hasTabs: task.title.includes('\t'),
                tabCount: (task.title.match(/\t/g) || []).length
            };
        });

        expect(taskWithTabs.hasTabs).toBe(true);
        expect(taskWithTabs.tabCount).toBeGreaterThan(0);
        expect(taskWithTabs.title).toContain('\t');
    });

    test('preserves multiple consecutive spaces', async () => {
        // Create task with multiple spaces
        const taskWithSpaces = await page.evaluate(() => {
            app.addRootTaskAtPosition(300, 300);
            const task = app.tasks[0];

            // Text with multiple spaces
            const textWithSpaces = "word1    word2     word3";
            task.title = textWithSpaces;
            app.render();

            return {
                title: task.title,
                originalLength: textWithSpaces.length,
                actualLength: task.title.length
            };
        });

        // Verify multiple spaces are preserved (not collapsed)
        expect(taskWithSpaces.actualLength).toBe(taskWithSpaces.originalLength);
        expect(taskWithSpaces.title).toContain('    '); // 4 spaces
        expect(taskWithSpaces.title).toContain('     '); // 5 spaces
    });

    test('preserves leading whitespace', async () => {
        // Create task with leading spaces and tabs
        const taskWithLeading = await page.evaluate(() => {
            app.addRootTaskAtPosition(300, 300);
            const task = app.tasks[0];

            const textWithLeading = "    Indented text";
            task.title = textWithLeading;
            app.render();

            return {
                title: task.title,
                startsWithSpaces: task.title.startsWith('    '),
                firstChar: task.title.charCodeAt(0)
            };
        });

        expect(taskWithLeading.startsWithSpaces).toBe(true);
        expect(taskWithLeading.firstChar).toBe(32); // Space character
        expect(taskWithLeading.title.indexOf('Indented')).toBe(4); // After 4 spaces
    });

    test('preserves trailing whitespace', async () => {
        // Create task with trailing spaces
        const taskWithTrailing = await page.evaluate(() => {
            app.addRootTaskAtPosition(300, 300);
            const task = app.tasks[0];

            const textWithTrailing = "Text with trailing spaces    ";
            task.title = textWithTrailing;
            app.render();

            return {
                title: task.title,
                endsWithSpaces: task.title.endsWith('    '),
                length: task.title.length,
                expectedLength: textWithTrailing.length
            };
        });

        expect(taskWithTrailing.endsWithSpaces).toBe(true);
        expect(taskWithTrailing.length).toBe(taskWithTrailing.expectedLength);
    });

    test('preserves mixed whitespace (tabs, spaces, newlines)', async () => {
        // Create task with all types of whitespace
        const taskWithMixed = await page.evaluate(() => {
            app.addRootTaskAtPosition(300, 300);
            const task = app.tasks[0];

            const complexText = "  Start\n\tIndented line\n  Multiple  spaces  here\nEnd  ";
            task.title = complexText;
            app.render();

            return {
                title: task.title,
                hasTabs: task.title.includes('\t'),
                hasNewlines: task.title.includes('\n'),
                hasMultipleSpaces: task.title.includes('  '),
                originalLength: complexText.length,
                actualLength: task.title.length
            };
        });

        expect(taskWithMixed.hasTabs).toBe(true);
        expect(taskWithMixed.hasNewlines).toBe(true);
        expect(taskWithMixed.hasMultipleSpaces).toBe(true);
        expect(taskWithMixed.actualLength).toBe(taskWithMixed.originalLength);
    });

    test('SVG rendering preserves whitespace with xml:space attribute', async () => {
        // Verify SVG elements have xml:space="preserve"
        const svgAttributes = await page.evaluate(() => {
            app.addRootTaskAtPosition(300, 300);
            const task = app.tasks[0];
            task.title = "Text\twith\ttabs";
            app.render();

            // Find the SVG text element for this task
            const taskNode = document.querySelector(`.task-node[data-id="${task.id}"]`);
            const textElement = taskNode.querySelector('text');
            const tspanElements = textElement.querySelectorAll('tspan');

            return {
                textHasXmlSpace: textElement.getAttribute('xml:space') === 'preserve',
                tspanHasXmlSpace: tspanElements.length > 0 ?
                    tspanElements[0].getAttribute('xml:space') === 'preserve' : false,
                textContent: textElement.textContent,
                hasTabs: textElement.textContent.includes('\t')
            };
        });

        expect(svgAttributes.textHasXmlSpace).toBe(true);
        expect(svgAttributes.tspanHasXmlSpace).toBe(true);
    });

    test('edit and save preserves whitespace through full workflow', async () => {
        // Full integration test: create, edit, save, verify
        const result = await page.evaluate(async () => {
            // Create task
            app.addRootTaskAtPosition(300, 300);
            const task = app.tasks[0];

            // Start editing
            app.editingTaskId = task.id;
            app.render();

            // Simulate typing text with various whitespace
            const input = document.getElementById('edit-input');
            if (!input) return { error: 'No edit input found' };

            const testText = "  Code:\n\tif (x > 5)  {\n\t\treturn true;\n\t}\n  ";
            input.value = testText;

            // Finish editing (trigger save)
            app.finishEditing(true);

            // Get the saved task
            const savedTask = app.tasks.find(t => t.id === task.id);

            return {
                savedTitle: savedTask.title,
                hasLeadingSpaces: savedTask.title.startsWith('  '),
                hasTrailingSpaces: savedTask.title.endsWith('  '),
                hasTabs: savedTask.title.includes('\t'),
                hasDoubleSpaces: savedTask.title.includes('  '),
                originalLength: testText.length,
                savedLength: savedTask.title.length
            };
        });

        expect(result.hasLeadingSpaces).toBe(true);
        expect(result.hasTrailingSpaces).toBe(true);
        expect(result.hasTabs).toBe(true);
        expect(result.hasDoubleSpaces).toBe(true);
        expect(result.savedLength).toBe(result.originalLength);
    });

    test('empty string vs whitespace-only string', async () => {
        // Verify that empty string becomes "Untitled" but whitespace-only does not
        const result = await page.evaluate(() => {
            // Test 1: Truly empty string
            app.addRootTaskAtPosition(200, 300);
            const task1 = app.tasks[0];
            app.editingTaskId = task1.id;
            app.render();

            const input1 = document.getElementById('edit-input');
            input1.value = '';
            app.finishEditing(true);

            // Test 2: Whitespace-only string
            app.addRootTaskAtPosition(400, 300);
            const task2 = app.tasks[1];
            app.editingTaskId = task2.id;
            app.render();

            const input2 = document.getElementById('edit-input');
            input2.value = '   '; // Only spaces
            app.finishEditing(true);

            return {
                emptyBecameUntitled: task1.title === 'Untitled',
                whitespacePreserved: task2.title === '   ',
                task2Length: task2.title.length
            };
        });

        expect(result.emptyBecameUntitled).toBe(true);
        expect(result.whitespacePreserved).toBe(true);
        expect(result.task2Length).toBe(3);
    });
});
