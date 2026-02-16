# Degu Landing Page

A fast, modern landing page for Degu Studio built with Astro v5.

## Tech Stack

- **Framework**: Astro v5 (server-first, zero JS by default)
- **Language**: TypeScript (strict mode)
- **Styling**: Scoped CSS with design tokens + fluid viewport scaling
- **Animation**: motion.dev springs via CSS `linear()` easing (to be migrated to GSAP)
- **Fonts**: Anton SC (display), Public Sans (body) via Google Fonts
- **i18n**: Lithuanian (default, `/`) and English (`/en/`)
- **Deployment**: Vercel

## Project Structure

```
src/
├── components/
│   ├── BodyTextContainer.astro  # Body text with fluid scaling (clamp/min)
│   ├── DeguLogo.astro           # Fixed top-right flame icon
│   ├── HeaderContainer.astro    # Viewport-scaled display text (vh/vw)
│   ├── LanguageSwitcher.astro   # EN | LT toggle with locale-aware links
│   ├── MenuCollapsed.astro      # Animated pill menu with state transitions
│   └── ScrollHint.astro         # Pill button with CSS fill animation
├── i18n/
│   ├── translations.ts          # EN + LT translation strings
│   └── utils.ts                 # Locale helpers (t, getLocalizedPath, etc.)
├── layouts/
│   └── BaseLayout.astro         # HTML layout with fonts, OG tags, hreflang
├── lib/
│   ├── analytics/config.ts      # GA4 measurement ID placeholder
│   └── animations/config.ts     # TWEAK ZONE animation constants
├── pages/
│   ├── index.astro              # Lithuanian homepage (default locale, /)
│   └── [locale]/index.astro     # English homepage (/en/)
└── styles/
    └── global.css               # Design tokens & CSS reset
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

## Fluid Scaling

The intro layout uses viewport-relative units for consistent scaling:

- **Headers**: `font-size: min(12.1vh, 18vw)` — vh on desktop, vw caps on mobile
- **Body text**: `font-size: clamp(12px, 4.2vw, 16px)` — scales down below 380px
- **Body container**: `max-width: min(11em, 34vw)` — prevents overflow on narrow screens
- **Studio-body gap**: `min(20px, 2vw)` — proportional spacing
- **Hero padding**: `2rem` sides, reduces to `1rem` at `768px`

## i18n

- **Default locale**: Lithuanian (`lt`) — served at `/` with no prefix
- **English**: served at `/en/`
- **Routing**: `prefixDefaultLocale: false` in Astro config
- All user-facing text lives in `src/i18n/translations.ts`
- Hreflang alternates and OG locale tags in `<head>`

## Progress

- [x] Step 0: Project setup, dependencies, i18n, GA placeholder
- [x] Step 1: HeaderContainer + viewport-relative typography
- [x] Step 2: BodyTextContainer, DeguLogo, LanguageSwitcher, static intro layout
- [x] Mobile scaling: fluid layout with min()/clamp() for all viewports
- [x] Locale switch: Lithuanian as default locale
- [ ] Step 3: IntroAnimation — Phase A (time-based GSAP)
- [ ] Step 4: IntroAnimation — Phase B (scroll-based)
- [ ] Step 5: PageDesktop + PageMobile + first gallery page
- [ ] Step 6: PageScrollDesktop + PageScrollMobile
- [ ] Step 7: MenuCollapsed — scroll state integration + GSAP migration
- [ ] Step 8: MenuExpanded overlay
- [ ] Step 9: ImageGallery
- [ ] Step 10: Outro section — static layout
- [ ] Step 11: OutroAnimation
- [ ] Step 12: Polish + edge cases

## Development

```bash
npm run dev       # Start dev server at localhost:4321
npm run build     # Type-check and build for production
npm run preview   # Preview production build
npm run check     # Run TypeScript checks
```

## Deployment

```bash
npx vercel --prod --name degu-astro-landing-page
```
