# Repository Guidelines

## Project Structure & Module Organization
This repository is a static marketing site for SyncQ Events. The main entry points are `index.html` for the landing page, `faq.html` for the FAQ experience, and `map.html` for map-related UI work. Content data lives in `FAQ.json`. Visual assets such as logos, favicons, and mockups are stored in `images/`. Common styles (nav, reveal animations, buttons, toasts) live in `css/shared.css` and common behavior (navbar, mobile menu, scroll reveal, toasts) in `js/shared.js`; page-specific styles live in `css/<page>.css` and page scripts in `js/<page>.js`. The shared Tailwind palette/config is `js/tailwind-config.js`, loaded in each page's `<head>` right after the pinned Tailwind CDN script — keep that order. Keep related updates together: if you change FAQ rendering in `faq.html`, verify the schema in `FAQ.json` and the logic in `js/faq.js`.

## Build, Test, and Development Commands
There is no package-based build step in this repo. For local preview, run a simple static server from the repository root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/index.html`. Use this same flow to verify `faq.html` loads `FAQ.json` correctly; opening files directly via `file://` can hide fetch-related issues.

## Coding Style & Naming Conventions
Use 2-space indentation in HTML, CSS, and JavaScript to match the existing files. Preserve the current structure: semantic sections, Tailwind utility classes in markup, page-specific CSS in `css/`, and page-specific scripts in `js/` (no new inline `<style>` or `<script>` blocks). Prefer lowercase, hyphenated IDs and filenames such as `mobile-menu-btn` and `faq.html`. Reuse the established palette tokens in the inline Tailwind config (`tea`, `terra`, `bark`, `gold`) instead of adding ad hoc colors.

## Testing Guidelines
There is no automated test suite yet. Manual verification is required for each change:

- Load `index.html`, `faq.html`, and any touched page through a local server.
- Check responsive behavior in desktop and mobile widths.
- Confirm external CDN dependencies (Tailwind, Lucide, Google Fonts) still render.
- If `FAQ.json` changes, verify section ordering, IDs, and question rendering in `faq.html`.

## Commit & Pull Request Guidelines
Recent history includes short, inconsistent commit messages. Use clearer imperative subjects such as `Add FAQ section navigation` or `Refine mobile navbar spacing`. Keep commits focused on one concern. Pull requests should include a concise summary, affected pages, before/after screenshots for visual changes, and manual test notes describing what you checked locally.

## Content & Asset Notes
Optimize replacement images before committing and keep filenames stable unless the HTML references are updated in the same change. Avoid duplicating near-identical assets; replace existing files only when the new version is intended to supersede the old one.
