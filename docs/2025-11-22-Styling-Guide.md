# Styling Guide: Retro-Futuristic Editorial

**Date:** 2025-11-22
**Topic:** Comprehensive Design System & Styling Guide
**Source:** Moose-PDFs (src/App.css, src/index.css)

---

## 1. Design Philosophy
The aesthetic is a blend of **"Retro-Futuristic"** and **"Clean Editorial"**. It mimics the tactility of physical paper and printed documents using serif fonts, hard drop shadows, and textured backgrounds, while maintaining modern usability principles.

**Key Characteristics:**
*   **Tactile:** "Clicky" buttons with hard shadows that depress when pressed.
*   **Editorial:** Serif fonts used for *both* headers and UI text.
*   **Organic:** Cream backgrounds, grain textures, and earth-tone accents.
*   **High Contrast:** Sharp borders (`#1f1a14`) against soft backgrounds.

## 2. Color Palette

### Base Colors
*   **Cream (`--cream`)**: `#f8f3e8` - Main background color.
*   **Ink (`--ink`)**: `#1f1a14` - Primary text, borders, and hard shadows.
*   **Line (`--line`)**: `#e2d7c8` - Subtle dividers and dashed borders.
*   **Muted (`--muted`)**: `#5b5249` - Secondary text, metadata.

### Accents
*   **Aero (`--aero`)**: `#2c8f7a` - Primary action color (Buttons, Highlights).
*   **Pine (`--pine`)**: `#0f7363` - Darker teal for hover states.
*   **Clay (`--clay`)**: `#c45b37` - Danger actions, errors, or warm highlights.

### Utility
*   **White**: `#ffffff` - Card backgrounds, input fields.
*   **Soft Teal**: `#e0f2f1` - Success/Info pills.
*   **Soft Orange**: `#fbe9e7` - Warning/Busy pills.

## 3. Typography

### Font Families
**Important:** This design uniquely uses serifs for UI elements, not just headings.

1.  **Headings:** `DM Serif Display` (Google Fonts)
    *   Weights: 400, 700
    *   Usage: `h1`, `h2`, Large display text.
2.  **Body & UI:** `Newsreader` (Google Fonts)
    *   Weights: 400, 500, 600, 700
    *   Usage: Paragraphs, buttons, inputs, labels.

### Scale & Spacing
*   `root` line-height: `1.6`
*   `h1`: `clamp(3.2rem, 5vw, 4.2rem)`, letter-spacing `0.01em`.
*   `h2`: `1.6rem`.
*   `eyebrow`: `0.75rem`, uppercase, letter-spacing `0.17em`.
*   `label`: `0.75rem`, uppercase, letter-spacing `0.15em`.

## 4. Design Tokens

### Shadows & Borders
The "Retro" look relies on hard, unblurred shadows.

*   **Retro Shadow:** `4px 4px 0px var(--ink)`
*   **Retro Border:** `1.5px solid var(--ink)`
*   **Thick Border:** `2px solid var(--ink)`
*   **Radius Small:** `6px` (Buttons, Cards, Inputs)
*   **Radius Large:** `22px` (Main Panels)

### Background Texture ("The Grain")
A fixed overlay providing a paper-like texture.

```css
.grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at 20% 20%, rgba(196, 91, 55, 0.08), transparent 34%),
    radial-gradient(circle at 80% 10%, rgba(44, 143, 122, 0.12), transparent 30%),
    radial-gradient(circle at 40% 90%, rgba(15, 115, 99, 0.08), transparent 35%),
    var(--cream);
  filter: contrast(105%);
  z-index: 0;
}
```

## 5. Component Styles

### Buttons
Buttons mimic physical keys.

**Base Properties:**
*   Font: Inherit (Newsreader)
*   Weight: 600
*   Border Radius: `var(--radius-sm)`
*   Transition: `transform 0.1s ease, box-shadow 0.1s ease`

**Primary Button:**
*   Background: `var(--aero)`
*   Color: `white`
*   Border: `var(--border-retro)`
*   Shadow: `var(--shadow-retro)`
*   *Hover:* Background `var(--pine)`, Transform `2px 2px`, Shadow `2px 2px 0px`.
*   *Active:* Transform `4px 4px`, Shadow `none`.

