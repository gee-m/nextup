# Tests

This directory contains the test suite for Task Tree.

## Test Structure

```
tests/
├── smoke.test.js              # Basic sanity checks (build system, file structure)
├── unit/                      # Unit tests (isolated functions, no DOM)
│   └── utils/
│       └── cycle-detection.test.js  # Circular dependency detection
└── integration/               # Integration tests (full workflows)
    └── (coming soon)
```

## Running Tests

### Quick Start

```bash
# Install dependencies
make setup

# Run tests once
make test

# Run tests in watch mode
make test-watch

# Run tests with coverage
make test-coverage

# Run all checks (build + test)
make check
```

### Using npm directly

```bash
npm test              # Run tests once
npm run test:watch    # Watch mode
npm run test:ui       # Interactive UI
npm run test:coverage # With coverage report
```

## Test Categories

### 1. Smoke Tests (`smoke.test.js`)

**Purpose**: Basic sanity checks to ensure the build system and file structure work.

**What's tested**:
- Build output exists
- HTML is valid
- CSS is injected correctly
- JavaScript is injected correctly
- File size is reasonable
- All expected source files exist

**When to run**: After any build system changes.

### 2. Unit Tests (`unit/`)

**Purpose**: Test individual functions in isolation (no DOM required).

**What's tested**:
- `utils/cycle-detection.js` - Circular dependency detection algorithm
- (More tests coming: platform detection, SVG coordinate conversion)

**When to run**: During development, before committing.

**How to add more**:
```javascript
// tests/unit/utils/platform.test.js
import { describe, test, expect } from 'vitest';

describe('Platform Detection', () => {
    test('detects Mac OS', () => {
        // Test Mac detection logic
    });
});
```

### 3. Integration Tests (`integration/` - coming soon)

**Purpose**: Test full user workflows end-to-end.

**What should be tested**:
- Task creation workflow
- Drag-and-drop interactions
- Undo/redo functionality
- Data persistence across page reloads

**Recommended framework**: Playwright or Cypress

**Example**:
```javascript
// tests/integration/task-creation.test.js
import { test, expect } from '@playwright/test';

test('create and edit task', async ({ page }) => {
    await page.goto('dist/task-tree.html');
    // Ctrl+double-click to create task
    await page.keyboard.down('Control');
    await page.dblclick('#canvas');
    await page.keyboard.up('Control');
    // ... test continues
});
```

## Writing Tests

### Unit Test Pattern

```javascript
import { describe, test, expect, beforeEach } from 'vitest';

describe('Feature Name', () => {
    let app;

    beforeEach(() => {
        // Setup before each test
        app = createMockApp();
    });

    test('should do something', () => {
        // Arrange
        const input = 'test';

        // Act
        const result = app.someFunction(input);

        // Assert
        expect(result).toBe('expected');
    });
});
```

### Best Practices

1. **Test behavior, not implementation**
   - ✅ `test('prevents circular dependencies')`
   - ❌ `test('uses BFS algorithm')`

2. **Use descriptive test names**
   - ✅ `test('direct cycle: A → B, adding B → A')`
   - ❌ `test('cycle test 1')`

3. **Arrange-Act-Assert pattern**
   ```javascript
   // Arrange: Setup
   const app = createMockApp();

   // Act: Execute
   const result = app.wouldCreateCycle(1, 2);

   // Assert: Verify
   expect(result).toBe(false);
   ```

4. **One assertion per test (when possible)**
   - Makes failures easier to diagnose

5. **Test edge cases**
   - Empty inputs
   - Null/undefined
   - Very large inputs
   - Boundary conditions

## Coverage Goals

Current coverage: **~5%** (2 test files)

**Short-term goal (Q1)**: 40%
- All utils tested
- Core logic tested (tasks, status, relationships)
- Data layer tested (undo-redo, clipboard, persistence)

**Long-term goal (Q2)**: 70%
- All critical paths tested
- Integration tests for major workflows
- Visual regression tests for UI

**Not targeting 100%**:
- Rendering code (visual, hard to unit test)
- Event handlers (better tested via integration)
- UI components (better tested via integration)

## Continuous Integration

### Pre-commit Hook

The project includes a pre-commit hook that:
1. Runs `make build` to rebuild dist/
2. Stages `dist/task-tree.html` automatically

**Install**: `make setup` or `make install-hooks`

### CI Pipeline (Future)

Recommended GitHub Actions workflow:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npm test
      - run: npm run test:coverage
```

## Debugging Tests

### Run specific test file
```bash
npx vitest tests/smoke.test.js
```

### Run specific test
```bash
npx vitest -t "prevents circular dependencies"
```

### Debug with console.log
```javascript
test('debug example', () => {
    const result = someFunction();
    console.log('Result:', result);  // Will show in test output
    expect(result).toBe(expected);
});
```

### Use Vitest UI
```bash
make test-ui
# Opens interactive test runner in browser
```

## Common Issues

### "Cannot find module" errors

**Solution**: Make sure `package.json` has `"type": "module"`

### Tests timing out

**Solution**: Increase timeout in `vitest.config.js`:
```javascript
test: {
    testTimeout: 20000  // 20 seconds
}
```

### Coverage not working

**Solution**: Install coverage provider:
```bash
npm install --save-dev @vitest/coverage-v8
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [REFACTOR-VERIFICATION.md](../REFACTOR-VERIFICATION.md) - Detailed testing strategy
