# Seif ElBakry Website

A static consultancy website with free course pages, articles, and a browser-based content editor. Open `index.html` directly; no development server or build step is required.

## Project structure

```text
index.html                           Page structure and admin shell
assets/scripts/site-content.js       Default website content
assets/scripts/website.js            Rendering, routing, interactions, and editing
assets/styles/website.css            Website and admin styles
assets/images/seif-elbakry-portrait.png
assets/images/seif-elbakry-logo-white.png
tests/admin-editor.spec.cjs          Browser regression checks
edgeone.json                         Existing hosting rewrite
```

## Content editor

Open `index.html#admin`. The existing local login is `admin` / `admin123`.

Use **Fonts & Layout** for typography, spacing, section visibility, buttons, and animation settings. **All Content** exposes nested content fields. Dedicated tabs cover colors, media, copy, headlines, courses, articles, and contact details.

Edits save in the current browser. They do not automatically update GitHub or other visitors. **Data > Download website HTML** exports an `index.html` with the edited content embedded. Publish it alongside the complete `assets` folder. JSON import/export provides a content backup including uploaded media.

The login is a client-side convenience gate. This project does not provide server authentication, a shared database, or private media storage.

## Development checks

```sh
npm ci
npm test
npm run format:check
```

The browser checks require Microsoft Edge and use isolated browser contexts. They cover fonts, nested content, continuous typing, persistence, visibility, export, mobile overflow, and runtime errors. Screenshots are written to the ignored `test-results` folder.

Run `npm run format` after editing source files. Commit the lockfile when updating development dependencies. The published website has no npm runtime dependencies.
