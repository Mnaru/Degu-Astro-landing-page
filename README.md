# Degu Landing Page

A fast, modern landing page built with Astro v5.

## Tech Stack

- **Framework**: Astro v5 (server-first, zero JS by default)
- **Language**: TypeScript (strict mode)
- **Styling**: Scoped CSS with design tokens
- **Animation**: motion.dev springs via CSS `linear()` easing
- **Fonts**: Anton SC (display), Public Sans (body) via Google Fonts

## Project Structure

```
src/
├── components/
│   ├── MenuCollapsed.astro    # Animated pill menu with state transitions
│   └── ScrollHint.astro       # Pill button with CSS fill animation
├── layouts/
│   └── BaseLayout.astro       # Base HTML layout with fonts & global CSS
├── pages/
│   └── index.astro            # Homepage with hero section
└── styles/
    └── global.css              # Design tokens & CSS reset
```

## Design Tokens

| Token              | Value     |
|--------------------|-----------|
| `--color-white`    | `#FFFFFF` |
| `--color-black`    | `#1A1A1A` |
| `--color-bg`       | `#1A1A1A` (dark) |
| `--color-text`     | `#FFFFFF` (light) |
| `--font-display`   | Anton SC  |
| `--font-body`      | Public Sans |

## Components

### ScrollHint

Pill-shaped element with a CSS-only fill animation that runs on page load (1s). White circle expands from top-center, text inverts from white to black. No JavaScript, no mouse interaction.

### MenuCollapsed

Pill-shaped menu indicator with three states (Home, Work, Contact). Uses stacked text with `translateY` sliding and motion.dev spring easing. Work state expands to show subsection labels (Key Visuals & OOH, Product photography, Social media assets). Click cycles through states for testing; will be replaced by scroll-based logic.

## Progress

- [x] Project setup (Astro v5, TypeScript strict, import aliases)
- [x] Design tokens and CSS reset
- [x] Base layout with Google Fonts
- [x] Homepage hero section
- [x] ScrollHint component
- [x] MenuCollapsed component
- [ ] Additional sections and components (TBD)

## Development

```bash
npm run dev       # Start dev server at localhost:4321
npm run build     # Type-check and build for production
npm run preview   # Preview production build
npm run check     # Run TypeScript checks
```
