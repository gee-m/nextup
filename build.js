#!/usr/bin/env node

/**
 * Smart Build System for Task Tree
 *
 * FEATURES:
 * - Auto-discovers CSS and JS files (no manual lists!)
 * - Sorts JS files by dependency order using @order headers
 * - Validates build output
 * - Defensive: add new files without editing this script
 *
 * FILE HEADER MARKERS:
 * - // @order: <number>  - Load priority (lower = earlier, default: 50)
 * - // @category: <name> - Logical grouping (for debugging)
 *
 * USAGE:
 *   node build.js           # Build dist/task-tree.html
 *   node build.js --watch   # Watch mode (future)
 *   node build.js --validate # Validate only, don't build
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
    SRC_DIR: './src',
    DIST_DIR: './dist',
    OUTPUT_FILE: 'task-tree.html',

    // Directories to scan
    STYLES_DIR: './src/styles',
    JS_DIR: './src/js',

    // HTML template
    TEMPLATE: './src/index.html',

    // Injection markers in template
    CSS_MARKER: '<!-- CSS_INJECT -->',
    JS_MARKER: '<!-- JS_INJECT -->',

    // Default order for files without @order header
    DEFAULT_ORDER: 50,

    // Validation rules
    VALIDATE: {
        checkForConsoleLog: false,  // Set true to warn on console.log
        checkForDebugger: true,      // Warn on debugger statements
        minFileSize: 100,            // Warn if file < 100 bytes
    }
};

// ============================================================
// UTILITIES
// ============================================================

/**
 * Recursively find all files matching extension in directory
 */
function findFiles(dir, ext) {
    const results = [];

    function scan(currentDir) {
        if (!fs.existsSync(currentDir)) return;

        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);

            if (entry.isDirectory()) {
                scan(fullPath);
            } else if (entry.isFile() && entry.name.endsWith(ext)) {
                results.push(fullPath);
            }
        }
    }

    scan(dir);
    return results;
}

/**
 * Extract metadata from file header comments
 * Returns: { order: number, category: string }
 * Supports both JSDoc (/** * @order 16) and inline (// @order: 16) styles
 */
function extractFileMetadata(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').slice(0, 20); // Only check first 20 lines

    let order = CONFIG.DEFAULT_ORDER;
    let category = path.dirname(filePath).split('/').pop() || 'misc';

    for (const line of lines) {
        // Match both styles:
        // JSDoc style: * @order 16
        // Inline style: // @order: 16
        const orderMatch = line.match(/[@/]\s*@?order:?\s*(\d+)/i);
        if (orderMatch) {
            order = parseInt(orderMatch[1], 10);
        }

        // Match both category styles
        const categoryMatch = line.match(/[@/]\s*@?category:?\s*(\w+)/i);
        if (categoryMatch) {
            category = categoryMatch[1];
        }
    }

    return { order, category };
}

/**
 * Sort files by dependency order
 */
function sortByOrder(files) {
    const filesWithMeta = files.map(file => ({
        path: file,
        ...extractFileMetadata(file)
    }));

    // Sort by order (ascending), then by category, then by filename
    filesWithMeta.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.path.localeCompare(b.path);
    });

    return filesWithMeta;
}

/**
 * Validate file content
 */
function validateFile(filePath, content) {
    const warnings = [];
    const fileName = path.basename(filePath);

    // Check file size
    if (content.length < CONFIG.VALIDATE.minFileSize) {
        warnings.push(`⚠️  ${fileName}: File is very small (${content.length} bytes)`);
    }

    // Check for debugger statements
    if (CONFIG.VALIDATE.checkForDebugger && content.includes('debugger')) {
        warnings.push(`⚠️  ${fileName}: Contains 'debugger' statement`);
    }

    // Check for console.log (optional)
    if (CONFIG.VALIDATE.checkForConsoleLog && content.match(/console\.log/)) {
        warnings.push(`ℹ️  ${fileName}: Contains console.log statements`);
    }

    return warnings;
}

// ============================================================
// BUILD FUNCTIONS
// ============================================================

/**
 * Collect and concatenate all CSS files
 */
function buildCSS() {
    console.log('\n📦 Collecting CSS files...');

    const cssFiles = findFiles(CONFIG.STYLES_DIR, '.css');

    if (cssFiles.length === 0) {
        console.warn('⚠️  No CSS files found in', CONFIG.STYLES_DIR);
        return '';
    }

    // Sort CSS files by order header
    const sortedFiles = sortByOrder(cssFiles);

    let combinedCSS = '';
    const warnings = [];

    for (const { path: file, order, category } of sortedFiles) {
        const fileName = path.basename(file);
        const content = fs.readFileSync(file, 'utf8');

        console.log(`  ✓ ${fileName.padEnd(30)} [order: ${order}, category: ${category}]`);

        // Add section header comment
        combinedCSS += `\n/* ============================================================\n`;
        combinedCSS += `   ${fileName.toUpperCase()} (Category: ${category})\n`;
        combinedCSS += `   ============================================================ */\n\n`;
        combinedCSS += content;
        combinedCSS += '\n\n';

        // Validate
        warnings.push(...validateFile(file, content));
    }

    console.log(`  📊 Total CSS files: ${cssFiles.length}`);

    // Show warnings
    if (warnings.length > 0) {
        console.log('\n⚠️  CSS Warnings:');
        warnings.forEach(w => console.log(`  ${w}`));
    }

    return combinedCSS;
}

