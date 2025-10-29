# Work Time Tracker - Style Guide

This style guide documents the design system for the Work Time Tracker application. It provides guidelines for maintaining visual consistency and design quality across the application.

---

## Table of Contents

- [Design Tokens](#design-tokens)
- [Color Palette](#color-palette)
- [Typography](#typography)
- [Spacing System](#spacing-system)
- [Icon Sizes](#icon-sizes)
- [Shadows & Elevation](#shadows--elevation)
- [Border Radius](#border-radius)
- [Component Guidelines](#component-guidelines)
- [Responsive Design](#responsive-design)
- [Accessibility](#accessibility)

---

## Design Tokens

All design tokens are centralized in `src/design-tokens.css`. Always use CSS custom properties (variables) instead of hardcoded values.

### Usage Example

```css
/* ❌ Bad - Hardcoded values */
.button {
  padding: 0.75rem 1.5rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

/* ✅ Good - Using design tokens */
.button {
  padding: var(--spacing-sm) var(--spacing-lg);
  box-shadow: var(--shadow-md);
}
```

---

## Color Palette

### DaisyUI Bumblebee Theme

The application uses the **Bumblebee** theme from DaisyUI with custom enhancements.

#### Semantic Colors

```css
--p   /* Primary: Yellow (main brand color) */
--s   /* Secondary: Supporting color */
--a   /* Accent: Highlights */
--n   /* Neutral: Text and backgrounds */
--b1  /* Base-100: Main background */
--b2  /* Base-200: Slightly darker background */
--b3  /* Base-300: Borders and dividers */
--su  /* Success: Green */
--wa  /* Warning: Orange */
--er  /* Error: Red */
--in  /* Info: Blue */
```

#### Usage in Components

```css
/* Background */
background-color: hsl(var(--b1));

/* Text */
color: hsl(var(--bc));

/* Primary elements */
background-color: hsl(var(--p));
color: hsl(var(--pc)); /* Primary content color */
```

### Task Color System

Tasks can have custom colors. Always use inline styles for dynamic task colors:

```svelte
<!-- ✅ Correct -->
<div
  class="w-4 h-4 rounded-full"
  style="background-color: {task.color || 'hsl(var(--p))'}"
></div>

<!-- ❌ Incorrect - Dynamic Tailwind classes don't work -->
<div class="w-4 h-4 rounded-full bg-{task.color}"></div>
```

---

## Typography

### Font Families

```css
--font-family-base: 'Inter', system-ui, sans-serif;
--font-family-mono: ui-monospace, 'SF Mono', Consolas, monospace;
```

### Font Scale

| Token | Size | Usage |
|-------|------|-------|
| `--font-size-xs` | 12px | Small labels, captions |
| `--font-size-sm` | 14px | Secondary text, descriptions |
| `--font-size-base` | 16px | Body text (default) |
| `--font-size-lg` | 18px | Large body text |
| `--font-size-xl` | 20px | Small headings |
| `--font-size-2xl` | 24px | Section headings |
| `--font-size-3xl` | 30px | Page headings |
| `--font-size-4xl` | 36px | Hero headings |
| `--font-size-display` | 60px | Timer display, featured numbers |

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--font-weight-normal` | 400 | Body text |
| `--font-weight-medium` | 500 | Labels, subtle emphasis |
| `--font-weight-semibold` | 600 | Headings, buttons |
| `--font-weight-bold` | 700 | Strong emphasis, hero text |

### Typography Hierarchy

```svelte
<!-- Page Title -->
<h1 class="text-4xl font-bold">Dashboard</h1>

<!-- Section Title -->
<h2 class="text-3xl font-bold">Today's Progress</h2>

<!-- Card Title -->
<h3 class="text-2xl font-semibold">Active Tasks</h3>

<!-- Body Text -->
<p class="text-base">Regular content goes here</p>

<!-- Secondary Text -->
<p class="text-sm text-base-content/70">Additional details</p>

<!-- Caption -->
<p class="text-xs text-base-content/60">Small label</p>

<!-- Timer Display (special) -->
<div class="timer-display">02:45:30</div>
```

### Line Heights

```css
--line-height-tight: 1.25;    /* Headings */
--line-height-normal: 1.5;    /* Body text */
--line-height-relaxed: 1.75;  /* Long-form content */
```

---

## Spacing System

All spacing uses a consistent 4px base unit scale.

### Spacing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-xs` | 8px | Tight spacing, compact layouts |
| `--spacing-sm` | 12px | Small gaps, button padding |
| `--spacing-md` | 16px | Default spacing between elements |
| `--spacing-lg` | 24px | Card padding, section gaps |
| `--spacing-xl` | 32px | Large section spacing |
| `--spacing-2xl` | 48px | Hero sections |
| `--spacing-3xl` | 64px | Page sections |

### Usage Guidelines

```svelte
<!-- ✅ Good - Using Tailwind classes -->
<div class="space-y-4">  <!-- 16px vertical gap -->
<div class="p-6">         <!-- 24px padding -->
<div class="mb-8">        <!-- 32px margin bottom -->

<!-- ✅ Good - Using design tokens in custom CSS -->
<style>
  .custom-component {
    padding: var(--spacing-lg);
    gap: var(--spacing-md);
  }
</style>
```

### Component-Specific Spacing

- **Card padding**: `var(--spacing-lg)` (24px)
- **Section gaps**: `var(--spacing-xl)` (32px)
- **Element gaps**: `var(--spacing-md)` (16px)

---

## Icon Sizes

A consistent icon sizing system ensures visual hierarchy.

### Icon Size Scale (Phase 2 Standardized)

| Size | Token | Tailwind | Usage | Examples |
|------|-------|----------|-------|----------|
| 12px | `--icon-xs` | `w-3 h-3` | Inline icons, badges, btn-xs | Delete, Archive icons in compact buttons |
| 16px | `--icon-sm` | `w-4 h-4` | Navigation, secondary buttons, form controls | Nav items, Edit/Close buttons, Checkboxes |
| 20px | `--icon-md` | `w-5 h-5` | Section headers, notifications, alerts, card titles | Alert icons, Section headings, Modal headers |
| 24px | `--icon-lg` | `w-6 h-6` | Primary action buttons (btn-lg), emphasized actions | Start/Stop Timer, Primary CTAs |
| 32px | `--icon-xl` | `w-8 h-8` | Hero sections, large empty states | App logo, Large icons |
| 64px | `--icon-2xl` | `w-16 h-16` | Empty state illustrations | No tasks, No data screens |

### Icon Usage by Context (Phase 2 Rules)

**STRICT RULES - Always Follow:**

1. **btn-lg + Primary Action** → `w-5 h-5` (NOT w-6!)
2. **btn (regular)** → `w-4 h-4`
3. **btn-sm** → `w-4 h-4`
4. **btn-xs** → `w-3 h-3`
5. **Navigation items** → `w-4 h-4`
6. **Alerts/Notifications** → `w-5 h-5`
7. **Empty States** → `w-16 h-16`
8. **Close buttons in modals** → `w-4 h-4`

```svelte
<!-- ✅ CORRECT - Phase 2 Standard -->

<!-- Primary Action Button (btn-lg) -->
<button class="btn btn-lg btn-primary gap-2">
  <svg class="w-5 h-5">...</svg>  <!-- 20px, not 24px! -->
  Start Timer
</button>

<!-- Regular Button -->
<button class="btn btn-primary">
  <svg class="w-4 h-4 mr-2">...</svg>
  New Task
</button>

<!-- Navigation Item -->
<button class="btn btn-ghost">
  <svg class="w-4 h-4">...</svg>
  Timer
</button>

<!-- Small Button -->
<button class="btn btn-sm">
  <svg class="w-4 h-4">...</svg>  <!-- Still w-4, not w-3 -->
  Edit
</button>

<!-- Extra Small Button -->
<button class="btn btn-xs">
  <svg class="w-3 h-3 mr-1">...</svg>
  Delete
</button>

<!-- Alert/Error Message -->
<div class="alert alert-error">
  <svg class="w-5 h-5">...</svg>  <!-- Always w-5 for alerts -->
  <span>Error message</span>
</div>

<!-- Empty State Icon -->
<svg class="w-16 h-16 mx-auto text-base-content/30">...</svg>

<!-- ❌ INCORRECT - Don't do this! -->
<button class="btn btn-lg">
  <svg class="w-6 h-6">...</svg>  <!-- Too big! Use w-5 -->
</button>

<button class="btn btn-sm">
  <svg class="w-3 h-3">...</svg>  <!-- Too small! Use w-4 -->
</button>
```

### Icon Spacing Rules

Use `gap-2` (8px) or `mr-2` for spacing between icon and text:

```svelte
<!-- ✅ Modern: Using gap (preferred) -->
<button class="btn gap-2">
  <svg class="w-4 h-4">...</svg>
  Button Text
</button>

<!-- ✅ Legacy: Using margin (acceptable) -->
<button class="btn">
  <svg class="w-4 h-4 mr-2">...</svg>
  Button Text
</button>
```

---

## Shadows & Elevation

Shadows create depth and visual hierarchy.

### Shadow Scale

| Token | Usage |
|-------|-------|
| `--shadow-xs` | Very subtle, hover states |
| `--shadow-sm` | Buttons |
| `--shadow-md` | Stats, hover cards |
| `--shadow-lg` | Cards, alerts |
| `--shadow-xl` | Navigation sidebar |
| `--shadow-2xl` | Modals |

### Component Shadow Tokens

```css
--shadow-button: var(--shadow-sm);
--shadow-button-hover: var(--shadow-md);
--shadow-card: var(--shadow-lg);
--shadow-card-hover: var(--shadow-xl);
--shadow-modal: var(--shadow-2xl);
```

### Shadow Hierarchy

1. **Level 0** - Flat elements (no shadow)
2. **Level 1** - `shadow-sm` - Buttons, badges
3. **Level 2** - `shadow-md` - Hover states, stats
4. **Level 3** - `shadow-lg` - Cards, main content
5. **Level 4** - `shadow-xl` - Navigation, important elements
6. **Level 5** - `shadow-2xl` - Modals, overlays

```svelte
<!-- Card with proper shadow -->
<div class="card bg-base-100">
  <!-- Uses shadow-lg by default -->
</div>

<!-- Button with shadow -->
<button class="btn btn-primary">
  <!-- Uses shadow-sm, becomes shadow-md on hover -->
</button>
```

---

## Border Radius

### Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small elements |
| `--radius-md` | 6px | Inputs, badges |
| `--radius-lg` | 8px | Buttons, navigation items |
| `--radius-xl` | 12px | Cards |
| `--radius-2xl` | 16px | Large modals |
| `--radius-full` | 9999px | Pills, avatars, indicators |

### Component Radius

```css
--radius-button: var(--radius-lg);    /* 8px */
--radius-card: var(--radius-xl);      /* 12px */
--radius-input: var(--radius-md);     /* 6px */
--radius-badge: var(--radius-full);   /* Fully rounded */
```

---

## Component Guidelines

### Buttons

```svelte
<!-- Primary Action (large) -->
<button class="btn btn-primary btn-lg">
  <svg class="w-6 h-6 mr-2">...</svg>
  Start Timer
</button>

<!-- Regular Button -->
<button class="btn btn-primary">
  <svg class="w-4 h-4 mr-2">...</svg>
  Create Task
</button>

<!-- Secondary Button -->
<button class="btn btn-outline">
  <svg class="w-4 h-4 mr-2">...</svg>
  Export
</button>

<!-- Small/Compact Button -->
<button class="btn btn-ghost btn-sm">
  <svg class="w-4 h-4">...</svg>
  Edit
</button>

<!-- Extra Small Button -->
<button class="btn btn-xs">
  <svg class="w-3 h-3 mr-1">...</svg>
  Delete
</button>
```

**Button States:**
- Default: `shadow-sm`
- Hover: `shadow-md`, `scale-105`
- Active: `scale-95`
- Disabled: `opacity-50`, no hover effects

### Cards

```svelte
<!-- Main Content Card -->
<div class="card bg-base-100 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Title</h2>
    <p>Content here</p>
  </div>
</div>

<!-- Compact Card -->
<div class="card card-compact bg-base-100">
  <div class="card-body">
    <!-- Less padding -->
  </div>
</div>
```

**Card States:**
- Default: `shadow-lg`
- Hover: `shadow-xl`
- Border: `1px solid hsl(var(--b3))`

### Forms

```svelte
<!-- Text Input -->
<div class="form-control">
  <label class="label">
    <span class="label-text font-semibold">Label</span>
  </label>
  <input type="text" class="input input-bordered" />
  <label class="label">
    <span class="label-text-alt">Helper text</span>
  </label>
</div>

<!-- Select -->
<select class="select select-bordered">
  <option>Option 1</option>
</select>

<!-- Checkbox -->
<label class="cursor-pointer label">
  <input type="checkbox" class="checkbox checkbox-primary" />
  <span class="label-text ml-2">Remember me</span>
</label>
```

### Modals

```svelte
<div class="modal modal-open">
  <div class="modal-box">
    <h3 class="font-bold text-lg mb-4">Modal Title</h3>
    <p>Modal content...</p>
    <div class="modal-action">
      <button class="btn">Close</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

### Empty States

```svelte
<div class="text-center py-12">
  <svg class="w-16 h-16 mx-auto text-base-content/30 mb-4">
    <!-- Icon -->
  </svg>
  <h3 class="text-lg font-semibold text-base-content mb-2">
    No Items Yet
  </h3>
  <p class="text-base-content/70 mb-4">
    Get started by creating your first item
  </p>
  <button class="btn btn-primary">Create Item</button>
</div>
```

---

## Responsive Design

**Note:** This application is **desktop-only** by design. Mobile optimization is not a priority.

### Desktop Breakpoints (for reference)

```css
--breakpoint-lg: 1024px;   /* Large desktop */
--breakpoint-xl: 1280px;   /* Extra large desktop */
--breakpoint-2xl: 1536px;  /* Ultra wide */
```

### Layout Constants

```css
--sidebar-width: 16rem;         /* 256px */
--content-max-width: 80rem;     /* 1280px */
```

---

## Accessibility

### Focus States

All interactive elements must have visible focus states:

```css
*:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}
```

### Color Contrast

- **Body text**: Minimum AA contrast (4.5:1)
- **Large text**: Minimum AA contrast (3:1)
- **UI elements**: Minimum AA contrast (3:1)

**Opacity Guidelines:**
- Avoid using less than 60% opacity for text
- Use `text-base-content/70` or higher for secondary text
- Never use `text-base-content/50` for important information

### ARIA Labels

Always provide proper ARIA labels:

```svelte
<button
  class="btn btn-circle btn-ghost"
  aria-label="Close modal"
>
  <svg>...</svg>
</button>

<nav aria-label="Main navigation">
  <!-- Navigation items -->
</nav>
```

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Maintain logical tab order
- Provide keyboard shortcuts for common actions
- Display shortcuts in tooltips or help modal

---

## Z-Index Scale

Use the z-index scale to manage layering:

```css
--z-base: 0;              /* Normal content */
--z-dropdown: 1000;       /* Dropdowns */
--z-sticky: 1020;         /* Sticky headers */
--z-fixed: 1030;          /* Fixed elements */
--z-modal-backdrop: 1040; /* Modal backdrops */
--z-modal: 1050;          /* Modals */
--z-popover: 1060;        /* Popovers */
--z-tooltip: 1070;        /* Tooltips */
--z-notification: 1080;   /* Notifications */
```

**Usage:**

```css
.dropdown-content {
  z-index: var(--z-dropdown);
}

.modal {
  z-index: var(--z-modal);
}
```

---

## Transitions & Animations

### Transition Tokens

```css
--transition-fast: 150ms;     /* Quick interactions */
--transition-base: 200ms;     /* Default transitions */
--transition-slow: 300ms;     /* Smooth animations */
--transition-slower: 500ms;   /* Dramatic effects */
```

### Easing Functions

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Usage Examples

```css
.button {
  transition: var(--button-transition);
  /* Expands to: all 200ms cubic-bezier(0.4, 0, 0.2, 1) */
}

.card {
  transition: box-shadow var(--transition-slow);
}

.modal {
  transition: opacity var(--transition-base);
}
```

---

## Best Practices

### Do's ✅

- **Always use design tokens** instead of hardcoded values
- **Maintain consistent spacing** using the spacing scale
- **Follow the icon sizing system** for visual hierarchy
- **Use semantic color names** from DaisyUI
- **Provide proper focus states** for accessibility
- **Include ARIA labels** for screen readers
- **Test keyboard navigation** for all interactive elements
- **Use inline styles** for dynamic task colors

### Don'ts ❌

- **Don't use hardcoded pixel values** (use tokens)
- **Don't use dynamic Tailwind classes** like `bg-{variable}`
- **Don't mix icon sizes** within the same context
- **Don't use text opacity below 60%** for important content
- **Don't skip ARIA labels** on icon-only buttons
- **Don't use arbitrary z-index values** (use the scale)
- **Don't create inconsistent spacing** (stick to the scale)

---

## Quick Reference

### Common Patterns

```svelte
<!-- Page Header -->
<div class="flex justify-between items-center mb-6">
  <div>
    <h1 class="text-4xl font-bold text-base-content mb-2">Page Title</h1>
    <p class="text-base-content/70">Description text</p>
  </div>
  <button class="btn btn-primary">
    <svg class="w-4 h-4 mr-2">...</svg>
    Action
  </button>
</div>

<!-- Card with Content -->
<div class="card bg-base-100 shadow-xl">
  <div class="card-body">
    <h2 class="card-title mb-4">Card Title</h2>
    <div class="space-y-4">
      <!-- Content -->
    </div>
  </div>
</div>

<!-- Stats Grid -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div class="stat bg-base-200 rounded-lg">
    <div class="stat-title">Label</div>
    <div class="stat-value text-primary">42</div>
    <div class="stat-desc">Description</div>
  </div>
</div>
```

---

## Resources

- **DaisyUI Documentation**: https://daisyui.com/
- **Tailwind CSS Documentation**: https://tailwindcss.com/
- **Design Tokens File**: `src/design-tokens.css`
- **Main Styles File**: `src/app.css`

---

**Last Updated**: 2025-10-29
**Version**: 1.0.0
