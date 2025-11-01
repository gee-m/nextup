# Testing & Git Hooks Guide

Complete guide to the testing infrastructure and automated workflows.

---

## 🚀 Quick Start

```bash
# One-time setup
make setup              # Install dependencies + git hooks

# Daily workflow
make check              # Build + test (before committing)
make test-watch         # Auto-run tests on file changes

# Manual testing
make test-manual        # Build with test checklist data
```

---

## 🪝 Git Hooks

### Pre-Commit Hook (Automatic)

**What it does**: Automatically rebuilds `dist/task-tree.html` when you commit changes to `src/`

**Location**: `.githooks/pre-commit`

**Workflow**:
```
1. You edit: src/js/navigation/viewport.js
2. You run: git commit -m "feat: improve zoom"
3. Hook runs: node build.js (rebuilds dist/)
4. Hook stages: git add dist/task-tree.html
5. Commit includes: Your changes + rebuilt dist/
```

**Benefits**:
- ✅ Never forget to rebuild
- ✅ dist/ always in sync with src/
- ✅ Prevents broken builds in git history

### Installation

```bash
# Automatic (recommended)
make setup              # Installs deps + hooks

# Manual
bash install-hooks.sh   # Hooks only
```

### Verification

```bash
# Check if hooks are installed
git config core.hooksPath
# Should output: .githooks

# Test the hook
touch src/js/test.js
git add src/js/test.js
git commit -m "test"
# Should see: "🪝 Running pre-commit hook..."
git reset HEAD~1        # Undo test commit
rm src/js/test.js
```

### Disabling Hooks Temporarily

```bash
# Skip hook for one commit
git commit --no-verify -m "your message"

# Disable hooks completely
git config --unset core.hooksPath

# Re-enable
make install-hooks
```

---

## 🧪 Test Suite

### Test Categories

#### 1. Smoke Tests (`tests/smoke.test.js`)

**Purpose**: Verify build system and file structure

**What's tested**:
- ✅ dist/task-tree.html exists
- ✅ Valid HTML structure
- ✅ CSS injected correctly
- ✅ JavaScript injected correctly
- ✅ File size reasonable (100-500 KB)
- ✅ All source files exist

**Example**:
```javascript
test('dist/task-tree.html is valid HTML', () => {
    const html = fs.readFileSync('dist/task-tree.html', 'utf8');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
});
```

#### 2. Unit Tests (`tests/unit/`)

**Purpose**: Test isolated functions (no DOM required)

**Current tests**:
- `utils/cycle-detection.test.js` - Circular dependency detection (8 test cases)

**Example**:
```javascript
test('direct cycle: A → B, adding B → A', () => {
    app.tasks = [
        { id: 1, dependencies: [2] },  // A depends on B
        { id: 2, dependencies: [] }
    ];
    expect(app.wouldCreateCycle(2, 1)).toBe(true);
});
```

**To add more**:
```bash
# Create new test file
nano tests/unit/utils/platform.test.js

# Run specific test
npx vitest tests/unit/utils/platform.test.js
```

#### 3. Integration Tests (Coming Soon)

**Purpose**: Test full user workflows end-to-end

**Recommended**: Playwright or Cypress

**Planned tests**:
- Task creation workflow
- Drag-and-drop interactions
- Undo/redo functionality
- Data persistence

---

## 📋 Make Commands

### Testing Commands

```bash
make test              # Run all tests once
make test-watch        # Run tests in watch mode (auto-rerun)
make test-ui           # Open interactive test UI
make test-coverage     # Run tests with coverage report
make test-manual       # Build with test checklist data
```

### Quality Commands

```bash
make check             # Build validation + tests (pre-commit check)
make validate          # Validate project structure only
make verify-refactor   # Verify refactoring completeness
```

### Setup Commands

```bash
make setup             # Install deps + git hooks (one-time)
make install-hooks     # Install git hooks only
make install-deps      # Install npm dependencies only
```

---

## 🎯 Testing Strategy

### Current Coverage: ~5%

**What's tested**:
- ✅ Build system (smoke tests)
- ✅ Cycle detection (unit tests)

### Target Coverage: 40% (Short-term)

**Next to test**:
1. **Utils** (easy wins, no DOM)
   - platform.js - OS detection, keyboard symbols
   - svg.js - Coordinate conversion
   - ✅ cycle-detection.js - Already tested

2. **Core Logic**
   - tasks.js - Task CRUD operations
   - status.js - Status transitions
   - relationships.js - Dependencies, reparenting

3. **Data Layer**
   - undo-redo.js - Snapshot creation, undo/redo
   - clipboard.js - Copy/paste logic
   - persistence.js - Serialization (mock localStorage)

