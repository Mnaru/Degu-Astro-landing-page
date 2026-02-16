# Degu Studio Landing Page Specification

## Overview
A single-page scroll-driven landing site for Degu Studio. Built in Astro (v5.0+). Heavy use of scroll-linked and time-based animations. Dark background, white text, compressed bold typeface for headers.

## Tech Stack
- Framework: Astro v5.0+ (server-first, Islands Architecture)
- Animations: GSAP + ScrollTrigger (scroll-linked and time-based)
- Styling: Scoped Astro style blocks, CSS custom properties, define:vars for dynamic values
- TypeScript: Strict mode, Props interfaces on every component
- i18n: Two languages — English (en, default) and Lithuanian (lt). Astro built-in i18n routing
- Analytics: Google Analytics 4 (gtag.js)
- Responsive: Single breakpoint at 768px (below = mobile, above = desktop)
- Figma MCP: Available (see Figma Instructions section at the bottom)

## Astro Architecture Principles

### Server-First Rendering
All components render as static HTML on the server by default. Zero client JS unless explicitly needed. GSAP animations are the only client-side JS and are loaded via standard Astro `<script>` tags (bundled and deduped automatically by Astro). Do NOT use framework hydration directives (client:load, client:visible, etc.) for these components — they are pure Astro components, not React/Vue/Svelte islands.

### TypeScript Requirements
- Every .astro component MUST define a Props interface in frontmatter
- Use `import type` for all type-only imports
- Destructure props with sensible defaults in frontmatter
- Components wrapping native HTML elements must extend HTMLAttributes<'element'> and spread remaining attrs
- Constants use SCREAMING_SNAKE_CASE (e.g. INTRO_TIMED_DURATION)
- Props and variables use camelCase

### Styling Requirements
- Rely on Astro's scoped styles by default (styles in .astro files are automatically scoped)
- Use `class:list` for conditional CSS classes (e.g. mobile vs desktop states)
- Use `define:vars` to pass dynamic values from frontmatter/props into scoped CSS
- Use CSS custom properties in global.css for shared design tokens (colors, fonts, spacing)

### Internationalization (i18n)
The site supports two languages: English (en) and Lithuanian (lt). English is the default locale.

Architecture:
- Configure Astro's built-in i18n in astro.config.mjs: defaultLocale "en", locales ["en", "lt"], prefixDefaultLocale: true, fallback: { lt: "en" }
- Routes: /en/ for English, /lt/ for Lithuanian. Root / redirects to /en/
- Translation file: src/i18n/translations.ts — single object keyed by locale containing ALL user-facing strings
- Helper utilities: src/i18n/utils.ts — getLocaleFromUrl(), t(locale), getLocalizedPath()
- Pages use dynamic route [locale]/index.astro with getStaticPaths() generating both locales
- BaseLayout receives locale as a prop, sets <html lang={locale}>, includes hreflang alternate links for SEO

Rules:
- NO user-facing text may be hardcoded in components. All text comes from translations via props
- Components receive translated strings as props — they do NOT import translations directly
- Pages (in src/pages/) are responsible for reading the locale, getting translations, and passing text to components
- Animation code is language-agnostic — it targets elements by CSS class or data attribute, never by text content
- Image alt text is also translated and passed as props

Language switcher:
- Small toggle (EN | LT) positioned near the Degu logo in the top-right area
- Links to the same page in the other locale
- Must work from any scroll position without losing context

### Image Optimization
- ALL images must be imported from src/assets/ and rendered via `import { Image } from 'astro:assets'`
- Always provide explicit width and height attributes
- Use format="webp" for optimized delivery
- Use loading="lazy" for below-fold images, loading="eager" for hero/first-visible images
- Do NOT put images in public/ unless they must bypass optimization

### Script Handling
- Default `<script>` tags in .astro files are processed, bundled, and deduped by Astro
- GSAP initialization logic goes in standard `<script>` tags
- Use `is:inline` only when intentionally opting out of Astro's processing
- Import animation modules from src/lib/animations/ inside script tags

## Project Configuration

