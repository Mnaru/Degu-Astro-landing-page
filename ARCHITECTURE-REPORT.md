# Architecture Report

## 1. Project Structure

### Top-level directory

```
.astro/              # Astro build cache / generated types
.claude/             # Claude Code config
.git/
.vercel/
.vscode/
dist/                # Build output
node_modules/
public/              # Empty — no static assets here
src/                 # Source code (see below)
astro.config.mjs
package.json
tsconfig.json
vercel.json
```

### `src/` subdirectories

```
src/
├── assets/
│   ├── fonts/
│   │   ├── JetBrainsMono-Bold.ttf
│   │   ├── ThatThatNewPixelFamily-Round.otf
│   │   └── fonnts.com-Obviously_Cond_Supr.otf
│   └── images/
│       ├── logo/Logo.png
│       └── team/TeamPhoto.png
├── components/
│   ├── BodyTextContainer.astro
│   ├── DeguLogo.astro
│   ├── EmailUsButton.astro
│   ├── FluidBackground.astro
│   ├── FollowUsButton.astro
│   ├── Header.astro
│   ├── HeaderContainer.astro
│   ├── HeaderContainerStudio.astro
│   ├── Hero.astro
│   ├── LanguageSwitcher.astro
│   ├── Outro.astro
│   ├── OutroBodyTextContainer.astro
│   ├── OutroHeaderContainer.astro
│   ├── OutroStudioContainer.astro
│   └── ScrollHint.astro
├── i18n/
│   ├── translations.ts
│   └── utils.ts
├── lib/
│   ├── analytics/config.ts
│   ├── animations/
│   │   ├── heroExit.ts      # Gutted — no-op placeholder
│   │   └── heroIntro.ts
│   └── fluid/
│       ├── config.ts
│       └── fluidSim.ts
├── pages/
│   └── [locale]/index.astro  # Single dynamic route for both languages
└── styles/
    └── global.css
```

### Naming conventions

- Components: **PascalCase** `.astro` files (e.g. `HeaderContainer.astro`, `EmailUsButton.astro`).
- Lib modules: **camelCase** `.ts` files (e.g. `heroIntro.ts`, `fluidSim.ts`).
- No `src/layouts/` directory exists. The page file (`[locale]/index.astro`) acts as its own layout with a full `<html>` document.
- No `src/content/` directory or content collection config exists.

### Directories referenced in tsconfig but not yet created

- `src/layouts/` — path alias `@layouts/*` is configured but the directory does not exist.

---

## 2. Page Composition

### Main page file

`src/pages/[locale]/index.astro`

### Component render order (exact)

```html
<body>
  <FluidBackground />          <!-- Fixed background canvas (z-index: 0) -->
  <Header locale={locale} />   <!-- Fixed header (z-index: 100) -->
  <Hero>                        <!-- Section 1: Intro -->
    <HeaderContainer />         <!--   "DEGU" -->
    <div class="hero-row">
      <HeaderContainerStudio /> <!--   "STUDIO" -->
      <BodyTextContainer />     <!--   Body text -->
    </div>
    <ScrollHint />              <!--   "Scroll" hint -->
  </Hero>
  <!-- NOTHING between Hero and Outro -->
  <Outro locale={locale}>      <!-- Section 2: Outro / Contact -->
    <div class="outro-content">
      <OutroHeaderContainer />  <!--   "DROP US" / "PARAŠYK" -->
      <OutroStudioContainer />  <!--   "A LINE" / "MUMS" -->
      <OutroBodyTextContainer /><!--   Body text -->
      <div class="outro-buttons">
        <EmailUsButton />       <!--   Copy email -->
        <FollowUsButton />      <!--   Instagram link -->
      </div>
    </div>
  </Outro>
</body>
```

**There is nothing between Hero and Outro.** The gallery will be inserted between them.

### Import style

All components are imported via the `@components/*` path alias:

```ts
import Hero from '@components/Hero.astro';
```

Translation function imported via `@i18n/utils`:

```ts
import { t } from '@i18n/utils';
const i18n = t(locale);
```

Translatable strings are passed to components as props (e.g. `text={i18n.intro.header1}`).

---

## 3. Internationalization (i18n)

### Implementation approach

**Dynamic route with `getStaticPaths`**. A single page file at `src/pages/[locale]/index.astro` generates static pages for both locales:

