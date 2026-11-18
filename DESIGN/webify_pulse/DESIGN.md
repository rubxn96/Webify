---
name: Webify Pulse
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#bacbb9'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#859585'
  outline-variant: '#3c4a3d'
  surface-tint: '#0ae474'
  primary: '#6fff9a'
  on-primary: '#003918'
  primary-container: '#10e575'
  on-primary-container: '#00612d'
  inverse-primary: '#006d34'
  secondary: '#53e076'
  on-secondary: '#003914'
  secondary-container: '#02b04c'
  on-secondary-container: '#003a14'
  tertiary: '#70ff92'
  on-tertiary: '#003915'
  tertiary-container: '#4be277'
  on-tertiary-container: '#006128'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#62ff95'
  primary-fixed-dim: '#0ae474'
  on-primary-fixed: '#00210b'
  on-primary-fixed-variant: '#005225'
  secondary-fixed: '#72fe8f'
  secondary-fixed-dim: '#53e076'
  on-secondary-fixed: '#002108'
  on-secondary-fixed-variant: '#005320'
  tertiary-fixed: '#6bff8f'
  tertiary-fixed-dim: '#4ae176'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005321'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1.25rem
  margin-desktop: 2.5rem
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system delivers an immersive, dark-mode-first sonic sanctuary engineered for high-engagement streaming. The brand personality balances tactile precision with midnight elegance—dynamic, effortless, and focused strictly on the music. The audience consists of digital natives, audiophiles, and everyday listeners who demand instantaneous tactile feedback, low visual noise, and content-first visuals. 

The aesthetic is anchored in **Minimalist Night-Mode with Organic Tactility**:
- True pitch-black (`#0a0a0a`) and deep charcoal canvas tiers (`#121212`, `#181818`) recede into the hardware display, allowing album art and artist imagery to claim maximum presence.
- Electric emerald accents deliver energetic, high-visibility milestones across playheads, active states, and call-to-action touch targets.
- Soft curves, frosted navigation pods, and pill-shaped interactive elements introduce approachable ergonomics tailored for single-hand mobile interactions.

## Colors

The palette establishes an OLED-deep hierarchy where luminance maps directly to interactive priority:

- **Primary (`#10E575`)**: The core interactive accent. Used for primary CTA buttons, playback progress fills, active tab indicators, and verified badges.
- **Secondary (`#1DB954`)**: The tonal support emerald. Used for secondary active badges, subtle gradients over active media cards, and secondary toggle handles.
- **Tertiary (`#22C55E`)**: Vibrant status confirmations, success cues, and dynamic ambient glows behind active tracks.
- **Neutral Surface Palette**:
  - `Canvas Base`: `#0A0A0A` (deepest background).
  - `Surface Container Low`: `#121212` (cards, floating bottom sheets, navigation dock).
  - `Surface Container High`: `#181818` (card hover states, inactive pill filters, track list items).
  - `Surface Border / Stroke`: `rgba(255, 255, 255, 0.08)` (subtle structural separation).
- **Text & Foreground**:
  - `High-Emphasis Text`: `#FFFFFF` (track titles, artist headers, primary labels).
  - `Medium-Emphasis Text`: `#A3A3A3` (artist credits, subheadings, duration stamps).
  - `Muted / Disabled`: `#525252` (inactive controls, placeholders, divider timestamps).

## Typography

The typography system relies on **Plus Jakarta Sans** across all roles to achieve a geometric yet warm, highly legible interface at rapid scanning speeds.

- **Headlines**: Weighted at Bold (`700`) and Semi-Bold (`600`) with tight negative letter-spacing (`-0.01em` to `-0.02em`) to ensure title lockups feel cohesive and punchy.
- **Body Content**: Tuned at Regular (`400`) with ample line-height to maintain comfortable reading when browsing lyrics, artist bios, and release notes against high-contrast black backgrounds.
- **Labels & Meta**: Track timing, badges, and tab descriptions employ Medium (`500`) and Semi-Bold (`600`) weights with slight positive tracking to ensure extreme legibility on compressed mobile screens.

## Layout & Spacing

The layout is built on a responsive fluid container model:

