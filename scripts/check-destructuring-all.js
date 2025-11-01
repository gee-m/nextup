#!/usr/bin/env node

/**
 * Comprehensive destructuring validation
 *
 * Detects potential bugs like:
 *   - Destructuring non-existent properties
 *   - Typos in property names
 *   - Missing rename syntax when names don't match
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const errors = [];
const warnings = [];

// Extract return statement property names from a function
function extractReturnProperties(functionBody) {
    const returnMatch = functionBody.match(/return\s*{([^}]+)}/);
    if (!returnMatch) return null;

    const props = returnMatch[1]
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0)
        .map(p => {
            // Handle "width: rectWidth" -> extract "width"
            // Handle "width" shorthand -> extract "width"
            const colonIndex = p.indexOf(':');
            if (colonIndex > 0) {
                return p.substring(0, colonIndex).trim();
            }
            // Shorthand property
            return p.split(/\s/)[0];
        });

    return props;
}

// Parse all functions and their return object properties
function parseFunctions(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const functions = new Map();

    // Match function definitions
    const funcRegex = /(\w+)\s*\([^)]*\)\s*{/g;
    let match;

    while ((match = funcRegex.exec(content)) !== null) {
        const funcName = match[1];
        const startPos = match.index + match[0].length;

        // Find function body (simplified - just get next 1000 chars)
        const bodySnippet = content.substring(startPos, startPos + 1000);
        const props = extractReturnProperties(bodySnippet);

        if (props && props.length > 0) {
            functions.set(funcName, { props, file: filePath });
        }
    }

    return functions;
}

// Check destructuring patterns in a file
function checkDestructuring(filePath, knownFunctions) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
        const lineNum = index + 1;

        // Pattern: const { prop1, prop2 } = this.functionName(...) or obj.functionName(...)
        const destructureRegex = /const\s*{([^}]+)}\s*=\s*(?:this\.)?(\w+)\(/;
        const match = line.match(destructureRegex);

        if (match) {
            const propsString = match[1];
            const funcName = match[2];

            // Skip common patterns that aren't function calls
            if (funcName === 'require' || funcName === 'import') return;

            const destructuredProps = propsString
                .split(',')
                .map(p => p.trim())
                .filter(p => p.length > 0)
                .map(p => {
                    // Handle "width: rectWidth" -> extract "width"
                    // Handle "width" -> return "width"
                    // Handle "...rest" -> skip
                    if (p.startsWith('...')) return null;

                    const colonIndex = p.indexOf(':');
                    return colonIndex > 0 ? p.substring(0, colonIndex).trim() : p;
                })
                .filter(p => p !== null);

            // Check if we know about this function
            const funcInfo = knownFunctions.get(funcName);
            if (funcInfo) {
                // Validate each destructured property exists in return
                destructuredProps.forEach(prop => {
                    if (!funcInfo.props.includes(prop)) {
                        errors.push({
                            file: filePath,
                            line: lineNum,
                            message: `Destructuring non-existent property "${prop}" from ${funcName}()`,
                            detail: `${funcName}() returns {${funcInfo.props.join(', ')}} (defined in ${funcInfo.file.split('/').slice(-2).join('/')})`,
                            code: line.trim()
                        });
                    }
                });
            }
        }

        // Also check for potential typos in common patterns
        if (line.includes('const {') && line.includes('=')) {
            // Common typos
            const typos = [
                { wrong: 'rectWidth', right: 'width', context: 'calculateTaskDimensions|calculateTextBoxDimensions' },
                { wrong: 'rectHeight', right: 'height', context: 'calculateTaskDimensions|calculateTextBoxDimensions' }
            ];

            typos.forEach(({ wrong, right, context }) => {
                const contextRegex = new RegExp(context);
                if (contextRegex.test(line) && line.includes(wrong) && !line.includes(`${right}:`)) {
                    warnings.push({
                        file: filePath,
                        line: lineNum,
                        message: `Possible property name mismatch: using "${wrong}" instead of "${right}"`,
                        detail: `Should use: const { ${right}: ${wrong} }`,
                        code: line.trim()
                    });
                }
            });
        }
    });
}

function walkDirectory(dir, knownFunctions) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            walkDirectory(filePath, knownFunctions);
        } else if (file.endsWith('.js')) {
            checkDestructuring(filePath, knownFunctions);
        }
    });
}

console.log('🔍 Analyzing all destructuring patterns...\n');

const srcDir = path.join(__dirname, '../src/js');

// First pass: parse all functions
console.log('📖 Step 1: Parsing all function return signatures...');
const allFunctions = new Map();
function parseAllFunctions(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            parseAllFunctions(filePath);
        } else if (file.endsWith('.js')) {
            const funcs = parseFunctions(filePath);
            funcs.forEach((value, key) => {
                allFunctions.set(key, value);
            });
        }
    });
}

parseAllFunctions(srcDir);
console.log(`   Found ${allFunctions.size} functions with object returns\n`);

// Second pass: validate destructuring
console.log('🔎 Step 2: Validating destructuring usage...\n');
walkDirectory(srcDir, allFunctions);

// Report results
console.log('━'.repeat(70));
if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All destructuring patterns look good!');
} else {
    if (errors.length > 0) {
        console.log(`\n❌ ERRORS (${errors.length}):\n`);
        errors.forEach((err, i) => {
            console.log(`${i + 1}. ${err.file.split('/').slice(-2).join('/')}:${err.line}`);
            console.log(`   ${err.message}`);
            console.log(`   ${err.detail}`);
            console.log(`   Code: ${err.code}`);
            console.log('');
        });
    }

    if (warnings.length > 0) {
        console.log(`\n⚠️  WARNINGS (${warnings.length}):\n`);
        warnings.forEach((warn, i) => {
            console.log(`${i + 1}. ${warn.file.split('/').slice(-2).join('/')}:${warn.line}`);
            console.log(`   ${warn.message}`);
            console.log(`   ${warn.detail}`);
            console.log(`   Code: ${warn.code}`);
            console.log('');
        });
    }

    console.log('━'.repeat(70));
    process.exit(errors.length > 0 ? 1 : 0);
}
