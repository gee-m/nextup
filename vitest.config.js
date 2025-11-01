import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Test environment
        environment: 'node',  // 'jsdom' for DOM tests, 'node' for unit tests

        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            exclude: [
                'node_modules/**',
                'dist/**',
                'tests/**',
                '*.config.js',
                'build.js'
            ]
        },

        // Test files
        include: [
            'tests/**/*.test.js',
            'tests/**/*.spec.js'
        ],

        // Globals (optional - makes test functions available without imports)
        globals: false,

        // Timeout
        testTimeout: 10000,

        // Reporter
        reporters: ['verbose']
    }
});
