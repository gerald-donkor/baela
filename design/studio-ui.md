# Baela Studio

Studio extends Horizon for the sole instructor. Its main job is to move a real course from draft to published without losing track of lesson drafts or media readiness.

- Palette: midnight canvas `#050919`, navy card `#0b1023`, raised surface `#10182d`, blue action `#a6bfff`, quiet text `#9aa7c2`, fine border `#222c45`. Use the existing semantic tokens so the light theme follows automatically.
- Type: existing Geist Sans; left-aligned 32–40px page titles, 18px panel titles, 14px controls and body, 12px supporting metadata.
- Layout: persistent 200px Studio navigation beside a flexible workspace. On mobile the navigation becomes a wrapped horizontal strip. The course library occupies the main panel; a narrower publishing guide provides the next useful action. Course editing separates details, trailer, curriculum, and publishing into explicit views.
- Character: borrow the landing preview's framed workspace and restrained blue horizon in one introductory panel. Keep the authoring surfaces quiet, with varied hierarchy rather than identical metric cards.

```
Studio navigation | Your courses                  New course
                  | Course counts / search / status filters
                  | Course library                Publishing guide
                  |                               Media connection
```

Review against the brief: preserve existing colors, typography, radii, and primitives. Avoid invented revenue, enrollments, and courses. Derive library counts from real data. The backend already implements authoring and authorization; reuse it. Explain immediate course metadata changes separately from explicit lesson publication. Configuration status describes credentials present, not a verified provider connection.
