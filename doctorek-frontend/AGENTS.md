<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Doctorek Design System (Colors)

Agents must strictly adhere to this color palette when building or modifying the UI.

## Color Role Summary

| Role | Color | Hex |
|------|-------|-----|
| **Primary brand / hero backgrounds** | Vivid Blue | `#007DFF` |
| **Dark CTA buttons (on vivid blue bg)** | Deep Teal Navy | `#00263C` |
| **Small accents, dark badges, footer bg** | Deep Navy | `#010C2D` |
| **Page background** | Light Grey | `#F0F2F5` |
| **Body text** | Dark Grey | `#333333` |

**Rule:** `#010C2D` is reserved for small UI elements only (badges, tags, footer strip, icon backgrounds). Do NOT use it as a full section/page background — use `#007DFF` for brand sections and `#F0F2F5` for content sections.

---

## Primary Brand Colors
- **Vivid Blue (`#007DFF`)**: ★ PRIMARY — hero backgrounds, navbar, brand sections, primary buttons on light bg
- **Deep Teal Navy (`#00263C`)**: Dark CTA buttons (on vivid blue background), hover state of vivid blue buttons
- **Brand Blue (`#1863A9`)**: Secondary brand color, links, card accents
- **Dark Blue (`#064178`)**: Darker blue variant, sub-sections
- **Midnight Blue (`#042651`)**: Deep panel backgrounds (carte médicale only)
- **Rich Blue (`#0C4A83`)**: Button backgrounds (secondary CTA, on dark panels)

## Secondary / UI Blues
- **Medium Blue (`#163C64`)**: Card/panel backgrounds (dark-themed panels, carte details)
- **Steel Blue (`#356897`)**: Hover states, secondary elements
- **Sky Blue (`#3793E0`)**: Interactive elements, icon color
- **Light Blue (`#3DA8FF`)**: Highlights, icons, active state indicators
- **Pale Blue (`#B6DAF7`)**: Borders, subtle accents, secondary text on dark bg
- **Ice Blue (`#DFEFFE`)**: Light section backgrounds
- **Off White / Mist (`#E8EFF6`)**: Light section backgrounds
- **Near White (`#F1F4F7`)**: Card backgrounds on light pages

## Neutral Colors
- **White (`#FFFFFF`)**: Text on dark backgrounds, card backgrounds
- **Light Grey (`#F0F2F5`)**: Default page background (replaces deep navy for body)
- **Grey (`#465058`)**: Body text, secondary text
- **Dark Grey (`#333333`)**: General text on light backgrounds

## Accent / Status Colors
- **Deep Navy (`#010C2D`)**: Small dark accents only — badges, tags, dark icon chips, footer strip
- **Cyan (`#36C5F0`)**: Accent, highlights
- **Green (`#2EB67D`)**: Success states
- **Amber (`#ECB22E`)**: Warning states
- **Red (`#E01E5A`)**: Error / alert states
- **Orange (`#FFAF5D`)**: Warm accent
- **Light Pink (`#FFDEDE`)**: Subtle error/alert background
