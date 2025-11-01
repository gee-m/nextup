#!/usr/bin/env node

/**
 * Validate destructuring patterns match function return values
 *
 * Catches bugs like:
 *   function foo() { return { width: 100 }; }
 *   const { rectWidth } = foo(); // BUG: undefined!
 *
 * Should be:
 *   const { width: rectWidth } = foo(); // Correct
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Known function return signatures to validate
const FUNCTION_SIGNATURES = {
    'calculateTaskDimensions': { returns: ['width', 'height', 'lines'] },
    'calculateTextBoxDimensions': { returns: ['width', 'height', 'lines'] },
    'getSVGPoint': { returns: ['x', 'y'] },
};

let errors = 0;
let warnings = 0;

function validateFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
        const lineNum = index + 1;

        // Check each known function
        Object.entries(FUNCTION_SIGNATURES).forEach(([funcName, { returns }]) => {
            // Pattern: const { prop1, prop2 } = this.functionName(...)
            // This is WRONG if prop1/prop2 aren't in the return signature
            const badPattern = new RegExp(`const\\s*{([^}]+)}\\s*=\\s*this\\.${funcName}\\(`);
            const match = line.match(badPattern);

            if (match) {
                const destructuredProps = match[1]
                    .split(',')
                    .map(p => p.trim())
                    .map(p => {
                        // Handle "width: rectWidth" -> extract "width"
                        // Handle "width" -> return "width"
                        const colonIndex = p.indexOf(':');
                        return colonIndex > 0 ? p.substring(0, colonIndex).trim() : p;
                    });

                // Check if all destructured props exist in return signature
                destructuredProps.forEach(prop => {
                    if (!returns.includes(prop)) {
                        console.error(`❌ ERROR: ${filePath}:${lineNum}`);
                        console.error(`   Function ${funcName}() returns {${returns.join(', ')}}`);
                        console.error(`   But code destructures non-existent property: "${prop}"`);
                        console.error(`   Line: ${line.trim()}`);
                        console.error('');
                        errors++;
                    }
                });
            }
        });

        // Warn about destructuring without rename when property names differ
        // Pattern: const { rectWidth, rectHeight } = this.calculateTaskDimensions(...)
        if (line.includes('calculateTaskDimensions') || line.includes('calculateTextBoxDimensions')) {
            if (line.match(/const\s*{\s*(rectWidth|rectHeight)\s*}/)) {
                console.warn(`⚠️  WARNING: ${filePath}:${lineNum}`);
                console.warn(`   Destructuring 'rectWidth'/'rectHeight' but function returns 'width'/'height'`);
                console.warn(`   Should use: const { width: rectWidth, height: rectHeight }`);
                console.warn(`   Line: ${line.trim()}`);
                console.warn('');
                warnings++;
            }
        }
    });
}

function walkDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            walkDirectory(filePath);
        } else if (file.endsWith('.js')) {
            validateFile(filePath);
        }
    });
}

console.log('🔍 Validating destructuring patterns...\n');

const srcDir = path.join(__dirname, '../src/js');
walkDirectory(srcDir);

console.log('━'.repeat(60));
if (errors === 0 && warnings === 0) {
    console.log('✅ All destructuring patterns are valid!');
} else {
    if (errors > 0) {
        console.log(`❌ Found ${errors} error(s)`);
    }
    if (warnings > 0) {
        console.log(`⚠️  Found ${warnings} warning(s)`);
    }
    process.exit(errors > 0 ? 1 : 0);
}
