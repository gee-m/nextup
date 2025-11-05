/**
 * Smoke Tests - Basic sanity checks
 *
 * These tests verify that the build system and basic structure work.
 */

import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Build System Smoke Tests', () => {
    test('dist/task-tree.html exists after build', () => {
        const distFile = path.join(__dirname, '..', 'dist', 'task-tree.html');
        expect(fs.existsSync(distFile)).toBe(true);
    });

    test('dist/task-tree.html is valid HTML', () => {
        const distFile = path.join(__dirname, '..', 'dist', 'task-tree.html');
        const html = fs.readFileSync(distFile, 'utf8');

        // Basic HTML structure checks
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<html');
        expect(html).toContain('</html>');
        expect(html).toContain('<body>');
        expect(html).toContain('</body>');
    });

    test('dist/task-tree.html contains injected CSS', () => {
        const distFile = path.join(__dirname, '..', 'dist', 'task-tree.html');
        const html = fs.readFileSync(distFile, 'utf8');

        expect(html).toContain('<style>');
        expect(html).toContain('</style>');
        // Check for some CSS we know should be there
        expect(html).toContain('.task-node');
        expect(html).toContain('#controls');
    });

    test('dist/task-tree.html contains injected JavaScript', () => {
        const distFile = path.join(__dirname, '..', 'dist', 'task-tree.html');
        const html = fs.readFileSync(distFile, 'utf8');

        expect(html).toContain('<script>');
        expect(html).toContain('</script>');
        // Check for app object
        expect(html).toContain('const app');
    });

    test('dist/task-tree.html size is reasonable', () => {
        const distFile = path.join(__dirname, '..', 'dist', 'task-tree.html');
        const stats = fs.statSync(distFile);
        const sizeKB = stats.size / 1024;

        // Should be between 100 KB and 550 KB (increased for timer feature)
        expect(sizeKB).toBeGreaterThan(100);
        expect(sizeKB).toBeLessThan(550);
    });
});

describe('Source File Structure', () => {
    test('all CSS files exist', () => {
        const cssFiles = [
            'base.css',
            'controls.css',
            'task-nodes.css',
            'links.css',
            'modals.css',
            'status-bar.css',
            'dark-mode.css'
        ];

        cssFiles.forEach(file => {
            const filePath = path.join(__dirname, '..', 'src', 'styles', file);
            expect(fs.existsSync(filePath), `${file} should exist`).toBe(true);
        });
    });

    test('core JS modules exist', () => {
        const jsFiles = [
            'state.js',
            'config.js',
            'app.js'
        ];

        jsFiles.forEach(file => {
            const filePath = path.join(__dirname, '..', 'src', 'js', file);
            expect(fs.existsSync(filePath), `${file} should exist`).toBe(true);
        });
    });

    test('all expected directories exist', () => {
        const dirs = [
            'src/js/utils',
            'src/js/data',
            'src/js/core',
            'src/js/rendering',
            'src/js/interactions',
            'src/js/ui',
            'src/js/navigation'
        ];

        dirs.forEach(dir => {
            const dirPath = path.join(__dirname, '..', dir);
            expect(fs.existsSync(dirPath), `${dir} should exist`).toBe(true);
        });
    });
});
