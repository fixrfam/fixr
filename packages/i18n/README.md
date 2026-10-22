# @fixr/i18n

Translations for every app in the monorepo. The catalogs live here, i18next is
the engine behind them, and nothing outside this package imports i18next — apps
depend on the small API below, so the engine can be replaced without touching a
single component.

## Locales

- `en` — default and fallback
- `pt-BR`

English is the source of truth: `src/locales/en` defines the shape, and every
other locale is typed against it, so a missing or misspelled key fails
`check-types`.

## Picking a locale

The locale the reader gets is, in order:

1. the one they picked by hand, stored in the `__locale__fixr` cookie;
2. the one their browser asks for through `Accept-Language`;
3. `en`.

`resolveLocale()` implements this and is used by both apps in
`lib/i18n/server.ts`. The language switcher (`components/language-toggle.tsx`)
writes the cookie and refreshes the route so server components come back
translated.

## Using it

Client components:

```tsx
"use client";

import { useTranslation } from "@fixr/i18n/react";

export function SaveButton() {
	const { t, format } = useTranslation();

	return (
		<button type="submit">
			{t("common.actions.save")} — {format.date(new Date())}
		</button>
	);
}
```

Server components, route handlers, emails and queue workers:

```ts
import { createTranslator } from "@fixr/i18n";

const { t, format } = createTranslator("pt-BR");
```

In Next.js, use the app's own helper so the request decides the locale:

```ts
const { t } = await getTranslator(); // apps/<app>/lib/i18n/server.ts
```

### Values are part of the type

`t` demands exactly the values the message interpolates:

```ts
t("validation.name.min", { count: 3 }); // ✅
t("validation.name.min"); // ❌ compile error
t("common.actions.save", { count: 3 }); // ❌ compile error
```

Data that carries a key around (menu entries, route names) should be typed as
`StaticTranslationKey`, which is the subset of keys that interpolate nothing.

### API codes

The API answers with a `code`, never with copy. `useMessage()` (React) and
`messageFor()` (anywhere) turn that code into a title and a description, and
fall back to a generic message when the code is unknown:

```ts
const message = useMessage();
const feedback = message(response.data.code, "success");
```

### Validation messages

Schemas in `@fixr/schemas` run where the reader's language is unknown, so they
emit encoded keys with `i18nMessage("validation.name.min", { count: 3 })`. The
form layer resolves them: `apps/web/components/ui/form.tsx` runs every message
through `translateMessage()`, which leaves anything that is not ours untouched.

## Adding copy

1. Add the key to the right namespace in `src/locales/en`.
2. Add the same key to `src/locales/pt-BR` — TypeScript will ask for it.
3. Use it. `bun run test --filter @fixr/i18n` checks that both catalogs hold the
   same keys and the same interpolation values.

Run `bun run i18n:scan` from the repo root to find copy still written inline in
`apps/web` and `apps/admin`.

## Adding a locale

1. Add it to `locales` and `localeNames` in `src/config.ts`.
2. Create `src/locales/<locale>/` mirroring `en` (the type will list what is
   missing) and register it in `src/locales/index.ts`.
3. Nothing else: detection, the switcher and the formatters read that list.
