# CSS Module Structure

This directory contains the CSS styles extracted from `task-tree.html`, split into logical modules for better organization and maintainability.

## Module Files (in load order)

1. **base.css** (@order: 10)
   - Global resets (`*` selector)
   - Body and html base styles
   - Canvas container positioning
   - SVG container styles
   - Animation definitions for view transitions

2. **controls.css** (@order: 20)
   - Top controls bar (`#controls`)
   - Button styles (primary and secondary)
   - Dropdown menus and submenu systems
   - Input field styling
   - Off-screen indicators for working tasks
   - Tooltip system
   - Toast notification system

3. **task-nodes.css** (@order: 30)
   - Task node base styles
   - Status-based styling (pending, working, done)
   - Visual state modifiers (parent-of-working, incomplete-child, selected)
   - Hidden indicator styling
   - Text expand button
   - Preview nodes
   - Custom cursor arrow for drag operations
   - Context menu (node-menu) styles

4. **links.css** (@order: 40)
   - Link/edge base styles
   - Dependency line styling
   - Parent/child relationship lines
   - Hit detection lines (invisible wide lines for easy clicking)
   - Hover effects
   - SVG markers
   - Link badges
   - Links dropdown

5. **modals.css** (@order: 50)
   - Modal overlay and container
   - Modal content styling
   - Import textarea
   - Modal button overrides

6. **status-bar.css** (@order: 60)
   - Bottom status bar (`#status-bar`)
   - Status labels and task info
   - Status button styling

7. **dark-mode.css** (@order: 70)
   - All dark mode overrides (`body.dark-mode` selectors)
   - Dark mode task node colors
   - Dark mode link colors
   - Dark mode modal styling
   - Dark mode dropdown/submenu styling

## Load Order

The `@order` annotation ensures styles are loaded in the correct sequence:
- Base styles first (10)
- Component-specific styles next (20-60)
- Theme overrides last (70)

This prevents specificity issues and ensures dark mode properly overrides light mode styles.

## Original Source

All CSS extracted from `task-tree.html` lines 7-1152 (1145 lines including style tags).

Total extracted: 1159 lines across 7 modules (includes module headers).
