---
name: next-intl-copy
description: eight-locale next-intl copy for the taxi booking form. Use when adding or changing user-visible strings, errors, emails shown in UI, RTL Arabic, or messages/*.json.
---

# next-intl copy

Locales: `en` `fr` `es` `de` `nl` `it` `ru` `ar`. Default `en`. Config: `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/i18n/navigation.ts`.

## Always

- Add or change keys in **all eight** `messages/{locale}.json` files in the same change.
- Keep key paths identical across locales. Nested objects match existing files (`Step1`, `Step2`, `Footer`, …).
- UI: `useTranslations('Step1')` / `getTranslations`. Links/router: `Link` / `useRouter` from `@/i18n/navigation`.
- Never show raw Zod, NextAuth, Stripe, or Mongoose English to users. Map to a dictionary key.
- Loading strings end with `…`.

## RTL

`ar` is RTL. Prefer CSS logical properties. Don't assume a back-chevron means “previous” visually on the right.

## Don'ts

- Don't hardcode button labels in JSX.
- Don't add a ninth locale unless asked (also update `routing.locales` and this skill).
- Don't leave a key in `en.json` only.
- Don't use English `error.message` from `safeParse` in toasts.

## Email

HTML email templates in `src/controllers/email/` are mostly English today. Do not silently switch them to i18n unless the task is email localization. UI chrome still goes through `messages/`.
