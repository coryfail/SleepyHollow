# Design — Sleepy Hollow website

A locked design system for `website/`. Both routes read this file before any
further redesign work. Do not regenerate the palette or type pairing per page —
extend or amend this file when the system needs to grow. This system was
already approved and delivered (see `website.req.md`); this redesign pass
keeps every token and reworks only structure and component voice within it.

## Genre

atmospheric — dark, misted, nocturnal woodland; serious and technical, not
Halloween decoration (governed by AC-HOME-008).

## Macrostructure family

- Marketing page (`/`): Marquee Hero, typography only (no hero enrichment —
  removed at the project owner's request; a Tier-A CSS atmospheric panel was
  tried and rejected). Below the hero: the problem statement, a code panel, an
  unnumbered capability ledger, a verification panel, the install block, then a
  statement-style closing CTA band.
- Content page (`/sgad/`): Long Document. Reading-focused methodology
  document, typography only, no enrichment — this is the deliberate structural
  contrast against the marketing page (AC-SITE-005).
- Documentation (`/docs/`, `/docs/…`): Sidebar Document. A persistent guide
  list in a 14–16rem column at ≥60rem, collapsing above the article below that.
  Bodies are generated from the canonical Markdown under `docs/`, so the
  selectors below are generic on purpose — nothing hand-authors that markup.
- Generated reference (`/api/`): outside this system. Produced by `deno doc
  --html`; the Deno toolchain owns its markup and theme. It is labeled as a
  generated reference wherever it is linked so its different appearance does
  not read as a broken page.

## Theme — Midnight (locked, unchanged)

- `--color-paper`        oklch(13% 0.018 250)
- `--color-paper-2`      oklch(17% 0.022 250)
- `--color-paper-3`      oklch(22% 0.025 250)
- `--color-ink`          oklch(95% 0.009 85)
- `--color-body`         oklch(83% 0.012 85)
- `--color-muted`        oklch(69% 0.016 85)
- `--color-rule`         oklch(36% 0.028 250)
- `--color-rule-strong`  oklch(52% 0.035 250)
- `--color-accent`       oklch(76% 0.15 58)
- `--color-accent-soft`  oklch(67% 0.09 58)
- `--color-focus`        oklch(82% 0.16 72)
- `--color-mist`         oklch(74% 0.035 220)
- `--color-pine`         oklch(31% 0.045 168)
- `--color-on-accent`    alias for `--color-paper` — label color for filled
  accent surfaces (added this pass; needed once a real filled CTA exists)

## Typography (locked, unchanged)

- Display: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif —
  weight 600, roman only (no italic headers)
- Body: "Avenir Next", Avenir, "Segoe UI", Helvetica, Arial, sans-serif
- Mono: "SFMono-Regular", "Cascadia Code", "Liberation Mono", monospace
- Display tracking: -0.035em to -0.04em depending on scale
- Type scale anchor: `--text-display` = clamp(2.75rem, 5vw + 1rem, 5.25rem)

## Spacing

4-point named scale, values in `tokens.css` (`--space-3xs` through
`--space-4xl`). Pages use named tokens only, never raw values.

## Motion

- Easings: `--ease-out` cubic-bezier(0.16, 1, 0.3, 1) (also `--ease-in`,
  `--ease-in-out`), never the browser default.
- Reveal pattern: one orchestrated hero fade-in-and-settle on load, nothing
  else. No scroll-triggered reveals anywhere on the site.
- Reduced-motion fallback: the existing blanket rule (`* { animation: none
  !important; transition-duration: 0s !important; }`) covers every addition
  in this pass automatically.

## Microinteractions stance

- Silent success — the site performs no actions with a result to confirm.
- CTA hover lift: `translateY(-2px)` + background-fade, 200ms `--ease-out`,
  scoped to `(hover: hover) and (pointer: fine)`.
- Button press: `translateY(1px)` on `:active`, no scale, no bounce.
- No toasts, no modals, no tooltips on this site.

## CTA voice

- Primary CTA (`.text-action--primary`): filled pill, `--color-accent`
  background, `--color-on-accent` label, `--radius-round` corners, hover
  lightens to `--color-accent-soft` and lifts 2px, active settles 1px.
- Secondary CTA (`.text-action`): typographic link — bold label, hairline
  bottom rule, arrow glyph, hover slides right 4px. No box, no fill. Never
  two primary buttons in the same row.
- Every CTA pairs a plain-language verb with a directional glyph (`→`
  internal, `↗` external) that is `aria-hidden`.

## Per-page allowances

- Marketing page (`/`) MAY use enrichment — Tier-A CSS art only, no
  illustration, no photography, no `<svg>`.
- Content page (`/sgad/`) MUST NOT use enrichment — the document structure
  and the lifecycle numbering carry it.

## Code and command surfaces

- `.code-block` — bordered `--color-paper-2` panel, mono at `--text-sm`,
  `overflow-x: auto`, `tabindex="0"` with a labeled region so keyboard users
  can scroll it. A language chip sits top-right when the fence declares one.
- `.table-scroll` — the same treatment for generated Markdown tables.
- `.install-line` — uppercase label above a bordered command panel. Used on the
  home page, the SGAD page, and the documentation index.
- No syntax highlighting anywhere. Multi-colour tokens fight the Midnight
  palette, and adding a highlighter would ship a runtime the pages do not
  otherwise need.

## What pages MUST share

- The wordmark, the edge-aligned nav bar (N9), the inline-rule footer (Ft2).
- The Midnight token set — no raw OKLCH/hex in page-specific CSS.
- The CTA voice (button shape, radius, padding rhythm, hover lift).
- Section-heading rhythm: small-caps accent-soft eyebrow label above the `h2`.

## What pages MAY differ on

- Macrostructure (Marquee Hero vs. Long Document) — already the case.
- Enrichment — marketing page only, Tier-A CSS, never on the content page.
- Section density — the content page reads long-form; the marketing page
  stays concise per its own requirement.

## Exports

### tokens.css

```css
:root {
  --color-paper: oklch(13% 0.018 250);
  --color-paper-2: oklch(17% 0.022 250);
  --color-paper-3: oklch(22% 0.025 250);
  --color-ink: oklch(95% 0.009 85);
  --color-body: oklch(83% 0.012 85);
  --color-muted: oklch(69% 0.016 85);
  --color-rule: oklch(36% 0.028 250);
  --color-rule-strong: oklch(52% 0.035 250);
  --color-accent: oklch(76% 0.15 58);
  --color-accent-soft: oklch(67% 0.09 58);
  --color-on-accent: var(--color-paper);
  --color-focus: oklch(82% 0.16 72);
  --color-mist: oklch(74% 0.035 220);
  --color-pine: oklch(31% 0.045 168);

  --font-display: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
  --font-body: "Avenir Next", Avenir, "Segoe UI", Helvetica, Arial, sans-serif;
  --font-mono: "SFMono-Regular", "Cascadia Code", "Liberation Mono", monospace;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-short: 200ms;
  --radius-sm: 0.25rem;
  --radius-round: 999px;
}
```

This system is already live in `tokens.css`; the block above is a portable
copy for reuse outside this repository.
