# Seif ElBakry Website

Open `index.html` or `site_template.html` in a browser. Both entry files contain the same website. Keep the two image files beside them.

## Admin

Open `index.html#admin`. The existing local editor login is `admin` / `admin123`.

- **Fonts & Layout:** heading, body and label font families; heading weight and case; body and heading sizes; line height; content width; section spacing; button corners; animations; section visibility.
- **All Content:** expandable fields for the complete stored content model, including nested framework steps and course details.
- **Colors, Media, Copy, Headlines, Sections, Free Courses, Blog Posts, Contact:** dedicated editors for the corresponding content.
- **Data:** JSON import/export and Download website HTML.

Edits save to this browser's local storage. They do not update GitHub or other visitors automatically. Use **Data > Download website HTML** to create an `index.html` containing the edited content, then publish that file with the original image assets. JSON export includes uploaded media.

The login is a client-side convenience gate, not secure server authentication. This static project has no backend, shared database, or private media storage. Use a backend authentication and content service before treating it as a secure multi-user CMS.

## Verification

`verify-admin.cjs` uses Playwright and Microsoft Edge to check editing focus, typography, nested content, persistence, section visibility, export, mobile overflow, and JavaScript errors. Install Playwright in your development environment, then run `node verify-admin.cjs`. The test uses an isolated browser context and creates ignored screenshots and an exported preview.

When changing the source, keep `index.html` synchronized with `site_template.html`.
