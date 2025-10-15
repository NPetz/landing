# Copilot Instructions for This Repository

Purpose: Simple multilingual (EN/JA) static landing site with enhanced visual flair (shader-driven canvas), fast performance, basic contact forms (Netlify), and strong SEO + accessibility focus. No build framework (Next.js/etc.)—just static HTML + Tailwind built CSS + one progressive enhancement module.

## Stack & Build

- Authoring CSS: `input.css` (Tailwind v4 via CLI). Build once: `npm run build:css` (outputs `styles.css`). Watch during edits: `npm run watch:css`.
- No bundler for JS; `main.mjs` is loaded directly as an ES module.
- Three.js loaded dynamically from CDN(s) only after idle/interaction for performance.
- Deployment target assumed static host (e.g. Netlify). `__redirects` file manages language redirect.

## Key Files

- `index.html` (EN) / `ja/index.html` (JA): Mirror structure; keep sections & IDs aligned for a11y & SEO parity.
- `thank-you.html` + `ja/thank-you.html`: Post-form confirmation pages (low change frequency; sitemap priority low by design).
- `main.mjs`: PerformanceOptimizer class handles deferred Three.js shader background.
- `input.css` → compiled `styles.css`: Custom utility composition & component layers (canvas loader, shimmer buttons, service cards, horizontal scroll track, reduced-motion handling).
- `__redirects`: Language preference redirect; preserve when adding new routes.
- `sitemap.xml`, `robots.txt`, `ai.txt`: SEO + crawler policy (ai.txt explicitly disallows AI training ingestion; do not remove or contradict).

## Patterns & Conventions

- Internationalization: Duplicate full HTML documents per locale (no runtime i18n). Any new content blocks must appear in both languages; maintain matching `id` attributes and `aria-*` semantics.
- Forms: Netlify form handling via `data-netlify="true"` + hidden `form-name` input + honeypot `bot-field`. Replicate pattern exactly for new forms; update thank-you routes if adding locale variants.
- Accessibility: Uses focus ring utilities & `aria-label` on interactive icons. Maintain semantic headings (H1 once; sections with labelled headers). Preserve `role="list"` / `role="listitem"` where used for custom flex/grid lists.
- Performance: Lazy initialization of Three.js only after idle or first interaction; do not convert to eager load. Keep shader self-contained; prefer small orthographic full-screen quad. If adding heavier assets, gate behind the same idle/interactivity promise.
- Progressive Enhancement: Site must remain usable with JS disabled (only canvas effect missing). Avoid coupling core navigation or content to JS.
- Styling: Tailwind utilities via `@apply` for component abstractions; respect existing naming (`service-card`, `feature-pill`, `btn-shimmer`, `process-track`, `canvas-loader`). Add new components inside `@layer components` in `input.css`.
- Animation & Reduced Motion: Honor `prefers-reduced-motion`; replicate the bypass pattern (turn off non-essential transforms/animations).
- SEO: Maintain `<link rel="alternate" hreflang>` triad (en, ja, x-default) and structured data JSON-LD blocks in both locales. When duplicating a page, update URLs/locale codes consistently.
- Email Obfuscation: Reconstructs address client-side using `data-u` + `data-d`. For any new email display, reuse pattern; keep accessibility (keyboard activation) logic.

## Three.js / Shader Section

- Scaled rendering (`scale = 0.5`) to reduce GPU cost; preserve unless a compelling visual upgrade justifies change.
- Pause/Resume system stubbed (`pauseWebGL` / `resumeWebGL`) via IntersectionObserver; if extending, avoid blocking animation loop creation—add lightweight toggles only.
- Fragment shader: Procedural noise + caustics; if modifying, keep uniforms minimal (`u_time`, `u_resolution`). Avoid large texture loads.

## Adding Features Safely

1. Add markup simultaneously in EN & JA versions; sync IDs and heading levels.
2. Update `sitemap.xml` (add `<url>` with alternates) & ensure `robots.txt` still references correct sitemap.
3. If route needs redirect logic, append to `__redirects` (do not overwrite existing wildcard rule without replicating it).
4. Run `npm run build:css` if you changed `input.css` before committing.
5. Keep site functioning without JS (test by disabling scripts in dev tools prior to shipping changes reliant on JS).

## Do Not

- Do not introduce a heavy framework (React/Next) unless explicitly requested.
- Do not inline large scripts or embed tracking without owner approval.
- Do not remove `ai.txt` or weaken disallow stance.

## Example Edit Workflow

- Add new component: define styles in `input.css` under `@layer components`, reference with semantic HTML in both locale pages, rebuild CSS, update sitemap if it’s a new page.

## PR Guidance for AI Agents

- Keep diffs minimal & focused. Mention if `styles.css` is regenerated (expected after CSS source changes).
- Call out any unmatched localization text blocks.
- Provide quick manual test notes (forms submit, canvas still fades in, reduced-motion check).

Questions or ambiguity: leave a short `<!-- TODO: clarify -->` comment near uncertain additions for human follow-up.