/**
 * Transform ES6 module syntax to browser-compatible code
 * Converts: export const MixinName = { ... };
 * To: Object.assign(app, { ... });
 */
function transformModuleSyntax(content) {
    // Check if this file has an export statement
    const hasExport = /export\s+const\s+\w+\s*=\s*\{/.test(content);

    if (hasExport) {
        // Replace: export const SomeName = {
        // With: Object.assign(app, {
        content = content.replace(/export\s+const\s+\w+\s*=\s*\{/g, 'Object.assign(app, {');

        // Replace the closing }; of the main export object with });
        // Match }; followed by newlines and optional console.log or other statements
        // Use lookbehind to find the last closing brace of the object literal
        const lines = content.split('\n');
        let braceCount = 0;
        let exportStarted = false;
        let closeIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.includes('Object.assign(app, {')) {
                exportStarted = true;
                braceCount = 1; // Opening brace of Object.assign
            } else if (exportStarted) {
                // Count braces in this line
                for (const char of line) {
                    if (char === '{') braceCount++;
                    if (char === '}') braceCount--;

                    // When we close the Object.assign's opening brace
                    if (braceCount === 0) {
                        closeIndex = i;
                        break;
                    }
                }
                if (closeIndex >= 0) break;
            }
        }

        if (closeIndex >= 0) {
            // Replace }; with }); on the closing line
            lines[closeIndex] = lines[closeIndex].replace(/\};/, '});');
            content = lines.join('\n');
        }
    }

    // Remove any other standalone export statements
    content = content.replace(/^export\s+/gm, '');

    return content;
}

/**
 * Collect and concatenate all JavaScript files
 */
function buildJS() {
    console.log('\n📦 Collecting JavaScript files...');

    const jsFiles = findFiles(CONFIG.JS_DIR, '.js');

    if (jsFiles.length === 0) {
        console.warn('⚠️  No JS files found in', CONFIG.JS_DIR);
        return '';
    }

    // Sort JS files by order header
    const sortedFiles = sortByOrder(jsFiles);

    let combinedJS = '';
    const warnings = [];

    console.log('\n  Load Order:');
    for (const { path: file, order, category } of sortedFiles) {
        const fileName = path.basename(file);
        const relativePath = path.relative(CONFIG.JS_DIR, file);
        let content = fs.readFileSync(file, 'utf8');

        console.log(`  ${String(order).padStart(3)}. ${relativePath.padEnd(40)} [${category}]`);

        // Transform ES6 module syntax to browser-compatible code
        content = transformModuleSyntax(content);

        // Add section header comment
        combinedJS += `\n// ============================================================\n`;
        combinedJS += `// ${relativePath.toUpperCase()} (Order: ${order}, Category: ${category})\n`;
        combinedJS += `// ============================================================\n\n`;
        combinedJS += content;
        combinedJS += '\n\n';

        // Validate
        warnings.push(...validateFile(file, content));
    }

    console.log(`\n  📊 Total JS files: ${jsFiles.length}`);

    // Show warnings
    if (warnings.length > 0) {
        console.log('\n⚠️  JavaScript Warnings:');
        warnings.forEach(w => console.log(`  ${w}`));
    }

    return combinedJS;
}

/**
 * Validate JavaScript syntax using Node's VM module
 */
function validateJavaScriptSyntax(js) {
    console.log('\n🔍 Validating JavaScript syntax...');

    try {
        // Try to parse the JavaScript
        // Note: We wrap in an IIFE to avoid issues with top-level declarations
        new Function(js);
        console.log('  ✅ JavaScript syntax is valid');
        return true;
    } catch (error) {
        console.error('  ❌ JavaScript syntax error detected:');
        console.error(`     ${error.message}`);

        // Try to extract line number from error
        const match = error.message.match(/(\d+):(\d+)/);
        if (match) {
            const line = parseInt(match[1]);
            console.error(`     Problem around line ${line}`);
        }

        return false;
    }
}

/**
 * Build the final HTML file
 */
