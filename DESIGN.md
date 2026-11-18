# Design System: Webify Pulse

> Auto-generated from Google Stitch via **Stitch MCP** for **Webify Music Streaming App** (`projects/375546482247524659`).  
> **Design System ID**: `assets/49161cc0200344039fb9c2a9e6867786`  
> **Color Mode**: Dark (Fidelity Variant) | **Base Geometry**: Round Full / Organic Pills

---

## 1. Brand Philosophy & Visual Aesthetic

**Webify Pulse** delivers an immersive, dark-mode-first sonic sanctuary engineered for high-engagement streaming. The design balances tactile precision with midnight elegance—dynamic, effortless, and focused strictly on the music.

### Core Principles
- **Content-First Canvas**: True pitch-black (`#0A0A0A` / `#131313`) and deep charcoal tiers (`#181818`, `#201F1F`) recede behind album artwork and artist visuals to maximize focus on audio content.
- **Electric Emerald Milestones**: High-energy electric emerald (`#10E575`) guides touch targets, playback progress, active tab indicators, and primary CTAs.
- **Liquid Glass & Organic Tactility**: Pill-shaped interactive controls, frosted floating navigation pods, and soft surface gradients tailored for one-handed mobile ergonomic interaction.
- **Atmospheric Luminescence**: Depth is conveyed through diffuse colored light and surface luminance rather than hard drop shadows.

---

## 2. Color Palette

### 2.1 Core Palette Overview

| Token Name | Hex Code | RGB / RGBA | Intended Usage |
| :--- | :--- | :--- | :--- |
| **`primary`** | `#10E575` | `rgb(16, 229, 117)` | Main brand accent, play button, active indicators, sliders |
| **`primary-light`** | `#6FFF9A` | `rgb(111, 255, 154)` | Neon highlight, active states on dark surfaces |
| **`primary-glow`** | — | `rgba(16, 229, 117, 0.22)` | Diffuse ambient glow around playheads and hero artwork |
| **`secondary`** | `#1DB954` | `rgb(29, 185, 84)` | Secondary brand green (Spotify-adjacent emerald) |
| **`secondary-dim`** | `#53E076` | `rgb(83, 224, 118)` | Secondary icons, subtle active badges |
| **`tertiary`** | `#22C55E` | `rgb(34, 197, 94)` | Auxiliary accent, success indicators |
| **`tertiary-dim`** | `#4AE176` | `rgb(74, 225, 118)` | Tertiary containers and subdued badges |

### 2.2 Surface & Elevation Hierarchy

| Level | Token | Hex Code | Purpose & Treatment |
| :--- | :--- | :--- | :--- |
| **Layer 0** | `surface-canvas` | `#0A0A0A` / `#131313` | Root page background, empty state canvas |
| **Layer 1** | `surface-card` | `#121212` / `#1C1B1B` | Album cards, hero sections; border: `1px solid rgba(255,255,255,0.06)` |
| **Layer 2** | `surface-pod` | `#181818` / `#201F1F` | Floating mini-player, nav island; `backdrop-filter: blur(24px)` |
| **Layer 3** | `surface-modal` | `#2A2A2A` / `#353534` | Dropdowns, dialogs, active bottom sheets, popovers |
| **Layer 4** | `surface-bright` | `#393939` | Hover states, active selection highlights |

### 2.3 Typography & Foreground Contrast

| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| **`text-primary`** (`on-surface`) | `#E5E2E1` | Primary headings, song titles, main body text |
| **`text-secondary`** (`on-surface-variant`) | `#BACBB9` / `#A3A3A3` | Artist names, album titles, secondary metadata |
| **`text-muted`** (`outline`) | `#859585` / `#737373` | Inactive icons, timestamps, track duration, disabled labels |
| **`text-inverse`** (`on-primary`) | `#003918` / `#0A0A0A` | Text labels rendered over emerald primary buttons |

### 2.4 Semantic & Feedback