**Outline Button:**
*   Background: `white`
*   Color: `var(--ink)`
*   Border: `var(--border-retro)`
*   Shadow: `var(--shadow-retro)`

**Ghost Button:**
*   Background: `rgba(31, 26, 20, 0.04)`
*   Border: `2px solid transparent`
*   *Hover:* Border `var(--ink)`, Background `white`.

### Panels
Glassmorphic container for main content areas.
*   Background: `linear-gradient(120deg, rgba(255, 255, 255, 0.74), rgba(255, 255, 255, 0.92))`
*   Border: `1px solid var(--line)`
*   Radius: `22px`
*   Shadow: `0 20px 50px rgba(31, 26, 20, 0.08)` (Soft shadow, unlike buttons)
*   Backdrop Filter: `blur(5px)`

### Inputs
*   Border: `var(--border-retro)`
*   Radius: `var(--radius-sm)`
*   Shadow: `var(--shadow-retro)`
*   Focus State: Transform `2px 2px`, Shadow `2px 2px 0px var(--ink)`.

### Badges / Pills
*   Border: `var(--border-retro)`
*   Radius: `var(--radius-sm)`
*   Shadow: `2px 2px 0px rgba(31, 26, 20, 0.15)`
*   Font Size: `0.88rem`

## 6. Interaction & Animation Physics

The "Tactile" feel is defined by a strict set of physical rules for interaction states. Elements emulate physical depression (z-axis movement) via transform and shadow manipulation.

### The "Press" Model (Buttons)
Elements start "elevated" by 4px. As the user interacts, the element physically moves down to meet the surface.

| State | Transform (Position) | Shadow (Elevation) | Timing |
| :--- | :--- | :--- | :--- |
| **Rest (Idle)** | `none` | `4px 4px 0px` | - |
| **Hover** | `translate(2px, 2px)` | `2px 2px 0px` | `0.1s ease` |
| **Active (Click)** | `translate(4px, 4px)` | `none` (0px) | `0.1s ease` |

> **Note:** The `translate` value must exactly match the reduction in shadow size to create the illusion of the object remaining stationary while its height decreases.

### The "Focus" Model (Inputs)
Inputs act similarly to buttons but stop at the "Hover" depth when focused to indicate readiness without feeling fully "pressed."

*   **Idle:** `4px 4px 0px` Shadow.
*   **Focus:** `translate(2px, 2px)` + `2px 2px 0px` Shadow.

### Draggable Elements (Cards)
Interactions for sortable items require specific handling to feel responsive.

1.  **Touch Action:** Apply `touch-action: none` and `user-select: none` to draggable containers to prevent browser scrolling/selection interference.
2.  **Lift State (`.dragging`):**
    *   **Transition:** Set to `none`. This is critical for the element to follow the cursor 1:1 without lag.
    *   **Shadow:** `3px 3px 0px` (Slightly compressed).
    *   **Z-Index:** Boost to `2` or higher.
3.  **Release:**
    *   Restore transition (`transform 0.2s ease`) to allow the element to animate smoothly into its new slot.

### Micro-Interactions (Small Buttons)
For smaller elements (like "X" delete buttons):
*   **Scale:** Reduced movement scale (`1px` translation instead of `2px`) to avoid jitteriness.
*   **Hover:** `translate(1px, 1px)` + `1px 1px 0px` shadow.

## 7. Layout Patterns

*   **App Shell:** Central column with padding.
*   **Split Layout:** `grid-template-columns: 1.15fr 1.85fr` (Sidebar / Main Area).
*   **Responsive:** Collapses to single column at `<1100px`.
*   **Brand Mark:** Circular logo container, white background, `2px` border, `4px` hard shadow.

## 8. Implementation Checklist for New Agent
1.  [ ] Import Google Fonts (`DM Serif Display`, `Newsreader`).
2.  [ ] Define CSS variables (Cream, Ink, Aero, Pine, Clay).
3.  [ ] Apply global reset (`box-sizing: border-box`).
4.  [ ] Add the `.grain` background element.
5.  [ ] **Implement The Press Model:** Ensure all interactive elements follow the `4px` -> `2px` -> `0px` shadow/transform logic.
6.  [ ] Set transition timings to `0.1s` for interactions to keep them snappy.
