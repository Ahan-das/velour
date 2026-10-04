# Velour salon site (Next.js + TypeScript + Tailwind v4 + Motion + WebGL)

```bash
npm install
npm run dev    # http://localhost:3000
```

Sections, top to bottom (`app/page.tsx`):

- `Hero.tsx` + `SilkWordmark.tsx`: the wordmark and its columns in raw WebGL, photo inside the letters, cut-out head in front. `HERO_PHOTO` set to null falls back to the silk shader. `HeroSwatches.tsx` fills the space above the headline on desktop with a three-card preview of the services ring.
- `Manifesto.tsx`: words light up as you scroll (Motion `useScroll`), with an inline photo pill.
- `Services.tsx` + `lib/serviceFan.ts`: services as a colour-swatch ring. On computers the section pins and each scroll gesture turns one card (through Lenis); on touch screens you drag the ring sideways or use the arrows. "Book this" preselects the service in the booking form.
- `Lookbook.tsx`: pinned horizontal gallery driven by vertical scroll on desktop, native swipe row on mobile and with reduced motion.
- `Visit.tsx`: sticky photo that wipes to a new image as each step scrolls in.
- `Booking.tsx`: request form with validation and a confirmation state. `submitRequest` is a stub: wire it to the salon's booking tool or an email service before launch.
- `Footer.tsx`: contact columns and the name rising letter by letter.
- `SmoothScroll.tsx`: Lenis on desktop pointers only (skipped for touch and reduced motion).

All copy, prices, address, hours, phone and email are placeholders in `lib/content.ts`.

Photos: `public/img/*` and `public/hero/field.webp` come from the Maison Velle build; `field-cutout.webp` is made by `scripts/make-cutout.py` (colour key, numpy + Pillow + scipy).

