# Design QA — Recherche médecins

**Source visual truth**

- Main reference: `C:\Users\Akram\AppData\Local\Temp\codex-clipboard-5ad93ced-021e-46ba-93aa-b22b8a0f0eef.png`
- Main reference pixels: 1487 × 1058 px
- Search-date reference: `C:\Users\Akram\AppData\Local\Temp\codex-clipboard-9726e508-d017-4ddd-91e5-2073d359ebfe.png`
- Search-date reference pixels: 910 × 53 px
- Product constraint: use the compact search-bar structure from the first reference, then match the second reference for filters, results, cards, map, and spacing. Replace its bottom date strip with pagination.

**Implementation**

- URL: `http://localhost:3000/recherche?specialite=Cardiologue&ville=Casablanca&date=2026-08-24&page=2`
- Screenshot path: unavailable
- Intended desktop viewport: 1487 × 1058 CSS px
- Intended mobile viewport: 390 × 844 CSS px
- Density normalization: pending browser capture at `deviceScaleFactor: 1`.
- State: anonymous visitor; specialty, city, exact date, and page restored from URL; list view; booking drawer closed.

**Verification completed**

- Production build: passed (`npm run build`)
- TypeScript: passed (`npx tsc --noEmit`)
- ESLint on changed files: passed
- Targeted tests: 19/19 passed
- Local route with date and pagination state: HTTP 200
- `git diff --check`: passed; line-ending warnings only

**Full-view comparison evidence**

- Blocked after iteration 1. Both reference images were opened and inspected, but the configured in-app browser still cannot capture the rendered implementation because its client resolves a missing browser-service version (`26.814.41957`).

**Focused region comparison evidence**

- Blocked for the same reason. Planned focused regions: availability calendar, result heading and sort control, first doctor card, map panel, and bottom pagination.

**Findings**

- [P1] Post-build visual fidelity cannot be certified
  Location: `/recherche`, desktop and mobile.
  Evidence: source visuals are available; rendered comparison screenshot is missing.
  Impact: exact spacing, map height, calendar placement, and responsive overflow cannot be accepted from code/build checks alone.
  Fix: capture the rendered route in the in-app browser, create a side-by-side comparison, then fix any P0/P1/P2 difference.

**Implemented alignment — iteration 1**

- Exact date/period moved into the main white search bar as a third field.
- Quick filters and sort moved to the secondary row.
- Results constrained to five doctors per page to preserve the reference density.
- Doctor cards changed to a compact identity-left / availability-right layout.
- Per-card date carousel removed; cards now consume the date selected in the global search.
- Map widened and kept sticky beside the list.
- Numeric pagination replaces the reference's bottom date strip.
- Search, date, period, sorting, nearby mode, page, and booking return state remain encoded in the URL.

**Mobile compaction — iteration 2**

- Search card reduced from three stacked actions to two compact rows.
- Specialty remains the primary full-width field.
- City and date share the second row; search becomes a compact icon button.
- Quick filters and sorting use one horizontally scrollable row instead of stacking.
- Desktop dimensions and composition remain unchanged from iteration 1.

**Implementation Checklist**

- Capture 1487 × 1058 desktop state matching the reference query.
- Capture 390 × 844 mobile state and confirm no horizontal scroll.
- Test exact-date selection, quick periods, nearby mode, sorting, pagination, and slot selection.
- Check browser console errors.
- Compare source and implementation in one combined image.

**Follow-up Polish**

- None classified before rendered comparison.

**Comparison History**

- Iteration 0: first interpretation preserved too much of the previous search-page composition.
- Iteration 1: search-bar/reference split corrected; card date carousels removed; pagination and compact two-column composition implemented; automated visual comparison blocked by unavailable in-app browser service.
- Iteration 2: mobile search and filter controls compacted while preserving Doctorek colors, radii, and typography; build and component tests passed; browser capture blocked by the local URL policy.

**final result: blocked**

---

# Design QA — Alerte de connexion Doctorek

**Source visual truth**

- Reference: `C:\Users\Akram\AppData\Local\Temp\codex-clipboard-9fe18967-88cd-453d-a247-2b51fac2d945.png`
- Source pixels: 568 × 350 px, including surrounding white canvas and the screenshot caption.
- Source component crop: approximately 390 × 310 px.
- Design intent: reuse the restrained service-message structure—brand bar, compact illustration, centered message and CTA, then a separated help section—while replacing Doctolib branding and appointment-specific content with Doctorek authentication content.

**Implementation**