| Token Name | Hex Code | Container Hex | Purpose |
| :--- | :--- | :--- | :--- |
| **Error** | `#FFB4AB` | `#93000A` | Playback failure, network disconnect, destructive actions |
| **On-Error** | `#690005` | `#FFDAD6` | Text/icon over error container |
| **Outline Variant** | `#3C4A3D` | — | Dividers, card separator lines, subtle borders |

---

## 3. Typography

- **Primary Font Family**: `Plus Jakarta Sans`, sans-serif
- **Fallback Stack**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Monospace Stack**: `JetBrains Mono, Menlo, monospace` (for timestamps & timecode)

### 3.1 Type Scale Hierarchy

| Token | Size | Line Height | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`headline-xl`** | 40px (`2.5rem`) | 48px | 700 (Bold) | -0.02em | Hero banner headlines, desktop album titles |
| **`headline-xl-mobile`** | 30px (`1.875rem`) | 38px | 700 (Bold) | -0.02em | Mobile hero headers, Now Playing track title |
| **`headline-lg`** | 28px (`1.75rem`) | 36px | 700 (Bold) | -0.015em | Section titles, curated playlist page titles |
| **`headline-lg-mobile`** | 24px (`1.5rem`) | 32px | 700 (Bold) | -0.015em | Mobile section titles |
| **`headline-md`** | 20px (`1.25rem`) | 28px | 600 (Semi-Bold) | -0.01em | Card headings, queue section titles |
| **`headline-sm`** | 18px (`1.125rem`) | 24px | 600 (Semi-Bold) | 0.00em | Modal headers, playlist shelf headers |
| **`body-lg`** | 16px (`1rem`) | 24px | 400 (Regular) | 0.00em | Primary description text, lyrics body |
| **`body-md`** | 14px (`0.875rem`) | 20px | 400 (Regular) | 0.00em | Track row titles, search results |
| **`body-sm`** | 12px (`0.75rem`) | 16px | 400 (Regular) | 0.00em | Artist names, album subtitle metadata |
| **`label-lg`** | 14px (`0.875rem`) | 18px | 600 (Semi-Bold) | +0.01em | CTA button labels, filter pills |
| **`label-md`** | 12px (`0.75rem`) | 16px | 600 (Semi-Bold) | +0.02em | Badges, duration labels, tab bar text |
| **`label-sm`** | 10px (`0.625rem`) | 14px | 500 (Medium) | +0.04em | Time elapsed / remaining tags, format pills |

---

## 4. Spacing, Layout & Elevation

### 4.1 Spacing Scale

Built on an **8pt base grid** with a **4pt micro-step**:

| Token | Size (rem) | Pixels | Usage |
| :--- | :--- | :--- | :--- |
| `space-2xs` | `0.25rem` | 4px | Micro-padding, badge icon offsets |
| `space-xs` | `0.5rem` | 8px | Gap between icon and text, tag padding |
| `space-sm` | `0.75rem` | 12px | Internal card padding, compact list gaps |
| `space-md` | `1rem` | 16px | Standard component padding, list gaps |
| `space-lg` | `1.5rem` | 24px | Section gaps, modal padding |
| `space-xl` | `2rem` | 32px | Major section breaks |
| `space-2xl` | `3rem` | 48px | Page header spacing |

### 4.2 Viewport Grids & Margins

- **Mobile (<640px)**: 4-column layout; `20px` (`1.25rem`) outer margin; `16px` (`1rem`) gutters. Includes an `80px` bottom clearance padding to float freely above the bottom navigation bar and mini-player.
- **Tablet & Desktop (≥768px)**: 12-column layout; `40px` (`2.5rem`) outer margins; `24px` (`1.5rem`) gutters. Left rail navigation drawer with a persistent bottom playback bar.

### 4.3 Elevation & Shadows
- **No Harsh Drop Shadows**: Layering is achieved via surface luminance contrast and borders (`1px solid rgba(255, 255, 255, 0.06)`).
- **Glassmorphism**: `backdrop-filter: blur(24px)` on floating navigation pods and mini-players.
- **Emerald Atmosphere**: Active play buttons cast an ambient glow:
  ```css
  box-shadow: 0 12px 32px rgba(16, 229, 117, 0.22);
  ```

