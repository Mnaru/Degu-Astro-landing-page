# Degu Landing Page

A fast, modern landing page built with Astro v5.

## Tech Stack

- **Framework**: Astro v5 (server-first, zero JS by default)
- **Language**: TypeScript (strict mode)
- **Styling**: Scoped CSS with design tokens
- **Fonts**: Anton SC (display), Public Sans (body) via Google Fonts

## Project Structure

```
src/
├── components/
│   └── ScrollHint.astro      # Pill button with CSS fill animation
├── layouts/
│   └── BaseLayout.astro      # Base HTML layout with fonts & global CSS
├── pages/
│   └── index.astro           # Homepage with hero section
└── styles/
    └── global.css             # Design tokens & CSS reset
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

## Progress

- [x] Project setup (Astro v5, TypeScript strict, import aliases)
- [x] Design tokens and CSS reset
- [x] Base layout with Google Fonts
- [x] Homepage hero section
- [x] ScrollHint component
- [ ] Additional sections and components (TBD)

## Development

```bash
npm run dev       # Start dev server at localhost:4321
npm run build     # Type-check and build for production
npm run preview   # Preview production build
npm run check     # Run TypeScript checks
```
