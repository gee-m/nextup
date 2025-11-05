/**
 * @module utils/markdown
 * @order 9
 * @category Utils
 * @description Lightweight markdown parser for task titles
 *
 * Supported syntax:
 * - **bold** → bold text
 * - *italic* → italic text
 * - `code` → monospace code
 * - [text](url) → clickable link
 * - "- " at line start → "• " bullet
 *
 * Returns tokens array: [{text, format, url?}, ...]
 * Formats: 'normal', 'bold', 'italic', 'code', 'link'
 */

export const MarkdownMixin = {
    /**
     * Parse markdown syntax in a line of text
     * @param {string} line - Line of text with markdown
     * @returns {Array} Array of tokens: [{text, format, url?}, ...]
     */
    parseMarkdown(line) {
        if (!this.enableMarkdown || !line) {
            return [{ text: line || '', format: 'normal' }];
        }

        // Handle bullet points (including indented sub-bullets)
        // Match: optional whitespace + (- or *) + space
        // Preserves leading whitespace for indentation
        line = line.replace(/^(\s*)([-*])\s/, '$1• ');

        const tokens = [];
        let remaining = line;
        let pos = 0;

        // Regex patterns for markdown syntax
        const patterns = [
            // Bold: **text**
            { regex: /\*\*(.+?)\*\*/,  format: 'bold' },
            // Code: `text`
            { regex: /`(.+?)`/,        format: 'code' },
            // Link: [text](url)
            { regex: /\[([^\]]+)\]\(([^)]+)\)/, format: 'link' },
            // Italic: *text* (must come after bold to avoid matching ** as two italics)
            { regex: /\*(.+?)\*/,      format: 'italic' }
        ];

        while (remaining.length > 0) {
            let earliestMatch = null;
            let earliestIndex = Infinity;
            let earliestPattern = null;

            // Find the earliest match
            for (const pattern of patterns) {
                const match = remaining.match(pattern.regex);
                if (match && match.index < earliestIndex) {
                    earliestMatch = match;
                    earliestIndex = match.index;
                    earliestPattern = pattern;
                }
            }

            if (!earliestMatch) {
                // No more markdown - add remaining text as normal
                if (remaining.length > 0) {
                    tokens.push({ text: remaining, format: 'normal' });
                }
                break;
            }

            // Add text before the match as normal
            if (earliestIndex > 0) {
                tokens.push({
                    text: remaining.substring(0, earliestIndex),
                    format: 'normal'
                });
            }

            // Add the formatted token
            if (earliestPattern.format === 'link') {
                tokens.push({
                    text: earliestMatch[1],  // Link text
                    format: 'link',
                    url: earliestMatch[2]    // URL
                });
            } else {
                tokens.push({
                    text: earliestMatch[1],  // Content inside markdown
                    format: earliestPattern.format
                });
            }

            // Continue with remaining text
            remaining = remaining.substring(earliestIndex + earliestMatch[0].length);
        }

        // If no tokens were created, return the original text as normal
        if (tokens.length === 0) {
            return [{ text: line, format: 'normal' }];
        }

        return tokens;
    }
};

console.log('[markdown.js] Markdown parsing module loaded');
