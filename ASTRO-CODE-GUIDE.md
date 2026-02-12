# Astro Style Guide

> A comprehensive style guide based on the latest Astro documentation and community best practices for the Degu Landing Page project.

## Table of Contents

- [Philosophy](#philosophy)
- [Project Structure](#project-structure)
- [Component Structure](#component-structure)
- [TypeScript Best Practices](#typescript-best-practices)
- [Content Collections](#content-collections)
- [Props and Data Flow](#props-and-data-flow)
- [Slots and Composition](#slots-and-composition)
- [Performance Optimization](#performance-optimization)
- [Styling](#styling)
- [Naming Conventions](#naming-conventions)
- [Imports](#imports)
- [Client-Side JavaScript](#client-side-javascript)

---

## Philosophy

### Core Principles

Astro's design philosophy emphasizes:

1. **Content-driven**: Optimize for content-rich websites (blogs, marketing, e-commerce)
2. **Server-first**: Leverage server rendering for better performance
3. **Fast by default**: Zero JavaScript footprint by default
4. **Progressive enhancement**: Add interactivity only where needed
5. **Developer-focused**: Intuitive APIs and excellent tooling

### When to Use Astro

✅ **Best for:**
- Marketing sites and landing pages
- Blog and documentation sites
- E-commerce storefronts
- Content-heavy applications
- Static site generation with optional SSR

❌ **Consider alternatives for:**
- Highly interactive real-time apps
- Complex state management requirements
- Native-like application experiences

---

## Project Structure

### Recommended Structure

```
project/
├── public/              # Static assets (images, fonts, etc.)
├── src/
│   ├── components/      # Reusable Astro & framework components
│   ├── layouts/         # Page layouts
│   ├── pages/           # File-based routing
│   ├── styles/          # Global styles
│   ├── lib/             # Utility functions & helpers
│   ├── i18n/            # Internationalization
│   └── env.d.ts         # TypeScript environment definitions
├── astro.config.mjs     # Astro configuration
├── tsconfig.json        # TypeScript configuration
└── package.json
```

### Best Practices

- **Use `src/pages/` for routing**: File-based routing is automatic
- **Keep components modular**: One component per file
- **Organize by feature**: Group related components together
- **Use `public/` for static assets**: Files are served as-is
- **Separate concerns**: Keep layouts, components, and utilities organized

---

## Component Structure

### Basic Component Anatomy

Every Astro component has two main parts:

```astro
---
// 1. Component Script (Frontmatter)
// - Runs at build time (server-side only)
// - Import other components
// - Fetch data
// - Define props

import SomeComponent from '../components/SomeComponent.astro';

interface Props {
  title: string;
  description?: string;
}

const { title, description = 'Default description' } = Astro.props;
---

<!-- 2. Component Template (HTML + JSX-like expressions) -->
<div>
  <h1>{title}</h1>
  {description && <p>{description}</p>}
  <SomeComponent />
</div>
```

### Component Best Practices

1. **Always define Props interface**
   ```astro
   ---
   interface Props {
     title: string;
     count?: number;
   }

   const { title, count = 0 } = Astro.props;
   ---
   ```

2. **Use TypeScript for type safety**
   ```astro
   ---
   // Export is optional but helps with tooling
   export interface Props {
     items: Array<{ id: string; name: string }>;
   }
   ---
   ```

3. **Destructure props with defaults**
   ```astro
   ---
   const {
     greeting = "Hello",
     name = "Astronaut"
   } = Astro.props;
   ---
   ```

4. **Keep component scripts clean**
   - Extract complex logic to `src/lib/` utilities
   - Keep data fetching minimal and focused
   - Avoid side effects in frontmatter

5. **Component naming**
   - Use PascalCase for component files: `ButtonGroup.astro`
   - Use descriptive names: `HeroSection.astro` not `Hero.astro`
   - Suffix with type when needed: `FAQAccordion.tsx`

---

## TypeScript Best Practices

### Setup

Always use TypeScript configuration:

```json
// tsconfig.json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

### Type Imports

**Always use explicit type imports:**

```typescript
// ❌ Bad
import { SomeType } from './types';

// ✅ Good
import type { SomeType } from './types';
```

Enable in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "verbatimModuleSyntax": true
  }
}
```

### Props Typing

```astro
---
import type { HTMLAttributes } from 'astro/types';

// Option 1: Interface (recommended for components)
interface Props {
  title: string;
  count?: number;
  onClick?: () => void;
}

// Option 2: Type alias
type Props = {
  title: string;
  variant: 'primary' | 'secondary';
};

// Option 3: Extend HTML attributes
interface Props extends HTMLAttributes<'button'> {
  variant: 'primary' | 'secondary';
}

const { title, count = 0 } = Astro.props;
---
```

### Component Props Inference

```astro
---
import type { ComponentProps } from 'astro/types';
import Button from './Button.astro';

// Infer props from another component
type ButtonProps = ComponentProps<typeof Button>;
---
```

### Type Utilities

```astro
---
import type { HTMLTag, Polymorphic } from 'astro/types';

// Polymorphic component (can render as different elements)
type Props<Tag extends HTMLTag> = Polymorphic<{ as: Tag }>;

const { as: Tag, ...props } = Astro.props;
---

<Tag {...props} />
```

### Type Checking

Add to `package.json`:
```json
{
  "scripts": {
    "build": "astro check && astro build",
    "check": "astro check"
  }
}
```

---

## Content Collections

### When to Use Collections

✅ **Use content collections when:**
- Multiple files share the same structure (blog posts, products)
- Need type-safe frontmatter validation
- Want automatic TypeScript types
- Fetching thousands of entries (performance/caching benefits)
- Remote content from CMS or API

❌ **Don't use collections when:**
- Only one or few unique pages (use `src/pages/` directly)
- Static PDFs or binary files (use `public/` directory)
- Need real-time data updates (use regular data fetching)

### Configuration

```typescript
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/data/blog"
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
  })
});

const authors = defineCollection({
  loader: file("src/data/authors.json"),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    avatar: z.string().url().optional(),
  }),
});

export const collections = { blog, authors };
```

### Querying Collections

```astro
---
import { getCollection, getEntry } from 'astro:content';

// Get all entries
const allPosts = await getCollection('blog');

// Filter entries
const publishedPosts = await getCollection('blog', ({ data }) => {
  return data.draft !== true;
});

// Sort entries (non-deterministic by default)
const sortedPosts = allPosts.sort(
  (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
);

// Get single entry
const post = await getEntry('blog', 'my-post');

// Access referenced data
const author = await getEntry(post.data.author);
---
```

### Rendering Content

```astro
---
import { getEntry, render } from 'astro:content';

const entry = await getEntry('blog', 'post-1');
if (!entry) {
  return Astro.redirect('/404');
}

const { Content, headings } = await render(entry);
---

<article>
  <h1>{entry.data.title}</h1>
  <p>{entry.data.description}</p>
  <Content />
</article>
```

### Collection References

```typescript
// src/content.config.ts
import { defineCollection, reference, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    // Reference single author
    author: reference('authors'),
    // Reference array of posts
    relatedPosts: z.array(reference('blog')),
  })
});
```

---

## Props and Data Flow

### Component Props Best Practices

1. **Define clear interfaces**
   ```astro
   ---
   interface Props {
     // Required props first
     title: string;
     id: string;

     // Optional props after
     description?: string;
     variant?: 'default' | 'primary' | 'secondary';

     // Complex types
     onClick?: (event: MouseEvent) => void;
     items?: Array<{ id: string; label: string }>;
   }
   ---
   ```

2. **Provide sensible defaults**
   ```astro
   ---
   const {
     variant = 'default',
     showIcon = true,
     items = [],
   } = Astro.props;
   ---
   ```

3. **Type component props when passing**
   ```astro
   ---
   import type { CollectionEntry } from 'astro:content';

   interface Props {
     post: CollectionEntry<'blog'>;
   }

   const { post } = Astro.props;
   ---
   ```

4. **Spread HTML attributes**
   ```astro
   ---
   import type { HTMLAttributes } from 'astro/types';

   interface Props extends HTMLAttributes<'div'> {
     variant: 'default' | 'primary';
   }

   const { variant, class: className, ...attrs } = Astro.props;
   ---

   <div class:list={[variant, className]} {...attrs}>
     <slot />
   </div>
   ```

---

## Slots and Composition

### Default Slots

```astro
<!-- Wrapper.astro -->
---
const { title } = Astro.props;
---
<div class="wrapper">
  <h1>{title}</h1>
  <slot /> <!-- Children go here -->
</div>

<!-- Usage -->
<Wrapper title="Welcome">
  <p>This content goes into the slot</p>
</Wrapper>
```

### Named Slots

```astro
<!-- Card.astro -->
<div class="card">
  <header>
    <slot name="header" />
  </header>

  <main>
    <slot /> <!-- Default slot -->
  </main>

  <footer>
    <slot name="footer" />
  </footer>
</div>

<!-- Usage -->
<Card>
  <h2 slot="header">Card Title</h2>
  <p>Main content here</p>
  <button slot="footer">Action</button>
</Card>
```

### Slot Fallback Content

```astro
<div>
  <slot name="icon">
    <!-- Fallback if no icon provided -->
    <svg><!-- default icon --></svg>
  </slot>
  <slot>
    <p>Default content if no children passed</p>
  </slot>
</div>
```

### Transferring Slots

```astro
<!-- BaseLayout.astro -->
<html>
  <head>
    <slot name="head" />
  </head>
  <body>
    <slot />
  </body>
</html>

<!-- PageLayout.astro -->
<BaseLayout>
  <slot name="head" slot="head" /> <!-- Transfer named slot -->
  <slot /> <!-- Transfer default slot -->
</BaseLayout>
```

### Fragment Slots

```astro
<CustomTable>
  <Fragment slot="header">
    <tr><th>Name</th><th>Value</th></tr>
  </Fragment>

  <Fragment slot="body">
    <tr><td>Item 1</td><td>100</td></tr>
    <tr><td>Item 2</td><td>200</td></tr>
  </Fragment>
</CustomTable>
```

---

## Performance Optimization

### Server-First Rendering

**Key principle**: Render HTML on the server by default

```astro
---
// This runs at build time or on server
const data = await fetch('https://api.example.com/data')
  .then(r => r.json());
---

<!-- Static HTML sent to client -->
<ul>
  {data.map(item => <li>{item.name}</li>)}
</ul>
```

### Islands Architecture

**Add client-side JavaScript only where needed:**

```astro
---
import StaticHeader from '../components/Header.astro';
import InteractiveSearch from '../components/Search.tsx';
---

<!-- No JavaScript -->
<StaticHeader />

<!-- Hydrated on client (prefer visible/idle; use load only when necessary) -->
<InteractiveSearch client:visible />

<!-- Other directives -->
<Component client:idle />        <!-- Load when page is idle -->
<Component client:visible />     <!-- Load when visible -->
<Component client:media="(max-width: 768px)" />
<Component client:only="react" /> <!-- Never SSR -->
```

### Optimize Images

```astro
---
import { Image } from 'astro:assets';
import heroImage from '../assets/hero.jpg';
---

<!-- Automatic optimization -->
<Image
  src={heroImage}
  alt="Hero image"
  width={1200}
  height={600}
  loading="lazy"
  format="webp"
/>
```

Notes:
- Prefer importing images from `src/` (e.g. `src/assets/`) so `astro:assets` can optimize them. Images referenced from `public/` are served as-is.
- Always provide `width` and `height` (or use responsive `layout`) to avoid layout shift.

### Prefetching

Enable prefetch globally, then opt-in per-link (or enable for all links).

Tip: prefetch is only as good as your cache headers. For SSR routes, set appropriate `Cache-Control` headers so prefetched pages can be reused.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  prefetch: {
    // Defaults to true when using <ClientRouter />, otherwise false.
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
});
```

```astro
<!-- Opt-in: uses defaultStrategy -->
<a href="/about" data-astro-prefetch>About</a>

<!-- Per-link strategy override -->
<a href="/pricing" data-astro-prefetch="viewport">Pricing</a>

<!-- Disable per-link when prefetchAll is true -->
<a href="/checkout" data-astro-prefetch="false">Checkout</a>
```

### View Transitions (Use When UX Benefits)

Astro view transitions can make navigation feel app-like. Prefer enabling them only when they materially improve UX; they add a client-side router.

```astro
---
// src/layouts/Layout.astro
import { ClientRouter } from 'astro:transitions';
---

<html lang="en">
  <head>
    <slot name="head" />
  </head>
  <body>
    <ClientRouter />
    <slot />
  </body>
</html>
```

Key gotchas:
- On client-side navigation, inline scripts do not automatically re-run. Prefer wiring initialization off the `astro:page-load` event.
- Use `data-astro-reload` on links that must do a full page load.

```astro
<script>
  function init() {
    // attach listeners, hydrate tiny widgets, etc.
  }

  init();
  document.addEventListener('astro:page-load', init);
</script>
```

### Server Islands (`server:defer`)

For expensive or personalized server-rendered parts, defer them so they don't block the initial HTML.

```astro
<UserWidget server:defer>
  <div slot="fallback">Loading…</div>
</UserWidget>
```

### On-Demand Rendering (SSR) + Caching

Astro sites are static by default. Use SSR only for pages that truly need runtime data or personalization.

```astro
---
// Opt this page out of prerendering (requires an adapter)
export const prerender = false;

// Set caching explicitly for SSR responses
Astro.response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300');
---
```

### Code Splitting

```astro
---
// Dynamic imports for heavy components
const HeavyComponent = Astro.props.showHeavy
  ? (await import('../components/Heavy.astro')).default
  : null;
---

{HeavyComponent && <HeavyComponent />}
```

---

## Styling

### Scoped Styles

```astro
---
const { variant } = Astro.props;
---

<div class={`card ${variant}`}>
  <slot />
</div>

<style>
  /* Scoped by default */
  .card {
    padding: 1rem;
    border-radius: 8px;
  }

  .card.primary {
    background: var(--color-primary);
  }

  /* Global styles */
  :global(body) {
    margin: 0;
  }
</style>
```

### Dynamic Class Names

```astro
---
const { isActive, variant } = Astro.props;
---

<!-- Using class:list -->
<div class:list={[
  'card',
  variant,
  { active: isActive },
  isActive && 'card--highlighted'
]}>
  Content
</div>
```

### CSS Variables

```astro
---
const { color = '#111827', size = '16px' } = Astro.props;
---

<style define:vars={{ color, size }}>
  .element {
    color: var(--color);
    font-size: var(--size);
  }
</style>
```

### Tailwind Best Practices

```astro
---
// Use class:list for conditional classes
const { variant } = Astro.props;
---

<button class:list={[
  'px-4 py-2 rounded-lg font-semibold transition-colors',
  variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
  variant === 'secondary' && 'bg-gray-200 text-gray-800 hover:bg-gray-300',
]}>
  <slot />
</button>
```

---

## Naming Conventions

### Files and Directories

```
components/
├── Button.astro              # PascalCase for components
├── EmailCopyButton.tsx       # React components
├── FAQAccordion.tsx          # Acronyms in PascalCase
└── suppliers/
    └── HeroSuppliers.astro   # Feature-specific components

lib/
├── metaPixel.ts              # camelCase for utilities
├── validation.ts
└── sheets.ts

pages/
├── index.astro               # lowercase for routes
├── about.astro
└── [locale]/                 # Dynamic routes
    └── index.astro
```

### Variables and Functions

```typescript
// camelCase for variables and functions
const userName = 'John';
const isActive = true;

function getUserData() { }
function handleClick() { }

// PascalCase for types and interfaces
interface UserProfile { }
type ButtonVariant = 'primary' | 'secondary';

// SCREAMING_SNAKE_CASE for constants
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_COUNT = 3;
```

### Component Props

```astro
---
interface Props {
  // camelCase for prop names
  userName: string;
  isActive: boolean;
  onClick?: () => void;

  // Use descriptive names
  showSuccessMessage: boolean; // ✅ Good
  show: boolean;               // ❌ Too vague
}
---
```

---

## Imports

### Import Order

```astro
---
// 1. Astro and framework imports
import { Image } from 'astro:assets';
import { getCollection } from 'astro:content';

// 2. External dependencies
import { clsx } from 'clsx';

// 3. Internal components (alphabetical)
import Button from '../components/Button.astro';
import Header from '../components/Header.astro';

// 4. Utilities and types
import type { UserProfile } from '../lib/types';
import { formatDate } from '../lib/utils';

// 5. Assets
import logo from '../assets/logo.svg';
---
```

### Import Aliases

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@components/*": ["./src/components/*"],
      "@layouts/*": ["./src/layouts/*"],
      "@lib/*": ["./src/lib/*"],
      "@assets/*": ["./src/assets/*"]
    }
  }
}
```

```astro
---
// Use aliases for cleaner imports
import Button from '@components/Button.astro';
import Layout from '@layouts/Layout.astro';
import { formatDate } from '@lib/utils';
---
```

### Type-Only Imports

```typescript
// Always use 'import type' for types
import type { ComponentProps } from 'astro/types';
import type { CollectionEntry } from 'astro:content';

// Regular import for values
import { getCollection } from 'astro:content';
```

---

## Client-Side JavaScript

### Script Tags

```astro
<!-- Inline script (processed and bundled) -->
<script>
  document.querySelector('.button')
    ?.addEventListener('click', () => {
      console.log('Clicked!');
    });
</script>

<!-- Inline script (not processed) -->
<script is:inline>
  // Runs exactly as written, not bundled
  console.log('Inline script');
</script>

<!-- External script -->
<script src="/scripts/analytics.js"></script>
```

### TypeScript in Scripts

```astro
<script>
  // TypeScript is supported
  const button = document.querySelector<HTMLButtonElement>('.button');

  button?.addEventListener('click', (event: MouseEvent) => {
    console.log(event.target);
  });
</script>
```

### Script Loading Strategies

```astro
<!-- Default: processed, bundled, and deduped (no attributes) -->
<script>
  import { helper } from '../lib/utils';
  helper();
</script>

<!-- Any attribute opts out of processing; use is:inline intentionally -->
<script is:inline>
  // Runs exactly as written (not bundled)
</script>

<!-- Unprocessed module script (browser loads module directly) -->
<script is:inline type="module">
  import { helper } from '/scripts/utils.js';
  helper();
</script>
```

---

## Best Practices Checklist

### ✅ Component Development

- [ ] Define TypeScript `Props` interface for all components
- [ ] Use default values for optional props
- [ ] Keep component scripts focused and minimal
- [ ] Extract complex logic to utility functions
- [ ] Use descriptive component names
- [ ] Scope styles by default
- [ ] Document complex components with comments

### ✅ Performance

- [ ] Use server-first rendering by default
- [ ] Add `client:*` directives only when needed
- [ ] Optimize images with `astro:assets`
- [ ] Enable prefetching for navigation
- [ ] Add view transitions only when UX benefits
- [ ] Minimize JavaScript sent to client
- [ ] Use content collections for large datasets

### ✅ Type Safety

- [ ] Enable TypeScript strict mode
- [ ] Use `import type` for type imports
- [ ] Add `astro check` to build script
- [ ] Type all component props
- [ ] Use Zod schemas for content collections

### ✅ Code Organization

- [ ] Follow consistent file naming conventions
- [ ] Use import aliases for cleaner imports
- [ ] Group related components together
- [ ] Keep utility functions in `src/lib/`
- [ ] Separate concerns (components, layouts, pages)

### ✅ Accessibility

- [ ] Use semantic HTML elements
- [ ] Add ARIA labels where needed
- [ ] Ensure keyboard navigation
- [ ] Test with screen readers
- [ ] Maintain proper heading hierarchy

---

## Common Patterns

### Layout Composition

```astro
<!-- BaseLayout.astro -->
---
interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    <slot name="head" />
  </head>
  <body>
    <slot />
  </body>
</html>

<!-- PageLayout.astro -->
---
import BaseLayout from './BaseLayout.astro';

const { title } = Astro.props;
---

<BaseLayout title={title}>
  <header>
    <nav><!-- Navigation --></nav>
  </header>

  <main>
    <slot />
  </main>

  <footer>
    <!-- Footer content -->
  </footer>
</BaseLayout>
```

### Dynamic Routes

```astro
---
// src/pages/blog/[...slug].astro
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');

  return posts.map(post => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---

<article>
  <h1>{post.data.title}</h1>
  <Content />
</article>
```

### API Endpoints

```typescript
// src/pages/api/newsletter.ts
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData();
  const email = data.get('email');

  // Process email...

  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};
```

---

## Resources

### Official Documentation
- [Astro Docs](https://docs.astro.build/)
- [Astro Discord](https://astro.build/chat)
- [Astro GitHub](https://github.com/withastro/astro)

### Learning Resources
- [Astro Tutorial](https://docs.astro.build/en/tutorial/0-introduction/)
- [Astro Courses](https://docs.astro.build/en/astro-courses/)

### Community
- [Astro Integrations](https://astro.build/integrations/)
- [Astro Themes](https://astro.build/themes/)

---

**Version**: Based on Astro v5.0+ documentation
**Last Updated**: February 2026
**Project**: Degu Landing Page