- URL: `http://127.0.0.1:3000/connexion-erreur?error=Configuration`
- Browser-rendered screenshot: `C:\Users\Akram\Desktop\doctorek\doctorek-frontend\.codex\connexion-erreur-implementation-pass-2.png`
- Full-view comparison: `C:\Users\Akram\Desktop\doctorek\doctorek-frontend\.codex\connexion-erreur-comparison-pass-2.png`
- Focused component comparison: `C:\Users\Akram\Desktop\doctorek\doctorek-frontend\.codex\connexion-erreur-focused-comparison-pass-2.png`
- Viewport: 568 × 650 CSS px at device pixel ratio 1.
- Implementation pixels: 568 × 650 px.
- Rendered component: 430 × 390.94 CSS px.
- Density normalization: both artifacts compared at 1×; the focused comparison crops both cards and normalizes their widths to 430 px without using a browser or device frame.
- State: `Configuration` authentication error; light theme; no hover or focus state retained.

**Full-view comparison evidence**

- The combined comparison confirms the same information hierarchy, centered composition, full-width blue brand bar, small medical-calendar illustration, single primary action, fine divider and compact help section.
- The Doctorek version intentionally uses a slightly larger component and more readable type because its French authentication copy is longer than the source appointment alert.
- The neutral page background and subtle elevation preserve separation without making the component feel like a generic oversized modal.

**Focused region comparison evidence**

- The focused card comparison verifies header height, logo placement, illustration scale, title/body/CTA rhythm, divider position, help hierarchy, border and radius.
- The source logo and illustration were not copied. The implementation uses the real Doctorek white logo and the existing Doctorek calendar illustration; no CSS art, handcrafted SVG, emoji or placeholder asset is used.

**Required fidelity surfaces**

- Fonts and typography: Doctorek's existing Plus Jakarta Sans heading treatment and Geist body text are retained. The 18 px title, 13 px body and compact secondary copy preserve the source hierarchy while remaining readable.
- Spacing and layout rhythm: the final 430 px card, 48 px brand bar, 24 px primary-section padding, 40 px CTA and 16 px help-section padding closely reproduce the source's compact vertical structure.
- Colors and tokens: the source blue is mapped to Doctorek blue `#007DFF`; navy `#00263C`, muted slate text and restrained cool-gray borders/background use the existing product palette.
- Image quality and asset fidelity: real raster assets from `public/logo-white.png` and the production-optimized `public/illustrations/free-day-calendar.webp` render sharply at their intended slots. The calendar asset is intentionally adapted to Doctorek rather than reproducing Doctolib artwork.
- Copy and content: the dynamic Auth.js error message remains intact; the CTA, home route and support address are direct and contextual.

**Responsive and interaction verification**

- 360 × 640 CSS px: component width 328 px, no horizontal overflow (`scrollWidth = 360`), CTA 260 × 40 px, complete content visible.
- Primary CTA resolves to `/login`.
- Home link navigated successfully to `http://127.0.0.1:3000/` and browser back restored the error state.
- Support link resolves to `mailto:support@doctorek.ma`.
- Browser console warnings/errors checked: none.
- ESLint for the changed page: passed.
- TypeScript (`npx tsc --noEmit`): passed.
- `git diff --check`: passed; line-ending warning only.

**Findings**

- No actionable P0, P1 or P2 differences remain.
- [P3] The reference is a low-resolution branded screenshot, so exact font metrics and illustration details cannot be measured with pixel precision. The implementation intentionally follows Doctorek's sharper native assets and typography.

**Comparison History**

- Iteration 1: the first implementation measured 500 × 467.88 px. It preserved the structure but appeared wider, taller and more promotional than the compact source; title, logo, illustration and CTA were oversized. Classified P2.
- Fixes: reduced card width to 430 px, height to 390.94 px, header to 48 px, logo to 90 px, illustration to 68 × 50 px, title to 18 px, CTA to 260 × 40 px, help copy to 11–13 px, and softened radius/elevation.
- Iteration 2: full-view and focused combined comparisons show the compact service-alert rhythm restored. Mobile metrics, interactions and console state passed; no P0/P1/P2 findings remain.

**Implementation Checklist**

- [x] Match the selected editorial alert structure.
- [x] Use real Doctorek brand assets.
- [x] Preserve dynamic authentication messages.
- [x] Verify desktop and mobile responsiveness.
- [x] Verify links, console, TypeScript and lint.

**Follow-up Polish**

- P3 only: replace the calendar illustration with a dedicated Doctorek authentication illustration later if the brand system adds one.

**final result: passed**