### Testing Pyramid

```
     /\          Integration Tests (Slow, high value)
    /  \         - Full workflows
   /    \        - Browser automation
  /------\
 /        \      Unit Tests (Fast, focused)
/          \     - Isolated functions
/____________\   - No dependencies
```

**Balance**:
- **70%** Unit tests (fast, run frequently)
- **20%** Integration tests (slow, run before release)
- **10%** Manual testing (exploratory, edge cases)

---

## 🔄 Development Workflow

### Typical Day

```bash
# Morning: Setup
make setup              # One-time only

# During development
make test-watch         # Run in terminal, auto-tests on save

# Edit code
nano src/js/navigation/viewport.js

# Tests auto-run when you save
# ✅ All tests pass

# Before committing
make check              # Final validation
git add .
git commit -m "feat: improve zoom"
# Pre-commit hook runs automatically
# Commit includes rebuilt dist/
```

### Test-Driven Development (TDD)

```bash
# 1. Write failing test
nano tests/unit/core/tasks.test.js
# test('creates child task at position', () => { ... })

# 2. Run tests (should fail)
make test
# ❌ Test fails (expected)

# 3. Write implementation
nano src/js/core/tasks.js

# 4. Run tests (should pass)
make test
# ✅ Test passes

# 5. Commit
git commit -m "feat: add createChildAtPosition"
```

---

## 🐛 Debugging Tests

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
    console.log('Result:', result);  // Shows in test output
    expect(result).toBe(expected);
});
```

### Use Vitest UI (Recommended)

```bash
make test-ui
# Opens http://localhost:51204/__vitest__/
# Interactive test runner with debugging
```

---

## 📊 Coverage Reports

### Generate Coverage

```bash
make test-coverage
# Generates coverage/ directory
```

### View Coverage

```bash
# HTML report (interactive)
open coverage/index.html

# Terminal report
cat coverage/lcov-report/index.html
```

### Coverage Targets

| Category | Target | Current |
|----------|--------|---------|
| Utils | 90% | 50% |
| Core | 80% | 0% |
| Data | 70% | 0% |
| Rendering | 30% | 0% |
| UI | 20% | 0% |
| **Overall** | **40%** | **~5%** |

**Note**: Not targeting 100% - diminishing returns on UI/rendering code.

---

## 🚦 CI/CD Integration (Future)

### GitHub Actions (Recommended)

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
        with:
          node-version: '18'
      - run: npm install
      - run: make build
      - run: make test
      - run: make test-coverage
      - uses: codecov/codecov-action@v3  # Upload coverage
```

### Pre-merge Checks

**Required**:
- ✅ Build succeeds
- ✅ Tests pass
- ✅ Coverage doesn't decrease

**Optional**:
- Lint passes (when configured)
- Format passes (when configured)

---

## ❓ FAQ

### Q: Do I need to run `make build` before committing?

**A**: No! The pre-commit hook automatically runs build and stages `dist/`.

### Q: Can I skip the pre-commit hook?

**A**: Yes, use `git commit --no-verify`, but not recommended.

### Q: What if the build fails during commit?

**A**: The commit will be aborted. Fix the build error, then commit again.

### Q: How do I add a new test?

**A**: Create a `.test.js` file in `tests/`, import `vitest`, write tests. See `tests/README.md` for examples.

### Q: What if I don't want dist/ in git?

**A**:
1. Add `dist/` to `.gitignore`
2. Remove from git: `git rm -r --cached dist/`
3. Update pre-commit hook to skip staging dist/

### Q: How do I run tests without npm?

**A**: You can't - tests require Vitest. Run `make setup` first.

---

## 📚 Resources

- **Vitest**: https://vitest.dev/
- **Playwright**: https://playwright.dev/
- **Testing Best Practices**: https://testingjavascript.com/
- **Git Hooks**: https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks

---

## 📝 Summary

**Git Hooks**:
- ✅ Pre-commit hook auto-builds dist/
- ✅ Installed via `make setup`
- ✅ Ensures dist/ stays in sync

**Test Suite**:
- ✅ Smoke tests (build system)
- ✅ Unit tests (cycle detection)
- ⏳ More unit tests coming (40% coverage goal)
- ⏳ Integration tests coming (Playwright)

**Workflow**:
```bash
make setup         # One-time
make test-watch    # During development
make check         # Before committing
git commit         # Hook runs automatically
```

**Commands to Remember**:
- `make setup` - First time setup
- `make check` - Pre-commit validation
- `make test-watch` - Auto-run tests
- `make test-ui` - Interactive debugging
