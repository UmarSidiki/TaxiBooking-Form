# Design

Visual source of truth: `src/shared/style/globals.css`. shadcn/ui New York, Tailwind v4, CSS variables.

## Surfaces

| Surface | Mode | Notes |
|---|---|---|
| Public booking wizard + embeddable forms | Persuade / convert | Clear 3 steps, price visible before pay, trustworthy payment UI |
| Admin dashboard | Operate | Scan tables, status, assign/cancel. Tool, not marketing |
| Driver portal | Operate | Glanceable upcoming trips; high contrast |
| Partner portal | Operate | Rides to accept, fleet, billing |

## Tokens

Change color, radius, and typography in `globals.css` (`@theme inline`, `:root`, `.dark`). Map to utilities: `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border`, `rounded-lg`.

Operator accent can be overridden at runtime via Appearance settings (`--primary-color`, `--border-radius`). Form-builder styles are stored per layout in Mongo — that is intentional, not a license to hardcode hex in dashboard chrome.

```
# BAD
className="bg-[#1a1a1a] rounded-[14px] text-[#2563eb]"

# GOOD
className="bg-background rounded-lg text-primary border-border"
```

## Craft floor

- Visible `:focus-visible` ring. Never `outline-none` without a replacement.
- Honor `prefers-reduced-motion`. Animate `opacity` / `transform` only. No `transition: all`.
- Hit targets ≥ 44px on mobile.
- Empty, loading (`…`), and error states are real UI.
- `ar` locale is RTL (`dir` from next-intl). Do not hardcode `left`/`right` where logical properties work.
- Copy: active voice, specific actions. Errors say how to fix. All eight `messages/*.json` files stay in sync.
