---
name: TaxiBooking-Form
description: One-operator chauffeur booking engine — public form wears operator colors; admin is a locked luxury desk.
colors:
  desk-limestone: "oklch(0.968 0.007 250)"
  desk-ink: "oklch(0.22 0.02 260)"
  desk-bronze: "oklch(0.40 0.06 58)"
  desk-bronze-ink: "oklch(0.99 0.01 85)"
  desk-graphite: "oklch(0.26 0.025 260)"
  desk-plaque: "oklch(0.96 0.008 85)"
  desk-muted: "oklch(0.42 0.02 260)"
  desk-line: "oklch(0.88 0.012 250)"
  desk-danger: "oklch(0.50 0.16 25)"
  desk-sidebar-accent: "oklch(0.32 0.02 260)"
  desk-sidebar-border: "oklch(0.34 0.02 260)"
  desk-secondary: "oklch(0.94 0.01 250)"
  desk-card: "oklch(0.99 0.004 250)"
  desk-gold: "oklch(0.72 0.08 70)"
  desk-accent: "oklch(0.94 0.012 58)"
  desk-accent-ink: "oklch(0.28 0.03 58)"
  desk-secondary-ink: "oklch(0.28 0.02 260)"
typography:
  desk:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  desk-title:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  desk-label:
    fontFamily: "Libre Franklin, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
  booking:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  desk: "0.375rem"
  booking: "var(--border-radius, 0.625rem)"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  desk-button-primary:
    backgroundColor: "{colors.desk-bronze}"
    textColor: "{colors.desk-bronze-ink}"
    rounded: "{rounded.desk}"
    padding: "12px 20px"
    height: "44px"
  desk-sidebar:
    backgroundColor: "{colors.desk-graphite}"
    textColor: "{colors.desk-plaque}"
---

# Design

Visual source of truth: `src/shared/style/globals.css`. Two surfaces share Tailwind token names (`bg-background`, `text-primary`) but **not** the same values.

## Overview

**Booking** (public wizard + embeddable): operator Appearance (`--primary-color`, `--secondary-color`, `--border-radius`) and form-builder Mongo styles. Geist. Convert.

**Desk** (`[data-surface="desk"]` on every `/dashboard/*`, `/drivers/*`, and `/partners/*` route, including those sign-ins): locked **private-terminal operations counter**. Libre Franklin. Graphite sidebar plaque, limestone canvas, bronze only on primary action and current nav. Appearance must not recolor this surface.

Settings on the admin desk is six usage-ordered subpages — **Daily** (checkout, modules, email) then **Setup** (appearance, map, gateways) — with a secondary nav and per-page Save. The plaque sidebar keeps a single Settings item; `/dashboard/settings` redirects to checkout.

World: private terminal / porte-cochère operations desk (seed `ce80ddc4`, assigned grounded candidate 7, degraded roll — no catalog challengers). Brief-pinned luxury chauffeur back office + Cleaning/Taxi chrome grammar (grouped icon-collapsible sidebar, split login). Color strategy: Restrained. Scene: staff at a well-lit terminal counter, cool daylight on limestone, dark signage rail.

## Colors

Desk tokens live only under `[data-surface="desk"]` and **do not** read `--primary-color`. Booking/` :root` still maps `--primary` to Appearance.

Bronze is for the primary button, focus ring, and active nav — never large fills. Status uses `destructive` for cancel/error; completed/upcoming use foreground weight plus a word, not a rainbow of utility colors.

Muted text on the desk is ink at lower chroma (`desk-muted`), not gray-500.

## Typography

Desk: one family, Libre Franklin, scale ratio ~1.125. Titles 1.5rem/600. Labels 0.8125rem/500. No display serif on the desk. Data IDs may use Geist Mono. Arabic falls back to `ui-sans-serif`.

Booking: Geist as today.

## Layout

Desk chrome: 16rem icon-collapsible sidebar + inset header (trigger, locale date, language) + scrollable main `p-6`. Auth: `lg:grid-cols-2` split — form column `max-w-xs`, graphite cover. Driver nav is a single Assignments item. Partner nav keeps Overview / Rides / History / Fleet / Account / Billing. Page rhythm: 24px between sections, 8px inside clusters. Breakpoints collapse sidebar to a Sheet below 768px. RTL uses logical properties.

## Elevation & Depth

Desk cards: `0 1px 1px oklch(0.22 0.02 260 / 0.06), 0 8px 24px oklch(0.22 0.02 260 / 0.06)`. No zero-offset glow. Sidebar is tonal (graphite) not a drop shadow wall.

## Shapes

Desk radius 6px (`0.375rem`) — plaque, not pill. Booking radius follows Appearance. Focus: 3px bronze ring. No `outline-none` without a replacement.

## Components

Same shadcn primitives. Desk restyles them through CSS variables, not one-off hex. Admin nav groups: Dispatch, Capacity, Network, Booking site, Desk. Driver: Assignments. Partner: role groups above. User footer + logout. Destructive actions keep a confirm step. Nested dialogs stay dialogs; organize insides with named sections, not nested-card soup.

## Do's and Don'ts

Do: token classes on desk chrome (`bg-background`, `text-foreground`, `bg-sidebar`). Do: empty, loading (`…`), and error as real UI. Do: keep form-builder Mongo hex on the **form preview**, not on builder chrome.

Don't: bake luxury hex into the public form. Don't: `text-gray-*` / `bg-blue-*` on desk chrome. Don't: department switcher, sparkle login, gradient text. Don't: copy Unified Services navy/gold. Don't: `transition: all`.