```ts
export const getStaticPaths = (() => {
  return [
    { params: { locale: 'en' } },
    { params: { locale: 'lt' } },
  ];
}) satisfies GetStaticPaths;
```

### Languages

- **Lithuanian (`lt`)** — default locale
- **English (`en`)**

### Translation strings

**File:** `src/i18n/translations.ts`

**Format:** A single TypeScript object `translations` with top-level keys `en` and `lt`. Each contains nested objects for sections: `meta`, `intro`, `work`, `outro`, `menu`, `nav`, `gallery`.

**Existing `work` section** already contains gallery-related translations with this structure:

```ts
work: {
  menuLabel: 'Work',
  pages: {
    socialMedia: {
      title: 'Social media assets',
      imageAlt: 'Social media assets by Degu Studio',
      gallery: ['alt text 1', 'alt text 2', ...],
    },
    productPhotography: { title, imageAlt, gallery: [...] },
    keyVisuals: { title, imageAlt, gallery: [...] },
  },
}
```

The `gallery` key inside each page contains an array of strings (image alt text / descriptions). Both `en` and `lt` locales have matching structures.

There is also a top-level `gallery` key with just `{ close: 'Close gallery' }`.

### Default language

`lt` is the default locale, set in both:
- `src/i18n/utils.ts`: `const defaultLocale: Locale = 'lt'`
- `astro.config.mjs`: `defaultLocale: 'lt'`

### Language switching

`LanguageSwitcher.astro` renders LT/EN links using `getLocalizedPath()` which produces paths like `/lt/` and `/en/`.

### Routing note

`astro.config.mjs` has `prefixDefaultLocale: false`, but `vercel.json` rewrites `/` to `/lt`. In practice, both locales use prefixed paths (`/lt/`, `/en/`).

### How to add translatable text for the gallery

Add strings under `work.pages.{galleryName}` in `src/i18n/translations.ts` for both `en` and `lt`. Access via `i18n.work.pages.socialMedia.title` etc. The structure already exists and supports it.

---

## 4. Content Collections

### `src/content.config.ts`

**Does not exist.**

### `src/content/config.ts`

**Does not exist.**

### `src/content/` directory

**Does not exist.**

No content collections are defined anywhere in the project. All data currently lives in `src/i18n/translations.ts` as a plain TypeScript object.

---

## 5. Asset Handling

### Image component usage

Two components use Astro's built-in `Image` component from `astro:assets`:

- `DeguLogo.astro`: `import { Image } from 'astro:assets'` + `import logo from '@assets/images/logo/Logo.png'`
- `Outro.astro`: `import { Image } from 'astro:assets'` + `import teamPhoto from '../assets/images/team/TeamPhoto.png'`

Both use ESM imports for the image source, which enables Astro's automatic image optimization.

### Image asset location