### tsconfig.json
Extend astro/tsconfigs/strict. Define path aliases for clean imports:
- @components/* -> ./src/components/*
- @layouts/* -> ./src/layouts/*
- @lib/* -> ./src/lib/*
- @assets/* -> ./src/assets/*
- @i18n/* -> ./src/i18n/*

Enable verbatimModuleSyntax: true.

### astro.config.mjs
- Configure site URL for SEO
- Configure i18n: defaultLocale "en", locales ["en", "lt"], prefixDefaultLocale: true, fallback: { lt: "en" }
- No View Transitions needed (single page, no navigation)

### Build Pipeline
Add `astro check` before build to catch type errors:
scripts.build = "astro check && astro build"
scripts.check = "astro check"

## Typography and Scaling
All header text must scale proportionally with the viewport. Use clamp() with vw/vh units so the text fills the same proportion of the screen at any size. The font is a heavy condensed/compressed typeface (check Figma for exact font family and weights).

Figma note: The Figma frame dimensions equal the viewport. Use the ratio of text size to frame size to calculate vw/vh-based font-size values.

## Global Elements

### BaseLayout (src/layouts/BaseLayout.astro)
- Wraps the entire page
- Contains <!DOCTYPE html>, <html lang={locale}>, <head>, <body>
- Props interface: { title: string; description: string; locale: string }
- Head must include: charset, viewport meta, page title, meta description, OG tags (og:title, og:description, og:image, og:url), favicon (Degu flame)
- Must include hreflang alternate links: <link rel="alternate" hreflang="en" href="/en/"> and <link rel="alternate" hreflang="lt" href="/lt/">
- Imports global.css
- Loads font files
- Includes GSAP + ScrollTrigger via `<script>` tag
- Includes Google Analytics 4 gtag.js snippet (see Analytics section below)

### Degu Logo (DeguLogo.astro)
- Positioned top-right of the viewport
- Visible throughout the experience
- White on dark background
- Props interface with optional size/class overrides

### LanguageSwitcher (LanguageSwitcher.astro)
- Props: { currentLocale: string; class?: string }
- Small text toggle (EN | LT) positioned near the Degu logo in the top-right area
- Links to the same page in the other locale (/en/ <-> /lt/)
- Active locale is visually distinct (e.g. bold or different opacity)
- Must work from any scroll position

## Sections and Flow
The page is one continuous scroll experience with 4 macro sections:
1. Intro (time-based + scroll-based animation)
2. Gallery Intro (scroll-based, timed snap)
3. Work Pages (horizontal scroll on desktop, vertical scroll on mobile)
4. Outro / Contact (time-based animation)

## Components

Every component below MUST have:
- A Props interface defined in frontmatter
- Default values for optional props
- Scoped styles (not global)
- Semantic HTML elements where appropriate

### 1. HeaderContainer
- Props: { text: string; class?: string }
- Height tied to viewport height
- Contains a single line of text (e.g. DEGU, STUDIO, DROP US, A LINE)
- Text scales to fill the full container height while preserving font aspect ratio
- Width adapts to the text length (not fixed)
- Uses viewport-relative units (clamp() with vw/vh)
- Use define:vars to pass any dynamic sizing values from props to scoped CSS

### 2. BodyTextContainer
- Props: { text: string; class?: string }
- Contains body text, typically two lines
- Intro text: "Fresh visuals to feed your ads & socials" (confirm with Figma)
- Outro text: "Don't be shy - send us an email and we'll get back to you."
- Standard body font (check Figma for family, size, weight)

### 3. ScrollHint
- Props: { class?: string }
- Pill-shaped element (already designed - check existing code/Figma)
- Has a trigger animation controlled by IntroAnimation
- Animation enters from the top

### 4. IntroAnimation (src/lib/animations/intro.ts)
This is a TypeScript module, not a component. It exports a function that initializes the GSAP timeline.

Controls the orchestration of the intro sequence. Two phases:

Phase A - Time-based (triggers on page load):
1. Two HeaderContainers (DEGU and STUDIO) appear centered vertically, stacked
2. STUDIO slides left
3. BodyTextContainer appears next to STUDIO
4. ScrollHint appears below

Phase B - Scroll-based (triggers on user scroll):
1. Both HeaderContainers scale up toward filling the viewport
2. BodyTextContainer slides right and slightly scales up until it exits viewport
3. DEGU slides left out of viewport
4. STUDIO slides right out of viewport
5. Underneath: first image of ImageGallery is revealed at ~60% viewport size
6. Image scales up to fill full viewport width and height

TWEAK ZONE - Timing Parameters (all defined in src/lib/animations/config.ts):
- INTRO_TIMED_DURATION: duration of Phase A (default: placeholder)
- INTRO_SCALE_SCROLL_DISTANCE: scroll distance for Phase B header scaling (default: placeholder)
- INTRO_SNAP_DURATION: if user scrolls during gallery scale-up, how fast it snaps to end state (default: 300ms)
- INTRO_EASING: easing function for all intro movements (default: placeholder)

### 5. GalleryIntroAnimation (src/lib/animations/galleryIntro.ts)
TypeScript module, not a component.
- Controls the scale and position of the first Page as it transitions from ~60% viewport to full viewport
- Snap behavior: If user scrolls during this timed animation, it quickly snaps to end state
- Snap speed is a tweakable parameter (see TWEAK ZONE above)

### 6. PageDesktop
- Props: { imageSrc: ImageMetadata; imageAlt: string; galleryId: string; class?: string }
- Full viewport width and height
- Image rendered via astro:assets Image component with width/height and format="webp"
- Black overlay at 10% opacity on top of the image (CSS pseudo-element or overlay div)
- Scale controlled by GalleryIntroAnimation during intro
- Use class:list for conditional state classes

### 7. PageMobile
- Props: { imageSrc: ImageMetadata; imageAlt: string; galleryId: string; class?: string }
- Same as PageDesktop but optimized for mobile viewport
- Full viewport width and height
- Image rendered via astro:assets Image component
- Black overlay at 10% opacity

### 8. PageScrollDesktop (horizontal scroll)
- Props: { class?: string }
- Contains multiple PageDesktop components arranged in a row
- On scroll down: pages slide left to reveal the next page
- Each page occupies exactly one viewport width
- Uses default <slot /> for PageDesktop children

### 9. PageScrollMobile (vertical scroll)
- Props: { class?: string }
- Contains multiple PageMobile components arranged in a column
- On scroll down: pages slide up to reveal the next page
- Each page occupies exactly one viewport height
- Uses default <slot /> for PageMobile children

### 10. ImageGallery
- Props: { galleryId: string; images: { src: ImageMetadata; alt: string }[]; class?: string }
- Trigger: Click on any PageDesktop or PageMobile
- Appears as an overlay on top of the clicked page
- Adds 30% black overlay to the page underneath
- Has padding from left, right, and top (check Figma for exact values)
- Contains images in a single column rendered via astro:assets Image component
- Each image: width takes up all available viewport width minus padding, format="webp", loading="lazy"
- Images load with staggered lazy loading (fade-in one by one)
- Max 10 images per gallery. Render all, no virtualization needed
- Close button: White circle with X icon, positioned top-right within the padded area. Must have aria-label="Close gallery"
- Close animation: Fade out (tweakable duration, default: 300ms)
- No Escape key handling required

Gallery pages (3 total):
1. Social media assets
2. Product photography
3. Key Visuals & OOH

TWEAK ZONE (in src/lib/animations/config.ts):
- GALLERY_FADE_DURATION: fade out speed on close (default: 300ms)
- GALLERY_IMAGE_STAGGER: delay between each image appearing (default: placeholder)

### 11. Menu

Two states:

Collapsed (already coded - see MenuCollapsed.astro):
- Pill-shaped, pinned to bottom center of viewport
- Shows contextual location:
  - On a Work page: "Work" + subsection name (e.g. "Social media assets")
  - On Contact section: "Contact"
- Hidden during Intro (home) section
- Updates on scroll (both directions)
- Existing code uses spring-based CSS transitions with class toggling via class:list

Expanded (MenuExpanded.astro):
- Props: { activeSection: string; class?: string }
- Full viewport overlay with dark/blurred background
- Menu items are pill-shaped buttons, stacked vertically, centered
- Items appear with staggered animation from the bottom up
- Items:
  - Home
  - Work > Social media assets
  - Work > Product photography
  - Work > Key Visuals & OOH
  - Contact
- Active item: solid white background
- Inactive items: background rgba(255, 255, 255, 0.70) with backdrop-filter blur(15px). Turn white on hover/click
- Use class:list to toggle active/inactive states
- Close button: Circle with X at the bottom. Must have aria-label="Close menu"
- Blocks all scroll while expanded
- Clicking an item navigates to that section and closes the menu
- All items must be keyboard-focusable

### 12. TeamImageContainer
- Props: { imageSrc: ImageMetadata; imageAlt: string; class?: string }
- Contains the team photo rendered via astro:assets Image component (format="webp", explicit width/height)
- In the outro layout: positioned between "DROP US" and "A LINE" HeaderContainers
- Check Figma for exact sizing and positioning relative to the headers

### 13. OutroAnimation (src/lib/animations/outro.ts)
TypeScript module, not a component.

Time-based animation sequence:
1. "DROP US" HeaderContainer enters from the right, stops at defined position
2. TeamImageContainer appears (between the two headers)
3. "A LINE" HeaderContainer enters from the right, stops at defined position
4. BodyTextContainer appears ("Don't be shy - send us an email and we'll get back to you.")
5. ContactUsButton appears below

TWEAK ZONE (in src/lib/animations/config.ts):
- OUTRO_STEP_DELAY: delay between each element appearing (default: placeholder)
- OUTRO_SLIDE_DURATION: how long headers take to slide in (default: placeholder)
- OUTRO_EASING: easing for all outro movements (default: placeholder)

### 14. ContactUsButton
- Props: { email?: string; class?: string } (email defaults to "monika@nuar.app")
- Pill-shaped, same style as ScrollHint
- Has an icon (Degu flame) + text "Email us"
- Animation: Same as ScrollHint but enters from the left instead of top
- On click: Copies email prop value to clipboard
- Feedback: Shows "Email copied" text
- Works on both desktop and mobile
- Must be a <button> element with proper aria-label

## Responsive Behavior

Desktop (>768px):
- Work pages scroll horizontally (left)
- Uses PageDesktop + PageScrollDesktop
- Menu collapsed width: 540px
- Outro layout: side by side with team photo between headers
- Typography scales with vw

Mobile (<=768px):
- Work pages scroll vertically (up)
- Uses PageMobile + PageScrollMobile
- Menu collapsed width: calc(100vw - 56px)
- Outro layout: stacked, team photo between headers
- Typography scales with vw (smaller ratios)

## Assets

All images stored in src/assets/ (NOT public/) so Astro can optimize them:

src/assets/
  images/
    logo/
      degu-flame.svg
    pages/
      social-media-hero.jpg         (hero for Social media assets page)
      product-photography-hero.jpg  (hero for Product photography page)
      key-visuals-hero.jpg          (hero for Key Visuals & OOH page)
    gallery/
      social-media/                 (up to 10 images)
      product-photography/          (up to 10 images)
      key-visuals/                  (up to 10 images)
    team/
      team-photo.jpg                (black & white)
  fonts/
    (compressed/condensed bold typeface files)

## Performance Notes
- All images via astro:assets with explicit width/height and format="webp"
- Hero images: loading="eager" for first visible page, loading="lazy" for rest
- Gallery images: loading="lazy" with staggered fade-in
- Use will-change sparingly, only on elements actively animating
- Respect prefers-reduced-motion: disable scroll animations and show static layout
- GSAP loaded via standard <script> tag (bundled and deduped by Astro)
- No unnecessary client:* hydration directives — this is a pure Astro site

## Accessibility
- Respect prefers-reduced-motion: show static layout with no scroll-linked animations
- Keyboard navigation for menu items, gallery close button, contact button
- Close buttons must have aria-label attributes
- All images must have descriptive alt text
- Use semantic HTML: <nav> for menu, <main> for content, <button> for interactive elements, <section> for page sections
- Proper heading hierarchy (h1 for site name, h2 for section headers)

## SEO
BaseLayout must include in <head>:
- <title>{translated title}</title>
- <meta name="description" content="{translated description}">
- <meta property="og:title" content="{translated title}">
- <meta property="og:description" content="{translated description}">
- <meta property="og:image" content="..."> (social share image)
- <meta property="og:url" content="..."> (locale-specific URL)
- <meta property="og:locale" content="{locale}">
- <link rel="alternate" hreflang="en" href="/en/">
- <link rel="alternate" hreflang="lt" href="/lt/">
- <link rel="alternate" hreflang="x-default" href="/en/">
- <link rel="icon" href="/favicon.svg"> (Degu flame)

## Analytics
Google Analytics 4 via gtag.js, loaded in BaseLayout <head>:
- Measurement ID stored as a constant in src/lib/analytics/config.ts (e.g. GA_MEASUREMENT_ID = "G-XXXXXXXXXX") — placeholder until real ID is provided
- Load the gtag.js script with `is:inline` and `async` to avoid Astro bundling/deduping it (it must run as a global snippet exactly as Google provides)
- Respect user privacy: only load GA in production (check import.meta.env.PROD), not in dev
- Script placement: in <head> as Google recommends, using <script is:inline> for the config call

Example snippet in BaseLayout:
```
{import.meta.env.PROD && (
  <>
    <script is:inline async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}></script>
    <script is:inline define:vars={{ GA_MEASUREMENT_ID }}>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', GA_MEASUREMENT_ID);
    </script>
  </>
)}
```

## Figma MCP Instructions

When using Figma MCP to extract design details, look for:

Frame names to find:
- Desktop - 52, Desktop - 53, Desktop - 54: Intro keyframes (initial state, mid-scroll, headers scaled up)
- Desktop - 35: Work page (desktop)
- iPhone 13 mini variants: Mobile versions of all screens
- Desktop - 55: Outro / Contact section (desktop)
- iPhone 13 variant next to Desktop - 55: Outro mobile
- Desktop - 56: ImageGallery overlay
- Frame 163: Menu expanded state

What to extract from each frame:
- Typography: Font family, font weight, font size. Calculate font size as percentage of frame width and height to derive vw/vh values
- Colors: Background colors, overlay opacities, text colors
- Spacing: Padding and margins as percentage of frame dimensions for responsive conversion
- Element positioning: X/Y coordinates as percentage of frame for responsive placement
- Border radius: On pills, buttons, menu items, close button
- Specific values needed:
  - HeaderContainer text size ratio to viewport (critical for scaling)
  - ImageGallery padding (left, right, top) as percentage of viewport
  - Menu pill dimensions and vertical spacing between items
  - Close button diameter and offset from top-right edge
  - TeamImageContainer dimensions and position between the two header containers
  - BodyTextContainer font size and line height
  - ContactUsButton pill dimensions
  - ScrollHint pill dimensions

Animation reference frames:
- Compare Desktop-52 to Desktop-53 to Desktop-54 to see intro animation keyframes
- Note position and scale differences between frames as these define animation start/end values
- Desktop-52: initial state (headers centered, small)
- Desktop-53: mid state (headers + body text visible, scroll hint visible)
- Desktop-54: headers scaled up, beginning to exit

## File Structure

```
src/
  assets/
    images/
      logo/                        Degu flame SVG
      pages/                       Hero images for 3 work pages
      gallery/
        social-media/              Up to 10 gallery images
        product-photography/       Up to 10 gallery images
        key-visuals/               Up to 10 gallery images
      team/                        Team photo
    fonts/                         Typeface files
  components/
    HeaderContainer.astro
    BodyTextContainer.astro
    ScrollHint.astro
    ContactUsButton.astro
    PageDesktop.astro
    PageMobile.astro
    PageScrollDesktop.astro
    PageScrollMobile.astro
    ImageGallery.astro
    MenuCollapsed.astro            (existing)
    MenuExpanded.astro
    TeamImageContainer.astro
    DeguLogo.astro
    LanguageSwitcher.astro
  i18n/
    translations.ts              All user-facing strings for en and lt
    utils.ts                     getLocaleFromUrl(), t(), getLocalizedPath()
  layouts/
    BaseLayout.astro               HTML shell, head, meta, OG, hreflang, fonts, global CSS
  lib/
    analytics/
      config.ts                    GA_MEASUREMENT_ID constant
    animations/
      intro.ts                     GSAP timeline + ScrollTrigger for intro
      galleryIntro.ts              Gallery scale-up animation
      pageScroll.ts                Horizontal/vertical page scrolling
      outro.ts                     GSAP timeline for outro
      config.ts                    ALL tweakable timing constants (single source of truth)
  pages/
    index.astro                    Redirect from / to /en/
    [locale]/
      index.astro                  Main page — uses getStaticPaths() to generate /en/ and /lt/
  styles/
    global.css                     CSS custom properties, reset, font-face declarations
```

IMPORTANT: src/lib/animations/config.ts is the single source of truth for all timing, easing, and duration values. Every animation module imports from here. This makes tweaking easy - one file to change.

## Import Conventions
Follow this order in all .astro frontmatter:
1. Astro/framework imports (astro:assets, astro:content)
2. External dependencies (gsap, etc.)
3. Internal components (alphabetical)
4. Utilities and types (from @lib/)
5. Assets (from @assets/)

Example:
```
---
import { Image } from 'astro:assets';
import type { HTMLAttributes } from 'astro/types';

import HeaderContainer from '@components/HeaderContainer.astro';
import BodyTextContainer from '@components/BodyTextContainer.astro';

import { t } from '@i18n/utils';
import { INTRO_TIMED_DURATION } from '@lib/animations/config';

import heroImage from '@assets/images/pages/social-media-hero.jpg';

const { locale } = Astro.params;
const i18n = t(locale);
---
```
