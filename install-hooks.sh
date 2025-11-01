#!/bin/bash
# Install git hooks from .githooks/ directory

set -e

echo "🪝 Installing git hooks..."

# Configure git to use .githooks directory
git config core.hooksPath .githooks

echo "✅ Git hooks installed!"
echo ""
echo "Hooks configured:"
ls -1 .githooks/ | sed 's/^/  - /'
echo ""
echo "Pre-commit hook will:"
echo "  1. Build dist/task-tree.html when src/ files change"
echo "  2. Automatically stage the built file"
echo ""
echo "To disable: git config --unset core.hooksPath"