All images are in `src/assets/images/` (processed by Astro's asset pipeline):

```
src/assets/images/
├── logo/Logo.png
└── team/TeamPhoto.png
```

The `public/` directory is **empty** — no static image assets.

### Gallery images

**Do not exist yet.** The `src/assets/images/gallery/` directory is not present. However, the translation file references three gallery categories with image counts:
- `socialMedia`: 6 gallery items
- `productPhotography`: 5 gallery items
- `keyVisuals`: 2 gallery items (though only 2 alt texts; the title says "Key Visuals & OOH")

### Image optimization settings

No custom image optimization settings in `astro.config.mjs`. Uses Astro defaults.

---

## 6. Styling Approach

### Tailwind

**Not installed.** No Tailwind config file, no `@astrojs/tailwind` integration, no Tailwind in `package.json`.

### Global styles

**File:** `src/styles/global.css`

Imported in the page file:

```ts
import '../../styles/global.css';
```

Contains:
- **`@font-face` declarations** for three fonts: ObviouslyDemo, PP Editorial New, JetBrains Mono
- **CSS custom properties** (design tokens) on `:root`:
  - Colors: `--color-white`, `--color-black`, `--color-offwhite` (`#E4E4E4`), `--color-orange` (`#E82D02`), `--color-bg`, `--color-text`
  - Fonts: `--font-display` (ObviouslyDemo), `--font-body` (JetBrains Mono), `--font-serif` (PP Editorial New)
  - Optical alignment: `--optical-adjust-display` (`-0.02em`), `--optical-adjust-serif` (`0.01em`)
- **CSS reset** (box-sizing, margin, padding)
- **GSAP helper**: `[data-gsap] { visibility: hidden }` — elements with `data-gsap` attribute are hidden until GSAP reveals them
- **Reduced motion**: Global `prefers-reduced-motion` override + `[data-gsap]` made visible

### Component styling

All components use **scoped `<style>` blocks** (Astro default scoping). No Tailwind classes. Components use the CSS custom properties from `global.css`.

### Fluid responsive sizing pattern

Components use `max()`, `clamp()`, and `calc()` with `vw` units for fluid sizing. Example:

```css
font-size: max(160px, calc(76.67px + 12.037vw));
padding: max(15px, calc(10px + 1.389vw));
```

---

## 7. Client-Side JS Patterns

### Script pattern

Components use **inline `<script>` tags** (Astro's default — bundled and deduped). No framework islands (`client:*` directives) are used on the main page despite React being installed.

### Animation library

**GSAP v3.14.2** is installed and actively used.

- `src/lib/animations/heroIntro.ts` — Complex GSAP timeline for hero entrance animation (slide-apart, elastic snap-back, staggered reveals). Uses `gsap.context()` for cleanup scoping.
- `src/lib/animations/heroExit.ts` — Currently a no-op placeholder (`// gutted for now, will be rebuilt later`).
- `src/components/ScrollHint.astro` — Inline GSAP script for a 3D cylinder text rotation animation. Creates a `gsap.timeline({ repeat: -1, paused: true })` and exposes it via `(hint as any)._scrollHintTl` so `heroIntro.ts` can trigger it.
- `src/components/FluidBackground.astro` — WebGL fluid simulation using `gpu-io`, not GSAP.

### Other JS libraries installed

- **`@react-spring/web`** and **`@use-gesture/react`** — in `package.json` but no usage found in current components.
- **`react`** and **`react-dom`** — installed, `@astrojs/react` integration enabled, but no React components (`.tsx`/`.jsx`) exist in the project.

### Scroll-based patterns

- `heroIntro.ts` hijacks scroll during the intro animation (`document.body.style.overflow = 'hidden'`), listens for `wheel` and `touchmove` to accelerate the timeline, then restores scrolling on complete.
- No `IntersectionObserver` usage found.
- No `ScrollTrigger` (GSAP plugin) usage found.

### GSAP anti-flash pattern

Elements that GSAP will animate get the `data-gsap` attribute, which hides them via CSS (`visibility: hidden`). GSAP then reveals them with `gsap.set(el, { autoAlpha: 1 })` when the animation is ready.

---

## 8. Config Files

### `astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  site: 'https://degu.lt',
  i18n: {
    defaultLocale: 'lt',
    locales: ['en', 'lt'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
```

- **Output mode:** Static (default — no `output` key).
- **Integrations:** `@astrojs/react` only.
- **No image service config** — uses Astro defaults.

### `tsconfig.json`

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "verbatimModuleSyntax": true,
    "paths": {
      "@components/*": ["./src/components/*"],
      "@layouts/*": ["./src/layouts/*"],
      "@lib/*": ["./src/lib/*"],
      "@assets/*": ["./src/assets/*"],
      "@i18n/*": ["./src/i18n/*"]
    }
  }
}
```

- **Strictness:** `astro/tsconfigs/strict`
- **Path aliases:** `@components`, `@layouts`, `@lib`, `@assets`, `@i18n`
- **`verbatimModuleSyntax: true`** — requires `import type` for type-only imports.

### `package.json`

```json
{
  "name": "degu-landing-page",
  "type": "module",
  "version": "0.0.1",
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "check": "astro check",
    "preview": "astro preview"
  },
  "dependencies": {
    "@astrojs/react": "^4.4.2",
    "@react-spring/web": "^10.0.3",
    "@use-gesture/react": "^10.3.1",
    "astro": "^5.0.0",
    "gpu-io": "^0.2.7",
    "gsap": "^3.14.2",
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.0",
    "typescript": "^5.7.0"
  }
}
```

**Key dependencies for the gallery:**
- `gsap` — animation library already in use
- `@react-spring/web` + `@use-gesture/react` — installed but unused (potentially intended for gallery gestures)
- `react` + `@astrojs/react` — React island support available but not yet used

### `vercel.json`

```json
{
  "rewrites": [
    { "source": "/", "destination": "/lt" }
  ]
}
```

Root URL rewrites to the Lithuanian locale.
