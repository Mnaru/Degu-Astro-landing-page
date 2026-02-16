# Degu Landing Page — Implementation Plan (Adjusted)

Based on project audit. Use alongside degu-spec.md. Complete each step fully before moving to the next. Each step ends with a visual checkpoint you can verify in the browser.

The site supports two languages: **English (en)** and **Lithuanian (lt)**. English is the default locale. All user-facing text must come from translation files, never hardcoded in components.

---

## Step 0: Project Cleanup + Dependencies + i18n Setup
**Goal:** Clean up existing project, get dependencies right, and set up the i18n foundation.

**Already done (do not redo):**
- Astro v5 installed and configured
- tsconfig.json with strict mode + path aliases (@components/*, @layouts/*, @lib/*, @assets/*)
- astro check in build scripts
- global.css with CSS reset and design tokens (--color-white, --color-black, --color-bg, --color-text, --font-display, --font-body)
- BaseLayout.astro with title, meta description, favicon, Google Fonts (Anton SC, Public Sans), global.css import
- ScrollHint.astro exists (CSS-only pill with fill animation)
- MenuCollapsed.astro exists (state-based pill menu with motion.dev springs)
- index.astro exists with basic hero
- public/favicon.svg exists
- src/i18n/ folder exists (empty)

**Tasks:**

Dependencies and cleanup:
- Install GSAP and @gsap/scrolltrigger as dependencies
- Do NOT remove the motion package yet — MenuCollapsed.astro currently depends on it. We will migrate it to GSAP later (Step 7) to avoid breaking existing code
- Delete Layout.astro (unused legacy duplicate)
- Create missing folders: src/lib/animations/, src/lib/analytics/, src/assets/images/logo/, src/assets/images/pages/, src/assets/images/gallery/, src/assets/images/team/, src/assets/fonts/

Google Analytics:
- Create src/lib/analytics/config.ts with a placeholder GA_MEASUREMENT_ID constant (e.g. "G-XXXXXXXXXX"). Add a comment that this needs to be replaced with the real ID before going live
- Add GA4 gtag.js snippet to BaseLayout.astro <head>:
  - Only load in production (gate behind import.meta.env.PROD)
  - Use <script is:inline async> for the gtag.js loader and config call (must not be bundled by Astro)
  - Import GA_MEASUREMENT_ID from config and pass via define:vars

i18n setup:
- Configure i18n in astro.config.mjs:
  - defaultLocale: "en"
  - locales: ["en", "lt"]
  - routing: { prefixDefaultLocale: true } (so URLs are /en/ and /lt/)
  - Enable fallback: { lt: "en" } so missing Lithuanian translations fall back to English
- Create src/i18n/translations.ts exporting a translations object keyed by locale. Structure:
  ```
  export const translations = {
    en: {
      meta: {
        title: "Degu Studio",
        description: "Fresh visuals to feed your ads & socials",
      },
      intro: {
        header1: "DEGU",
        header2: "STUDIO",
        body: "Fresh visuals to feed your ads & socials",
        scrollHint: "Scroll",
      },
      work: {
        menuLabel: "Work",
        pages: {
          socialMedia: { title: "Social media assets", imageAlt: "..." },
          productPhotography: { title: "Product photography", imageAlt: "..." },
          keyVisuals: { title: "Key Visuals & OOH", imageAlt: "..." },
        },
      },
      outro: {
        header1: "DROP US",
        header2: "A LINE",
        body: "Don't be shy - send us an email and we'll get back to you.",
        emailButton: "Email us",
        emailCopied: "Email copied",
        teamImageAlt: "Degu Studio team",
      },
      menu: {
        home: "Home",
        work: "Work",
        contact: "Contact",
      },
      gallery: {
        close: "Close gallery",
      },
    },
    lt: {
      // Lithuanian translations — same structure, translated values
      // Fill in with actual Lithuanian text (placeholder for now)
    },
  } as const;
  ```
- Create src/i18n/utils.ts with helper functions:
  - `getLocaleFromUrl(url: URL): string` — extracts locale from the current page URL
  - `t(locale: string)` — returns the translations object for that locale
  - `getLocalizedPath(path: string, locale: string): string` — builds a localized URL
- Update page routing:
  - Move src/pages/index.astro to src/pages/[locale]/index.astro (dynamic route)
  - Or create src/pages/en/index.astro and src/pages/lt/index.astro that share the same layout
  - Use Astro's getStaticPaths() to generate both /en/ and /lt/ routes
  - Add a redirect from / to /en/ (or the user's preferred locale)
- Update BaseLayout.astro:
  - Accept locale as a prop: Props { title: string; description: string; locale: string }
  - Set <html lang={locale}>
  - Add OG meta tags: og:title, og:description, og:image, og:url (all from translations)
  - Add <link rel="alternate" hreflang="en" href="/en/"> and <link rel="alternate" hreflang="lt" href="/lt/"> for SEO
- Add a language switcher:
  - Simple link/button that switches between /en/ and /lt/
  - Position: near the Degu logo (top-right area) or as part of the menu. Check with Figma if a position is designed; if not, place it next to the logo as a small text toggle (EN | LT)

Config:
- Create src/lib/animations/config.ts with all TWEAK ZONE constants as named exports with placeholder defaults (INTRO_TIMED_DURATION, INTRO_SNAP_DURATION, INTRO_SCALE_SCROLL_DISTANCE, INTRO_EASING, GALLERY_FADE_DURATION, GALLERY_IMAGE_STAGGER, OUTRO_STEP_DELAY, OUTRO_SLIDE_DURATION, OUTRO_EASING). Add comments explaining what each controls

Note on fonts: keep Google Fonts CDN approach (Anton SC for display, Public Sans for body). No need to switch to local files.

**Checkpoint:** Project builds cleanly. Both /en/ and /lt/ routes render. <html lang> is correct for each. OG tags and hreflang alternates present in <head>. GA script is NOT present in dev mode but IS present in production build output (check with `astro build` then inspect dist/ HTML). GSAP is importable. config.ts exists with all constants. Translation helper returns correct strings for each locale.

---

## Step 1: HeaderContainer + Typography Scaling
**Goal:** The most critical visual component — text that scales with viewport.

Tasks:
- Use Figma MCP to extract: font weight and text size ratios relative to frame dimensions from Desktop - 53 (DEGU and STUDIO visible). Font family is already known: Anton SC (--font-display)
- Build HeaderContainer.astro with Props interface { text: string; class?: string }
- The text prop receives its value from the translation system (passed by the page), NOT hardcoded
- Implement viewport-responsive text scaling using clamp() with vw/vh
- Text must fill container height while preserving font aspect ratio
- Container width must adapt to text length
- In the page file ([locale]/index.astro), get translations for current locale and pass translated header text to HeaderContainer:
  ```
  const { locale } = Astro.params;
  const i18n = t(locale);
  ---
  <HeaderContainer text={i18n.intro.header1} />
  <HeaderContainer text={i18n.intro.header2} />
  ```
- Remove the existing h1 "Degu" and paragraph from the page (replaced by HeaderContainer and BodyTextContainer)

**Checkpoint:** Both /en/ and /lt/ show correct header text (DEGU/STUDIO in both unless Lithuanian has different text). Resize browser — text scales proportionally. Compare against Figma Desktop - 53.

---

## Step 2: BodyTextContainer + Static Intro Layout
**Goal:** Complete the static intro layout (no animation yet).

Tasks:
- Use Figma MCP to extract: body text sizes, positioning from Desktop - 53 for both desktop and mobile
- Build BodyTextContainer.astro with Props interface { text: string; class?: string }
- Build DeguLogo.astro (flame icon positioned top-right, use existing favicon.svg or extract from Figma). Props { class?: string }
- Add the language switcher next to DeguLogo (or wherever designed). It should link to the same page in the other language (e.g. on /en/ it links to /lt/ and vice versa)
- Note: ScrollHint.astro already exists — review it and adjust if needed to match Figma. Keep its existing CSS fill animation for now
- Arrange all elements in the page to match Desktop - 53 layout:
  - DeguLogo top-right + language switcher
  - DEGU HeaderContainer centered
  - STUDIO HeaderContainer below, offset left
  - BodyTextContainer with translated intro body text next to STUDIO
  - ScrollHint below
- All visible text comes from translations (including any ScrollHint label if it has one)
- Check layout at mobile breakpoint against iPhone Figma frames

**Checkpoint:** Static page matches Desktop - 53 Figma frame. Both /en/ and /lt/ show correct translated text. Language switcher navigates between them. Mobile layout adapts.

---

## Step 3: IntroAnimation — Phase A (Time-Based)
**Goal:** Page load animation that brings elements in.

Tasks:
- Create src/lib/animations/intro.ts that exports an initialization function
- Implement Phase A GSAP timeline:
  1. Initial state: DEGU and STUDIO centered and stacked (match Desktop - 52 from Figma)
  2. STUDIO slides left
  3. BodyTextContainer fades in / appears next to STUDIO
  4. ScrollHint appears with its animation (enters from top)
  5. End state matches Desktop - 53
- Wire intro.ts in a <script> tag in the page (import and call the init function)
- All timing values imported from config.ts
- Implement prefers-reduced-motion: skip animation, show end state immediately
- Note: Animation code is language-agnostic — it moves elements by CSS class/data attribute, not by text content. Same animation works for both locales.

**Checkpoint:** Refresh the page — intro animation plays, ends at Desktop - 53 state. Works on both /en/ and /lt/. Change values in config.ts and confirm they take effect. Enable "reduce motion" in OS — animation skips.

---

## Step 4: IntroAnimation — Phase B (Scroll-Based)
**Goal:** Scrolling continues the intro and transitions toward the gallery.

Tasks:
- Use Figma MCP to extract scale/position differences between Desktop - 53 and Desktop - 54
- Add Phase B to intro.ts using GSAP ScrollTrigger:
  1. Both HeaderContainers scale up
  2. BodyTextContainer slides right + scales slightly until it exits viewport
  3. DEGU slides left out of viewport
  4. STUDIO slides right out of viewport
- Add a placeholder div (colored rectangle, ~60% viewport) for where the first gallery page will appear
- Placeholder scales up to fill full viewport as scroll continues
- Snap behavior: if user scrolls during scale-up, it snaps to end state (INTRO_SNAP_DURATION from config)
- Must work in reverse on scroll up

**Checkpoint:** Scroll down — headers scale up, body text exits, headers exit left/right, placeholder scales to full viewport. Scroll back up — reverses smoothly. Fast scroll during scale-up snaps correctly. Works on both /en/ and /lt/.

---

## Step 5: PageDesktop + PageMobile + First Gallery Page
**Goal:** Build work page components with real images.

Tasks:
- Use Figma MCP to extract page layout from Desktop - 35 and iPhone 13 variant
- Add hero images for 3 work pages to src/assets/images/pages/
- Build PageDesktop.astro: Props { imageSrc: ImageMetadata; imageAlt: string; galleryId: string; class?: string }
  - Full viewport width/height
  - Image via astro:assets (format="webp", explicit dimensions, loading attribute)
  - imageAlt comes from translations (passed by the page)
  - 10% black overlay via CSS
- Build PageMobile.astro: same Props, mobile optimized
- Replace placeholder rectangle from Step 4 with actual first PageDesktop/PageMobile
- Create src/lib/animations/galleryIntro.ts to control the scale transition from ~60% to full viewport

**Checkpoint:** Scroll through intro — first work page (real image with overlay) appears and scales to full viewport. Image alt text is correct for current locale. Works on mobile too.

---

## Step 6: PageScrollDesktop + PageScrollMobile
**Goal:** Horizontal (desktop) and vertical (mobile) page scrolling through all 3 work pages.

Tasks:
- Create src/lib/animations/pageScroll.ts
- Build PageScrollDesktop.astro: slot-based, contains 3 PageDesktop components in a row, GSAP ScrollTrigger for horizontal scroll on vertical scroll input
- Build PageScrollMobile.astro: slot-based, contains 3 PageMobile components in a column, vertical scroll
- Each page = one viewport width (desktop) or height (mobile)
- Wire into page file after intro section. Pass translated imageAlt values from translations to each Page component
- Must work in reverse on scroll up
- Last page exits viewport to the left (desktop) or top (mobile) to transition to outro

**Checkpoint:** Desktop — scroll down moves through 3 full-screen pages horizontally. Mobile — vertical. Scroll up reverses. Each page shows correct hero image. Alt text is locale-appropriate.

---

## Step 7: MenuCollapsed — Scroll State Integration
**Goal:** Migrate MenuCollapsed from click-to-cycle test mode to real scroll-driven state changes.

Tasks:
- Refactor MenuCollapsed.astro:
  - Accept locale-aware labels as props or read from translations
  - Props should include translated section names: { locale: string; class?: string }
  - Component reads translations internally using the locale prop to get menu labels
- Driven by ScrollTrigger instead of click events
- Migrate the spring animations from motion.dev to GSAP (so we can remove the motion dependency)
- Menu appears when user reaches Work section (hidden during Intro)
- State updates on scroll (using translated labels):
  - Page 1: t(locale).menu.work + t(locale).work.pages.socialMedia.title
  - Page 2: t(locale).menu.work + t(locale).work.pages.productPhotography.title
  - Page 3: t(locale).menu.work + t(locale).work.pages.keyVisuals.title
  - Outro: t(locale).menu.contact
- Works on scroll up too
- Pinned to bottom center of viewport

**Checkpoint:** Scroll through whole page — menu appears at Work with correct translated labels, changes per page, shows translated Contact at outro. Works on both /en/ and /lt/. After confirming, remove the motion package from package.json.

---

## Step 8: MenuExpanded
**Goal:** Full menu overlay with navigation.

Tasks:
- Use Figma MCP to extract layout from Frame 163
- Build MenuExpanded.astro: Props { activeSection: string; locale: string; class?: string }
- All menu item labels come from translations
- Full viewport overlay with blurred background
- Pill-shaped items with staggered bottom-up GSAP entrance animation
- Active item: solid white
- Inactive items: rgba(255, 255, 255, 0.70) + backdrop-filter blur(15px), white on hover/click
- Close button: circle with X at bottom, aria-label from translations (or a universal "Close" / "X")
- While open: block all page scroll
- Click item: GSAP scrollTo target section, close menu
- Keyboard: items must be focusable, tab navigation
- Language switcher should also be accessible from expanded menu (optional — check if designed)
- Wire: click on MenuCollapsed opens MenuExpanded

**Checkpoint:** Click collapsed menu — expanded overlay with staggered animation. Labels are in correct language. Click different section — closes and scrolls there. Works on both /en/ and /lt/.

---

## Step 9: ImageGallery
**Goal:** Clickable pages open scrollable image gallery overlay.

Tasks:
- Use Figma MCP to extract gallery layout from Desktop - 56
- Add gallery images to src/assets/images/gallery/ subfolders (up to 10 per page)
- Build ImageGallery.astro: Props { galleryId: string; images: { src: ImageMetadata; alt: string }[]; class?: string }
- Image alt text comes from translations (passed by the page)
- 30% black overlay on page underneath
- Images in single column, full width minus padding, astro:assets Image, format="webp", loading="lazy"
- Staggered fade-in on load
- Close button: white circle with X, top-right, aria-label from translations
- Close: fade out (GALLERY_FADE_DURATION from config)
- Page scroll frozen while gallery is open
- Wire click on PageDesktop/PageMobile to open associated gallery

**Checkpoint:** Click any work page — gallery overlay appears, images fade in one by one. Alt text is locale-correct. Close button works. Works on mobile.

---

## Step 10: Outro Section — Static Layout
**Goal:** Contact/outro section layout without animation.

Tasks:
- Use Figma MCP to extract layout from Desktop - 55 and mobile variant
- Add team photo to src/assets/images/team/
- Build TeamImageContainer.astro: Props { imageSrc: ImageMetadata; imageAlt: string; class?: string }
- Build ContactUsButton.astro: Props { email?: string; label?: string; feedbackText?: string; class?: string }
  - label defaults to translated "Email us", feedbackText defaults to translated "Email copied"
  - email defaults to "monika@nuar.app"
  - Pill shape with Degu flame icon + label text
  - <button> with aria-label
  - On click: copy email to clipboard, show feedbackText
- Arrange in page file, passing all text from translations:
  - HeaderContainer with t(locale).outro.header1 ("DROP US" / Lithuanian equivalent)
  - TeamImageContainer with t(locale).outro.teamImageAlt
  - HeaderContainer with t(locale).outro.header2 ("A LINE" / Lithuanian equivalent)
  - BodyTextContainer with t(locale).outro.body
  - ContactUsButton with translated label and feedback
- Match Figma for desktop and mobile

**Checkpoint:** Scroll to bottom — static outro matches Figma. Text is correct for current locale. Click "Email us" — email copied, feedback shows in correct language. Check /lt/ has Lithuanian text. Works on mobile.

---

## Step 11: OutroAnimation
**Goal:** Animate the outro entrance.

Tasks:
- Create src/lib/animations/outro.ts
- ScrollTrigger onEnter triggers time-based sequence:
  1. "DROP US" slides in from right
  2. TeamImageContainer appears
  3. "A LINE" slides in from right
  4. BodyTextContainer appears
  5. ContactUsButton appears (from left, same style as ScrollHint but horizontal)
- All timing from config.ts
- Respect prefers-reduced-motion
- Animation is language-agnostic (moves elements by selector, not by content)

**Checkpoint:** Scroll to outro — elements animate in sequentially. Works on both locales. Tweak config.ts values. Reduce motion skips animation.

---

## Step 12: Polish + Edge Cases
**Goal:** Final quality pass.

Tasks:
- Test full scroll journey (intro -> pages -> outro) on desktop and mobile
- Test full reverse scroll
- Test fast/aggressive scrolling
- Test prefers-reduced-motion for entire page
- Test keyboard navigation: menu items, gallery close, contact button
- Verify all images have locale-appropriate alt text
- Verify all interactive elements have aria-labels
- Verify <head> tags on both /en/ and /lt/: title, meta description, OG tags, hreflang alternates, favicon, correct <html lang>
- Verify GA4 script: present in production build, absent in dev. Confirm GA_MEASUREMENT_ID placeholder is noted for replacement before launch
- Verify language switcher works from every section of the page
- Check that / redirects to /en/ (or preferred default)
- Fill in any remaining Lithuanian translation placeholders with real translations
- Run astro check — fix all type errors
- Run astro build — verify clean production build
- Test on real mobile device if possible
- Check will-change is only on actively animating elements
- Compare every section against Figma one final time
- Remove any unused code, test placeholders, or console.logs

**Checkpoint:** Full experience works smoothly end to end in both English and Lithuanian. Accessibility passes. Build succeeds. Matches Figma. Language switching works from any scroll position.
