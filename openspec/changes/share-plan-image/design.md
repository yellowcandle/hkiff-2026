# Share Plan Image — Design

## Rendering Approach

Use `modern-screenshot` (or `html2canvas` as fallback) to capture a hidden DOM element as a PNG blob. The element is styled with inline styles to ensure consistent rendering across browsers.

```
User clicks "Share as Image"
  → Build share card DOM (hidden, off-screen)
  → Render to PNG via modern-screenshot
  → Trigger download via <a download>
  → Clean up DOM
```

## Card Layout (1080 × 1920)

```
┌──────────────────────────────────────────┐
│  HKIFF 50                  我的排片計劃    │  Header
│  ══════════ red line ═══════════════════  │
│                                          │
│  4/2（四）                                │  Date heading
│  21:45  青青校園少女草                     │  Screening row
│         Palace ifc                       │  Venue
│                                          │
│  4/5（日）                                │
│  17:45  大濛                              │
│         香港文化中心大劇院                  │
│  21:00  半邊人                             │
│         東九文化中心演藝廳                  │
│                                          │
│  ... more days ...                       │
│                                          │
│  4/11（六）                               │
│  17:15  模範公屋                           │
│         英皇戲院                           │
│  20:45  似是有緣人                         │
│         東九文化中心演藝廳                  │
│                                          │
│              ── spacer ──                │  Flexible spacer
│                                          │
│       10 場放映 · 7 天 · 12 張票          │  Summary stats
│         建立你的排片計劃                    │  CTA
│       hkiff.herballemon.dev              │  URL
└──────────────────────────────────────────┘
```

## Typography

- Times use monospace font (`font-variant-numeric: tabular-nums` or JetBrains Mono) for grid alignment
- Time column has fixed width so all titles align to same x position
- All other text uses DM Sans (matching the site)

## Dynamic Text Sizing

Fixed card size (1080×1920), ~1500px usable content area. Scale text based on screening count:

| Screenings | Title   | Time    | Venue   | Date Head | Day Gap |
|------------|---------|---------|---------|-----------|---------|
| 1–4        | 48px    | 48px    | 32px    | 40px      | 64px    |
| 5–7        | 42px    | 42px    | 28px    | 36px      | 48px    |
| 8–10       | 36px    | 36px    | 24px    | 34px      | 32px    |
| 11–14      | 30px    | 30px    | 20px    | 28px      | 24px    |
| 15+        | 26px    | 26px    | 18px    | 24px      | 18px    |

## Color Palette

| Element              | Color   |
|----------------------|---------|
| Background           | #0A0A0A |
| Film titles          | #FFFFFF |
| Times                | #999999 |
| Venue names          | #777777 |
| Date headings        | #DC2626 |
| Ticket qty (×N)      | #DC2626 |
| Divider line         | #DC2626 |
| Guest badge          | #A855F7 |
| Stats text           | #666666 |
| CTA text             | #999999 |
| CTA URL              | #DC2626 |
| "MY PLAN" label      | #666666 |
| Footer divider       | #333333 |

## Sorting

Within each day, screenings with `guestAttend: true` are shown first.

## Locale Awareness

All text respects the user's current locale:

| Element         | EN                          | ZH                      |
|-----------------|-----------------------------|-------------------------|
| Plan label      | MY PLAN                     | 我的排片計劃              |
| Date            | 4/3 (Fri)                   | 4/3（五）                |
| Film title      | film.title.en               | film.title.zh           |
| Venue           | venue.name.en               | venue.name.zh           |
| Guest badge     | Filmmaker will attend        | 製作人／影評人將出席       |
| Stats           | 10 screenings · 7 days · 12 tickets | 10 場放映 · 7 天 · 12 張票 |
| CTA             | Build your plan at           | 建立你的排片計劃           |

## Ticket Quantity

When quantity > 1, show `×N` in red (#DC2626) inline after the film title.

## Pencil Mockup Reference

- Node `2H4Ri` in `pencil-new.pen` — full 10-screening real plan mockup (ZH locale)
