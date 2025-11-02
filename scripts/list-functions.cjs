#!/usr/bin/env node
/**
 * Extract all function signatures and their JSDoc comments from source files
 * Usage: node scripts/list-functions.cjs [file-pattern]
 *
 * Examples:
 *   node scripts/list-functions.cjs                    # All functions
 *   node scripts/list-functions.cjs mouse              # Functions in files matching "mouse"
 *   node scripts/list-functions.cjs core               # Functions in "core" directory
 */

const fs = require('fs');
const path = require('path');

const searchPattern = process.argv[2] || '';

function walkDir(dir, results = []) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (file !== 'node_modules' && !file.startsWith('.')) {
                walkDir(filePath, results);
            }
        } else if (file.endsWith('.js') && !file.includes('backup') && !file.includes('broken')) {
            results.push(filePath);
        }
    }

    return results;
}

function extractFunctions(files) {
    const results = [];

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(process.cwd(), file);

        // Apply search filter
        if (searchPattern && !relativePath.includes(searchPattern)) {
            continue;
        }

        const lines = content.split('\n');

        // Find function definitions with their JSDoc
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Match function definitions: name(...) {
            // Exclude: if, while, for, switch, catch
            const funcMatch = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*\{/);
            if (funcMatch && ['if', 'while', 'for', 'switch', 'catch'].includes(funcMatch[1])) {
                continue;
            }

            if (funcMatch) {
                const funcName = funcMatch[1];
                let jsdoc = '';

                // Look backwards for JSDoc comment
                let j = i - 1;
                while (j >= 0) {
                    const prevLine = lines[j];
                    if (prevLine.includes('*/')) {
                        // Found end of JSDoc, collect it
                        let k = j;
                        while (k >= 0 && !lines[k].includes('/**')) {
                            k--;
                        }
                        if (k >= 0) {
                            jsdoc = lines.slice(k, j + 1).join('\n');
                        }
                        break;
                    }
                    if (prevLine.trim() !== '' && !prevLine.includes('*')) {
                        break; // Non-comment line found
                    }
                    j--;
                }

                // Extract brief description from JSDoc
                let description = '';
                if (jsdoc) {
                    const descMatch = jsdoc.match(/\*\s*([^@\n][^\n]+)/);
                    if (descMatch) {
                        description = descMatch[1].trim();
                    }
                }

                // Extract params from JSDoc
                const params = [];
                if (jsdoc) {
                    const paramMatches = jsdoc.matchAll(/@param\s+\{[^}]+\}\s+([a-zA-Z_][a-zA-Z0-9_.]*)/g);
                    for (const match of paramMatches) {
                        params.push(match[1]);
                    }
                }

                results.push({
                    file: relativePath,
                    name: funcName,
                    line: i + 1,
                    signature: line.trim(),
                    description: description || '(no description)',
                    params: params,
                    hasJSDoc: !!jsdoc
                });
            }
        }
    }

    return results;
}

// Main execution
const srcDir = path.join(process.cwd(), 'src', 'js');
const files = walkDir(srcDir);
const functions = extractFunctions(files);

// Group by file
const byFile = {};
for (const func of functions) {
    if (!byFile[func.file]) {
        byFile[func.file] = [];
    }
    byFile[func.file].push(func);
}

// Print results
console.log(`\n📚 Function Reference\n${'='.repeat(80)}\n`);

if (searchPattern) {
    console.log(`🔍 Filtering by: "${searchPattern}"\n`);
}

for (const [file, funcs] of Object.entries(byFile).sort()) {
    console.log(`\n📄 ${file}`);
    console.log(`${'─'.repeat(80)}`);

    for (const func of funcs) {
        const docIcon = func.hasJSDoc ? '📖' : '  ';
        const paramStr = func.params.length > 0 ? `(${func.params.join(', ')})` : '()';
        console.log(`  ${docIcon} ${func.name}${paramStr} - Line ${func.line}`);
        if (func.description !== '(no description)') {
            console.log(`     ${func.description}`);
        }
    }
}

console.log(`\n${'='.repeat(80)}`);
console.log(`Total: ${functions.length} functions across ${Object.keys(byFile).length} files`);
console.log(`Documented: ${functions.filter(f => f.hasJSDoc).length} (${Math.round(functions.filter(f => f.hasJSDoc).length / functions.length * 100)}%)`);
console.log();