- **Mobile Viewports (<640px)**: 4-column layout with 20px (`1.25rem`) safe outer margins and 16px (`1rem`) gutters. Content is structured into horizontal carousels (featured mixes, recently played) and vertical linear stacks (tracks, search results). Bottom elements maintain an 80px clearance padding to float freely above the floating persistent player and tab bar.
- **Tablet & Desktop (≥768px)**: 12-column layout with 40px (`2.5rem`) outer margins. Content spreads into multi-column media grids (3-column hero showcases, 6-column album listings) with a persistent left-rail navigation dock and bottom-anchored full-width player drawer.
- **Rhythm**: Element padding, micro-spacing, and touch heights operate on an 8pt base grid (with a 4pt micro-step for compact metadata tags).

## Elevation & Depth

Visual hierarchy does not use harsh drop shadows; instead, it relies on surface luminance layering, frosted glass backdrops, and localized emerald luminescence:

- **Surface Layer 0 (Base)**: `#0A0A0A` pure canvas for empty track areas and root frames.
- **Surface Layer 1 (Elevated Cards)**: `#121212` with an ultra-thin 1px border `rgba(255, 255, 255, 0.06)` for hero carousels and album items.
- **Surface Layer 2 (Floating Pods & Drawers)**: `#181818` with `backdrop-filter: blur(24px)` and `rgba(255, 255, 255, 0.08)` outline. Applied to the floating bottom navigation bar and mini-player widget.
- **Active Ambient Glow**: Primary action elements (such as the active play button or featured hero cards) project an ultra-diffused atmospheric glow: `0 12px 32px rgba(16, 229, 117, 0.22)`.

## Shapes

The interface embraces a hyper-modern, pill-centric shape grammar (Level 3):

- **Interactive Primary Elements**: Fully rounded pill shapes (`border-radius: 9999px`) for action buttons, category filter chips, search input bars, and bottom navigation pods.
- **Media & Hero Cards**: Generous corner radii (`rounded-xl` / `24px` to `28px`) on album covers, carousel containers, and featured mix banners to impart a physical, tactile feel.
- **Thumbnails & Nested Assets**: Smooth `rounded-lg` (`16px`) treatment for track row art and artist avatar circles.

## Components

### Buttons
- **Primary Action (CTA)**: Full-width or inline pill (`border-radius: 9999px`), background in `#10E575`, label in `#0A0A0A` (Semi-Bold), padding `16px 28px`. Hover/Active: brightness shifts with a subtle neon radial glow.
- **Secondary Ghost**: Transparent background with 1px border `rgba(255, 255, 255, 0.16)`, label in `#FFFFFF`, pill-shaped.
- **Icon / Control Circulars**: `48px × 48px` or `56px × 56px` circular containers (`#181818` or `#10E575`) hosting skip, pause, shuffle, and heart interactions.

### Chips & Filter Pills
- Inactive: Surface `#181818`, border `rgba(255, 255, 255, 0.06)`, text `#A3A3A3`, height `36px`, padding `8px 16px`, pill radius.
- Active: Background `#10E575`, text `#0A0A0A`, bold font weight.

### Track Lists & Rows
- Left-aligned `48px` square artwork with `rounded-md` (`8px` radius).
- Track name in `#FFFFFF` (`body-md`, Semi-Bold), artist and album under it in `#A3A3A3` (`body-sm`).
- Right-aligned duration label and a 3-dot context menu icon (`#737373`).
- Selected/Playing state: Track title shifts to `#10E575` with an animated equalizer graphic replacing the track index number.

### Floating Bottom Navigation Bar
- Island pill style suspended `16px` above the bottom screen boundary.
- Dark semi-transparent container `#121212` with `backdrop-filter: blur(20px)` and an inner stroke of `rgba(255, 255, 255, 0.08)`.
- Active item uses a solid `#10E575` circular/pill icon enclosure with `#0A0A0A` icon tint; inactive items display in neutral `#737373`.

### Music Mini-Player Widget
- Docked directly above the navigation bar with a compact `60px` height.
- Dark glass surface `#181818` with an ultra-thin green progress bar running along the top edge (`2px` height in `#10E575`).
- Left-aligned thumbnail, scrolling title, play/pause toggle button, and favorite heart icon on the right.

### Input Fields & Search
- Full pill container with background `#181818` and `rgba(255, 255, 255, 0.08)` border.
- Leading search icon in `#737373`, placeholder text in `#525252`, trailing voice/clear controls.