---

## 5. Component Specifications

### 5.1 Buttons
- **Primary CTA**: Full pill radius (`rounded-full`), background `#10E575`, text `#0A0A0A` (Semi-Bold), padding `16px 28px`. Hover adds radial emerald glow.
- **Secondary Ghost**: Pill radius, background `transparent`, border `1px solid rgba(255, 255, 255, 0.16)`, text `#FFFFFF`.
- **Icon Controls**: Circular containers `48px × 48px` or `56px × 56px` (`#181818` or `#10E575`).

### 5.2 Filter Chips & Category Pills
- **Inactive**: Background `#181818`, border `1px solid rgba(255, 255, 255, 0.06)`, text `#A3A3A3`, height `36px`, padding `8px 16px`, pill radius.
- **Active**: Background `#10E575`, text `#0A0A0A`, font weight `700`.

### 5.3 Track Rows & Lists
- **Artwork**: `48px × 48px` square artwork with `rounded-md` (`8px`).
- **Typography**: Track name in `#E5E2E1` (`body-md`), artist name in `#A3A3A3` (`body-sm`).
- **Actions**: Trailing duration label (`label-md`) and 3-dot context menu (`#737373`).
- **Playing State**: Track title shifts to `#10E575` with an animated equalizer replacing the track index number.

### 5.4 Floating Navigation & Mini-Player
- **Island Bottom Nav**: Suspended `16px` above screen bottom, surface `#121212` with `backdrop-filter: blur(20px)`, outline `rgba(255, 255, 255, 0.08)`. Active item enclosed in `#10E575` pill.
- **Mini-Player Widget**: Docked above nav bar (`60px` height) in `#181818` glass, featuring a `2px` top emerald progress bar (`#10E575`), thumbnail, marquee song title, and play/heart buttons.

---

## 6. Stitch Project Screens

Synchronized from Stitch project `projects/375546482247524659`:

| Screen Name | Screen Resource ID | Description |
| :--- | :--- | :--- |
| **Webify - Now Playing & Queue** | `screens/fb6ec3ed8d5b4ebd9b36c17d07c28a9a` | Full-screen player with lyrics, queue reorder & audio controls |
| **Webify - Home Discovery** | `screens/8bf7974dda56499dbe73e0948f72924b` | Mobile home feed with trending tracks & vibe discovery shelves |
| **Webify - Search & Browse** | `screens/bf00db4245c64a32ad02f92bbd6894e4` | Instant search view with pill filters and categorical browse tiles |
| **Webify - Playlist & Album Detail** | `screens/58e32ea8855b4a3782ef3160540fd996` | Mobile album header, tracklist rows, and action bar |
| **Webify Web - Home Discovery** | `screens/db567308bcf64575a0bde960c9d1fca4` | Desktop 12-column grid view with left-rail navigation dock |
| **Webify Web - Explore & Browse** | `screens/62e35059e66c478090999a829c334924` | Desktop search, genre cards, and trending music shelves |
| **Webify Web - Playlist & Album Detail**| `screens/6b63bd8f374e4ea79b33ae4c1a9ee470` | Desktop playlist detail view with multi-column table layout |

---

## 7. Tailwind CSS Configuration Mapping

To align the local project with this design system, extend your `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#10E575",
          "primary-light": "#6FFF9A",
          secondary: "#1DB954",
          "secondary-dim": "#53E076",
          tertiary: "#22C55E",
        },
        surface: {
          canvas: "#0A0A0A",
          base: "#131313",
          card: "#121212",
          cardElevated: "#1C1B1B",
          pod: "#181818",
          modal: "#2A2A2A",
          bright: "#393939",
        },
        content: {
          primary: "#E5E2E1",
          secondary: "#BACBB9",
          muted: "#859585",
          disabled: "#525252",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      boxShadow: {
        "emerald-glow": "0 12px 32px rgba(16, 229, 117, 0.22)",
      },
      borderRadius: {
        pill: "9999px",
      },
    },
  },
};
```