function build() {
    console.log('\n🏗️  Building Task Tree...');
    console.log('='.repeat(60));

    // Check template exists
    if (!fs.existsSync(CONFIG.TEMPLATE)) {
        console.error(`❌ Template not found: ${CONFIG.TEMPLATE}`);
        process.exit(1);
    }

    // Read template
    let template = fs.readFileSync(CONFIG.TEMPLATE, 'utf8');

    // Build CSS and JS
    const css = buildCSS();
    const js = buildJS();

    // Validate JavaScript syntax BEFORE injecting
    if (!validateJavaScriptSyntax(js)) {
        console.error('\n❌ Build aborted due to JavaScript syntax errors');
        console.error('   Fix the errors above and try again');
        process.exit(1);
    }

    // Inject into template
    console.log('\n🔧 Injecting assets into template...');

    if (!template.includes(CONFIG.CSS_MARKER)) {
        console.error(`❌ CSS marker not found in template: ${CONFIG.CSS_MARKER}`);
        process.exit(1);
    }

    if (!template.includes(CONFIG.JS_MARKER)) {
        console.error(`❌ JS marker not found in template: ${CONFIG.JS_MARKER}`);
        process.exit(1);
    }

    const cssBlock = `<style>\n${css}</style>`;
    const jsBlock = `<script>\n${js}\n\n// Initialize app on load\ndocument.addEventListener('DOMContentLoaded', () => {\n    if (typeof app !== 'undefined' && typeof app.init === 'function') {\n        app.init();\n    } else {\n        console.error('App initialization failed: app.init() not found');\n    }\n});\n</script>`;

    let output = template
        .replace(CONFIG.CSS_MARKER, cssBlock)
        .replace(CONFIG.JS_MARKER, jsBlock);

    // Ensure dist directory exists
    if (!fs.existsSync(CONFIG.DIST_DIR)) {
        fs.mkdirSync(CONFIG.DIST_DIR, { recursive: true });
    }

    // Write output
    const outputPath = path.join(CONFIG.DIST_DIR, CONFIG.OUTPUT_FILE);
    fs.writeFileSync(outputPath, output);

    // Stats
    const stats = fs.statSync(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const lines = output.split('\n').length;

    console.log('\n✅ Build complete!');
    console.log('='.repeat(60));
    console.log(`📄 Output: ${outputPath}`);
    console.log(`📊 Size: ${sizeKB} KB`);
    console.log(`📏 Lines: ${lines.toLocaleString()}`);
    console.log('\n💡 Tip: Open dist/task-tree.html in your browser to test');

    return outputPath;
}

/**
 * Validate the build without creating output
 */
function validate() {
    console.log('\n🔍 Validating project structure...');
    console.log('='.repeat(60));

    let hasErrors = false;

    // Check template
    if (!fs.existsSync(CONFIG.TEMPLATE)) {
        console.error(`❌ Template missing: ${CONFIG.TEMPLATE}`);
        hasErrors = true;
    }

    // Check CSS files
    const cssFiles = findFiles(CONFIG.STYLES_DIR, '.css');
    console.log(`\n📊 CSS Files: ${cssFiles.length}`);
    if (cssFiles.length === 0) {
        console.warn('⚠️  No CSS files found');
    }

    // Check JS files
    const jsFiles = findFiles(CONFIG.JS_DIR, '.js');
    console.log(`📊 JS Files: ${jsFiles.length}`);
    if (jsFiles.length === 0) {
        console.error('❌ No JavaScript files found');
        hasErrors = true;
    }

    // Check for required app.js
    const hasAppJs = jsFiles.some(f => f.includes('app.js'));
    if (!hasAppJs) {
        console.warn('⚠️  No app.js found - make sure you have a main entry point');
    }

    // Show file orders
    if (jsFiles.length > 0) {
        console.log('\n📋 JavaScript Load Order:');
        const sorted = sortByOrder(jsFiles);
        sorted.forEach(({ path: file, order, category }, i) => {
            const relativePath = path.relative(CONFIG.JS_DIR, file);
            console.log(`  ${String(i + 1).padStart(2)}. [${String(order).padStart(3)}] ${relativePath}`);
        });
    }

    console.log('\n' + '='.repeat(60));

    if (hasErrors) {
        console.error('❌ Validation failed');
        process.exit(1);
    } else {
        console.log('✅ Validation passed');
    }
}

// ============================================================
// MAIN
// ============================================================

function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Task Tree Build System

Usage:
  node build.js              Build the project
  node build.js --validate   Validate structure without building
  node build.js --help       Show this help

File Header Markers:
  // @order: <number>    Load order (lower = earlier, default: 50)
  // @category: <name>   Logical grouping

Example:
  // @order: 10
  // @category: core

  function myFunction() { ... }
        `);
        return;
    }

    if (args.includes('--validate')) {
        validate();
    } else {
        build();
    }
}

// Run if called directly
main();
