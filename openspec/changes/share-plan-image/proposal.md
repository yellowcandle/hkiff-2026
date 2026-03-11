# Share Plan as Image

## Summary

Add a "Share as Image" button to the My Plan page that generates a branded 1080×1920 PNG graphic of the user's screening plan, suitable for sharing on Instagram Stories and Threads.

## Motivation

The current text export is too long for social media platforms with character limits. A visual share card would be more engaging, drive traffic back to the site via the CTA, and let users show off their festival plans.

## Scope

- Client-side image generation (no server dependency)
- Renders a hidden HTML element styled as the share card, captures it as PNG
- Respects user's current locale (en/zh) for all text: dates, titles, venues, guest badges, stats, CTA
- Dynamically scales text based on screening count (4 tiers)
- Shows ticket quantity (×N) when > 1
- Sorts guest-attendance screenings first within each day
- Separate "Share as Image" button alongside existing "Share / Export"
- Triggers browser download prompt for the generated PNG

## Out of Scope

- Server-side OG image generation
- Video/animated exports
- Custom color themes
