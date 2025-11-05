/**
 * @module rendering/nodes
 * @order 22
 * @category rendering
 *
 * Task node rendering - SVG generation for task rectangles with text
 */

export const NodesMixin = {
    /**
     * Convert tab characters to spaces for SVG display
     * SVG text elements don't render tabs visibly, so we convert them to spaces
     * @param {string} text - Text with tabs
     * @returns {string} Text with tabs converted to spaces
     */
    convertTabsToSpaces(text) {
        if (!text) return text;
        const spaces = ' '.repeat(this.tabWidth || 4);
        return text.replace(/\t/g, spaces);
    },

    wrapText(text, maxWidth, charWidth, wordWrap) {
        // Convert tabs to spaces for SVG display (SVG doesn't render tabs)
        const displayText = this.convertTabsToSpaces(text);

        // Return single line if multiline is disabled
        if (!this.enableMultiline) {
            return [displayText];
        }

        // Calculate maximum characters that fit in one line
        const maxChars = Math.floor(maxWidth / charWidth);
        if (maxChars <= 0) return [displayText]; // Safety check

        // NEW: First split by newlines to preserve user line breaks
        const paragraphs = displayText.split('\n');
        const allLines = [];

        // Process each paragraph (line break = user intent)
        for (const paragraph of paragraphs) {
            // Handle empty lines (preserve them as blank lines)
            if (paragraph === '') {
                allLines.push('');
                continue;
            }

            if (wordWrap) {
                // Split into tokens: words AND spaces (preserves all whitespace)
                // Match sequences of non-whitespace OR sequences of spaces
                const tokens = paragraph.match(/\S+| +/g) || [];
                let currentLine = '';

                for (const token of tokens) {
                    const testLine = currentLine + token;
                    const testWidth = testLine.length * charWidth;

                    if (testWidth <= maxWidth) {
                        currentLine = testLine;
                    } else {
                        // Line would be too long
                        const isSpaceToken = token.startsWith(' ');

                        if (isSpaceToken) {
                            // Don't wrap in the middle of spaces - add them to current line
                            // (This handles edge case of many spaces)
                            if (currentLine) {
                                allLines.push(currentLine);
                            }
                            currentLine = token;
                        } else {
                            // Word token - wrap before it
                            if (currentLine) {
                                allLines.push(currentLine);
                            }

                            // Handle single word longer than max width
                            if (token.length * charWidth > maxWidth) {
                                // Force character break for long words
                                let remaining = token;
                                while (remaining.length > 0) {
                                    allLines.push(remaining.substring(0, maxChars));
                                    remaining = remaining.substring(maxChars);
                                }
                                currentLine = '';
                            } else {
                                currentLine = token;
                            }
                        }
                    }
                }

                if (currentLine) {
                    allLines.push(currentLine);
                }
            } else {
                // Character wrapping - simple split at max chars for this paragraph
                for (let i = 0; i < paragraph.length; i += maxChars) {
                    allLines.push(paragraph.substring(i, i + maxChars));
                }
            }
        }

        // Return at least one line (even if empty)
        return allLines.length > 0 ? allLines : [''];
    },

    /**
     * Calculate task dimensions with multiline support
     * @param {Object} task - Task object
     * @returns {{width: number, height: number, lines: string[]}} Dimensions object
     */
    calculateTaskDimensions(task) {
        // Helper: Calculate task dimensions with multiline support
        const padding = this.nodePadding;
        const charWidth = this.charWidth;
        const minWidth = this.minNodeWidth;

        // Determine display text (same logic as main rendering)
        const charsOverLimit = task.title.length - this.textLengthThreshold;
        const shouldTruncate = charsOverLimit > 5;
        const shouldExpand = task.currentlyWorking || task.textLocked || (task.textExpanded && this.selectedTaskIds.has(task.id));
        const displayTitle = (shouldTruncate && !shouldExpand) ? task.title.substring(0, this.textLengthThreshold) + '...' : task.title;

        // Use full text for multiline, truncated for single-line
        const textForSizing = this.enableMultiline ? task.title : displayTitle;

        // Wrap text into lines (subtract padding to ensure text fits within available space)
        const availableWidth = this.maxNodeWidth - padding * 2;
        const lines = this.wrapText(textForSizing, availableWidth, charWidth, this.wordWrap);

        // Calculate width
        const longestLineWidth = Math.max(...lines.map(line => line.length * charWidth + padding * 2));
        const rectWidth = Math.max(minWidth, Math.min(this.maxNodeWidth, longestLineWidth));

        // Calculate height (use fixed vertical padding, not nodePadding)
        const verticalPadding = 10;
        // Add extra bottom padding if task has tracked time (for time badge)
        const hasTimeTracking = task.timeTracking && task.timeTracking.totalSeconds > 0;
        const extraBottomPadding = hasTimeTracking ? 8 : 0;
        const calculatedHeight = lines.length * this.lineHeight + verticalPadding * 2 + extraBottomPadding;
        const rectHeight = this.maxNodeHeight > 0
            ? Math.min(this.maxNodeHeight, calculatedHeight)
            : calculatedHeight;

        // Return width/height (not rectWidth/rectHeight) to match render() expectations
        return { width: rectWidth, height: rectHeight, lines };
    },

    /**
     * Calculate rectangle dimensions for given text
     * Used by both render() and resizeEditingBox() for consistent sizing
     * @param {string} text - Text content
     * @returns {{width: number, height: number, lines: string[]}} Dimensions object
     */
    calculateTextBoxDimensions(text) {
        // Helper method to calculate rectangle dimensions for given text
        // Returns { width, height, lines }
        // Used by both render() and resizeEditingBox() for consistent sizing

        const padding = this.nodePadding;
        const charWidth = this.charWidth;
        const minWidth = this.minNodeWidth;

        // Wrap text into lines based on max width (subtract padding to ensure text fits within available space)
        const availableWidth = this.maxNodeWidth - padding * 2;
        const lines = this.wrapText(text, availableWidth, charWidth, this.wordWrap);

        // Calculate width: minimum of (maxNodeWidth OR longest line width OR minWidth)
        const longestLineWidth = Math.max(...lines.map(line => line.length * charWidth + padding * 2));
        const rectWidth = Math.max(minWidth, Math.min(this.maxNodeWidth, longestLineWidth));

        // Calculate height: lines * lineHeight + vertical padding
        const verticalPadding = 10;
        const calculatedHeight = lines.length * this.lineHeight + verticalPadding * 2;

        // Apply max height constraint if configured
        const rectHeight = this.maxNodeHeight > 0
            ? Math.min(this.maxNodeHeight, calculatedHeight)
            : calculatedHeight;

        // Return width/height (not rectWidth/rectHeight) to match caller expectations
        return { width: rectWidth, height: rectHeight, lines };
    }
};
