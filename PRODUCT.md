# Product

## Register

product

> The app as a whole is a **product** (an admin/ATS tool for reviewing candidates). But its three
> **public-facing entry surfaces** — the landing page (`/`), the application flow (`/aplicar`), and the
> admin login (`/admin/login`) — are treated in the **brand** register: they are the first impression,
> the acquisition funnel, and (for portfolio purposes) the only surfaces a viewer can open live without
> credentials. Design work on those three surfaces follows `reference/brand.md`; the admin dashboard
> behind the login follows `reference/product.md`.

## Users

- **Applicants** (public): people in Guaduas, Cundinamarca (Colombia) applying to work at the
  restaurants. Mostly on **mobile**, possibly on slow connections. Context: deciding whether this job
  is worth their time. They need warmth, trust, and a frictionless multi-step form.
- **Restaurant admins** (private): owners/managers who log in to review, score, and contact candidates.
- **Portfolio viewers** (meta-audience): potential clients evaluating the developer's work. They will
  open the live public links on a phone and judge craft in the first three seconds.

## Product Purpose

A hiring / applicant-tracking system for two sister restaurants — **La Glorieta** (est. 1960) and
**Salomé** (momentos · restó · café) — in Guaduas, Cundinamarca. It replaces informal hiring with a
structured virtual interview: applicants complete a multi-step form, admins review scored candidates
and manage the pipeline. Success = qualified applicants finish the form, and admins can act fast.

## Brand Personality

Warm, established, hospitable, artisanal. Heritage without being dusty. A family table, not a
corporate portal. Three words: **cálido, con solera (heritage), cuidado (crafted)**. Emotional goal on
the public surfaces: *"this is a real place that values its people"* — confidence + warmth, never
generic-SaaS-cold.

## Anti-references

- Bright electric-teal + glassmorphism cards on a gradient (the current login — reads as generic
  AI/SaaS template, and off-brand: the real logos are muted **petrol teal**, not neon).
- Emoji used as brand marks (🍽️ standing in for a logo).
- Gradient-text headlines, side-stripe accent borders, identical icon-card grids.
- Cold corporate portals; anything that feels like a bank login.

## Design Principles

1. **The brand is heritage-warm, not neon.** Petrol teal + dusty rose + warm cream, drawn from the real
   logos — never the electric `#14b8a6`.
2. **Committed color, not hedged.** The brand/hero panels are drenched in the brand's own color; the
   form panels are calm and readable. No timid gray-on-white everywhere.
3. **Mobile is the primary canvas.** Applicants and portfolio viewers are on phones first. Every "wow"
   must land at 390px before it lands at 1440px.
4. **Motion is orchestrated, not sprinkled.** One choreographed page-load per surface; staggered,
   purposeful, with a full `prefers-reduced-motion` alternative.
5. **Show craft in the details.** Focus rings, hit targets, error states, character counts, empty
   states — the small things are the portfolio.

## Accessibility & Inclusion

- Target **WCAG AA**: body text ≥ 4.5:1, large text ≥ 3:1, visible focus on every interactive element,
  ≥44px touch targets.
- Full `prefers-reduced-motion` fallback (crossfade / instant) for every animation.
- Spanish (`es_CO`) copy; forms usable one-handed on a phone.
