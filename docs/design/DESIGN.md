---
name: Clinical Vitality
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#5c403c'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#916f6b'
  outline-variant: '#e6bdb8'
  surface-tint: '#bf0715'
  primary: '#b70011'
  on-primary: '#ffffff'
  primary-container: '#dc2626'
  on-primary-container: '#fff6f5'
  inverse-primary: '#ffb4ab'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#006645'
  on-tertiary: '#ffffff'
  tertiary-container: '#008259'
  on-tertiary-container: '#e1ffec'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ab'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#93000b'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: plusJakartaSans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: plusJakartaSans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-xl:
    fontFamily: plusJakartaSans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: plusJakartaSans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: plusJakartaSans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: plusJakartaSans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: plusJakartaSans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0em
  body-md:
    fontFamily: inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.005em
  label-md:
    fontFamily: inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  stat-display:
    fontFamily: plusJakartaSans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 42px
    letterSpacing: -0.025em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-base: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 2.5rem
  space-4xl: 3rem
  gutter-mobile: 1rem
  gutter-tablet: 1.5rem
  gutter-desktop: 1.5rem
  margin-mobile: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
---

## Brand & Style

This design system serves a critical healthcare mission: orchestrating high-stakes blood donation drives, managing donor lifecycles, and monitoring real-time inventory levels for hospitals and mobile transfusion clinics.

### Brand Personality & Emotional Intent
- **Clinical Precision with Human Warmth:** The UI projects absolute hygienic clarity, medical rigour, and dependability without slipping into cold or sterile hostility. It comforts first-time donors while providing high-density utility to phlebotomists, inventory managers, and triage staff.
- **Urgent yet Composed:** Urgency around critical blood shortages is communicated with measured clarity rather than alarming visual noise.
- **Radical Legibility:** Every blood type badge, screening metric, vital stat, and status indicator must be unmistakable under direct clinic lighting and outdoor donation tent conditions.

### Design Movement
- **Modern Clinical Minimalism:** Pure, immaculate white backgrounds combined with low-contrast structural borders, surgical typography, and precise crimson accents. Visual clutter is stripped away in favor of high-contrast micro-copy, clear data compartmentalization, and soft tint fills that reduce cognitive fatigue.

## Colors

The palette is engineered around high functional contrast, clear medical state delineation, and optical hygiene.

### Color Tiers & Roles

- **Primary (Blood Crimson):** `#DC2626` serves as the primary action driver, call-to-action anchor, and brand focal point. `#B91C1C` is reserved for interactive hover/active states and severe blood type shortages. Soft rose tints (`#FEF2F2` for surface fills, `#FEE2E2` for borders/accents) ground high-priority modules without inducing visual panic.
- **Secondary (Clinical Slate / Deep Navy):** `#0F172A` delivers authoritative contrast for primary headings, quantitative metrics, and vital status displays. `#334155` handles secondary headers and navigation states.
- **Muted Neutrals & Supporting Tones:** `#64748B` anchors body copy, metadata, and field descriptions. `#94A3B8` is strictly applied to placeholder text, inactive icons, and subtle dividers.
- **Backgrounds & Clinical Surfaces:**
  - Base canvas: `#FAFAFA`
  - Elevated cards & clean wells: `#FFFFFF`
  - Secondary wells, data tables, and subtle compartmentalization: `#F4F5F7`
- **Functional Semantics:**
  - **Success (Emerald):** `#10B981` (tint: `#ECFDF5`, border: `#A7F3D0`) for completed donations, verified donor eligibility, and safe inventory reserves.
  - **Caution (Amber):** `#F59E0B` (tint: `#FFFBEB`, border: `#FDE68A`) for pending laboratory screenings, scheduled appointments, and declining stock levels.
  - **Critical / Danger:** Handled by primary Crimson (`#DC2626`) for immediate shortages, deferred donors, and emergency dispatch alerts.

All textual combinations with white or neutral backgrounds strictly enforce a minimum contrast ratio of 4.5:1 for body copy and 3:1 for large numeric displays.

## Typography

The typographic hierarchy pairs the friendly, structured geometry of **Plus Jakarta Sans** for headers, metrics, and donor identification badges with the unmatched structural clarity of **Inter** for administrative forms, health screening questionnaires, and inventory tables.

### Rules of Application
- **Data & Vitals Display:** Key physiological metrics (Hemoglobin, BP, Pulse, Pints Collected) use `stat-display` in tabular numerical figures (`font-variant-numeric: tabular-nums`) to prevent alignment jitter during real-time updates.
- **Form Fields & Questionnaires:** Labels always use `label-md` or `label-lg` in `#0F172A` to maintain peak readability for clinical staff under rapid data-entry conditions.
- **Badges & Blood Group Indicators:** Standard blood groupings (e.g., `O-`, `A+`, `AB+`) use `headline-sm` or `label-lg` with tight tracking and center alignment within badge tokens.

## Layout & Spacing

A strict 8px base rhythm governs all layout, card padding, and vertical component stacks, with a 4px sub-grid for fine adjustments (micro-labels, table cell paddings, and icons).

### Grid Structure
- **Desktop (>= 1280px):** 12-column responsive layout with max content container bounded at `1440px`. Column gutter is `24px` (`space-xl`), side margin is `48px` (`space-4xl`).
- **Tablet (768px – 1279px):** 8-column layout. Gutter is `24px`, side margin is `32px` (`space-2xl`). Useful for donation check-in desks and triage tablets.
- **Mobile (< 768px):** 4-column layout. Gutter is `16px` (`space-base`), side margin is `16px`. Mobile drives collapse multi-column stats into vertical status stacks.

