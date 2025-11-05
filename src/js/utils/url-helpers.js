/**
 * @module utils/url-helpers
 * @order 7
 * @category utils
 *
 * URL extraction, validation, and formatting utilities
 *
 * KEY FUNCTIONS:
 *
 * extractURLsFromText(text) - Extract URLs from text
 * - Matches http://, https://, file:///, mailto: protocols
 * - Returns array of URL strings
 * - Cleans up trailing punctuation (., , ; : ! ?)
 * - Used during task editing to auto-detect pasted URLs
 *
 * removeURLsFromText(text) - Remove all URLs from text
 * - Removes http://, https://, file:///, mailto: URLs
 * - Cleans up extra whitespace
 * - Normalizes multiple blank lines to single
 * - Used to clean task title after extracting URLs
 *
 * shortenURL(url, maxLength) - Shorten URL for display
 * - Defaults to 30 character limit
 * - Removes protocol prefix for cleaner display
 * - Adds "..." ellipsis if truncated
 * - Used in link icons and context menus
 *
 * isValidURL(url) - Validate URL format
 * - Uses URL() constructor for validation
 * - Checks for allowed protocols: http:, https:, file:, mailto:
 * - Returns boolean
 * - Used before attaching links to tasks
 *
 * USAGE EXAMPLE:
 * const text = "Check out https://example.com for info";
 * const urls = app.extractURLsFromText(text);  // ["https://example.com"]
 * const clean = app.removeURLsFromText(text);  // "Check out for info"
 * const valid = app.isValidURL(urls[0]);       // true
 * const short = app.shortenURL(urls[0], 20);   // "example.com"
 */

// URL extraction and formatting utilities
app.extractURLsFromText = function(text) {
    // Match http://, https://, file:///, mailto: protocols
    const urlPattern = /(https?:\/\/[^\s]+)|(file:\/\/\/[^\s]+)|(mailto:[^\s]+)/gi;
    const matches = text.match(urlPattern) || [];

    // Clean up URLs (remove trailing punctuation like periods, commas)
    return matches.map(url => url.replace(/[.,;:!?)\]]+$/, ''));
};

app.removeURLsFromText = function(text) {
    // Remove all URLs from text
    const urlPattern = /(https?:\/\/[^\s]+)|(file:\/\/\/[^\s]+)|(mailto:[^\s]+)/gi;
    let cleanText = text.replace(urlPattern, '');

    // Clean up excessive blank lines (collapse multiple newlines)
    // Preserve leading/trailing whitespace - don't trim
    cleanText = cleanText.replace(/\n\s*\n+/g, '\n'); // Multiple blank lines → single

    return cleanText;
};

app.shortenURL = function(url, maxLength = 30) {
    if (url.length <= maxLength) return url;

    // Remove protocol for display
    let display = url.replace(/^(https?:\/\/|file:\/\/\/|mailto:)/, '');

    if (display.length > maxLength) {
        return display.substring(0, maxLength - 3) + '...';
    }

    return display;
};

app.isValidURL = function(url) {
    try {
        const u = new URL(url);
        return ['http:', 'https:', 'file:', 'mailto:'].includes(u.protocol);
    } catch {
        return false;
    }
};

console.log('[url-helpers.js] URL extraction and formatting utilities loaded');