### Clinical Density Considerations
- **High-Density Inventory & Screening Tables:** Vertical row padding is compressed to `space-sm` (`8px`) or `space-md` (`12px`) to maximize visible records on single displays.
- **Public Donor Booking Flows:** Vertical padding expands to `space-2xl` (`32px`) and `space-3xl` (`40px`) to provide an airy, calm, and reassuring user experience.

## Elevation & Depth

To preserve an immaculate, clinical aesthetic, this design system avoids heavy, murky drop shadows. Depth is achieved via **tonal layering**, **micro-borders**, and **surgical ambient diffusion**.

### Elevation Scale
- **Level 0 (Flat Surface):** `#FAFAFA` base screen background with `#F4F5F7` section containers. No shadow.
- **Level 1 (Clinical Cards & Form Panels):** Pure white (`#FFFFFF`) with a hairline border (`1px solid #E2E8F0`). Shadow: `0 1px 2px 0 rgba(15, 23, 42, 0.04)`.
- **Level 2 (Dropdowns, Hovered Cards, Status Drawers):** `#FFFFFF` with `1px solid #CBD5E1`. Shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`.
- **Level 3 (Modals, Emergency Drive Alerts, Sticky Action Bars):** `#FFFFFF` with `1px solid #94A3B8`. Shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`.

### Border Guidelines
Borders define structural boundaries in lieu of contrasty fills. Default element borders use `#E2E8F0`. Focused inputs or active panels transition to `#DC2626` or `#0F172A` with an accompanying subtle ring (`0 0 0 3px rgba(220, 38, 38, 0.12)`).

## Shapes

The system implements a **Soft** shape archetype (`roundedness: 1`). This provides crisp, professional geometry suitable for healthcare instrumentation, while softening harsh corners to maintain donor trust.

### Radii Mapping
- **Base Components (Inputs, Buttons, Badges, Table Rows):** `0.25rem` (`4px`) or `0.375rem` (`6px`). Delivers clean clinical structure.
- **Containers & Cards (`rounded-lg`):** `0.5rem` (`8px`). Standard boundary for donor records, campaign summaries, and inventory grids.
- **Modals & Flyouts (`rounded-xl`):** `0.75rem` (`12px`). Reserved for high-level dialogs, medical intake drawers, and blood type selection matrices.
- **Pill Exception (Status Badges & Blood Group Tokens):** Full pill rounding (`9999px`) is strictly reserved for blood group indicators (e.g., `[ O- ]`), donor status chips (`Eligible`, `Deferred`), and operational urgency tags.

## Components

### 1. Buttons
- **Primary Action (Book Donation, Dispatch Units):** Solid `#DC2626` background, `#FFFFFF` text, `4px` radius, `0 1px 2px rgba(220, 38, 38, 0.2)` shadow. Hover: `#B91C1C`. Focus: 3px outer ring `rgba(220, 38, 38, 0.25)`.
- **Secondary Action (Save Draft, Export Roster):** `#FFFFFF` background, `1px solid #E2E8F0` border, `#0F172A` text. Hover: `#F8FAFC` background with border `#CBD5E1`.
- **Destructive Action (Cancel Camp, Revoke Clearance):** `#FEF2F2` background, `1px solid #FEE2E2` border, `#B91C1C` text. Hover: `#FEE2E2`.
- **Sizes:** Small (32px height, 12px horizontal pad), Medium (40px height, 16px horizontal pad), Large (48px height, 24px horizontal pad).

### 2. Blood Group & Status Chips
- **Blood Group Token:** Dedicated circular or pill badge. Dimensions: 32px x 32px or 28px height pill. `#FEF2F2` background with `#DC2626` text and `1px solid #FCA5A5` outline. High-priority shortages pulse subtly or render inverted: `#DC2626` background with `#FFFFFF` bold text.
- **Operational Status Chips:**
  - *Cleared / Active:* `#ECFDF5` background, `#065F46` text, `#A7F3D0` border.
  - *Screening / Pending:* `#FFFBEB` background, `#92400E` text, `#FDE68A` border.
  - *Deferred / Ineligible:* `#FEF2F2` background, `#991B1B` text, `#FECACA` border.

### 3. Form Inputs & Screening Checkboxes
- **Text Inputs:** Height `40px`, `#FFFFFF` background, `1px solid #E2E8F0` border, `4px` radius. Font `body-md` in `#0F172A`. Focused state: border `#DC2626`, ring `3px rgba(220, 38, 38, 0.12)`.
- **Screening Checkboxes & Radio Buttons:** `18px x 18px` square (`3px` radius for checkboxes, full circle for radios). Unchecked: `1.5px solid #94A3B8`, `#FFFFFF` fill. Checked: `#DC2626` fill with pure white tick/dot icon.

### 4. Donor & Camp Summary Cards
- White `#FFFFFF` surface with `1px solid #E2E8F0` perimeter border. Padding: `20px` (`space-lg` to `space-xl`). Header row features donor name/ID in `#0F172A`, blood type badge floating in the top right, and donation milestone bars along the bottom.

### 5. Blood Reserve Level Indicator (Specialized Component)
- Segmented vertical or horizontal gauge tracking current blood units against target camp quotas. Background track `#F1F5F9`. Progress fill uses dynamic threshold colors: `#DC2626` for under 25% (Critical), `#F59E0B` for 25–50% (Moderate), and `#10B981` for >50% (Sufficient). Tabular metric readouts accompany each segment.