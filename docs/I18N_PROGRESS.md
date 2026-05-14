# I18N progress (oclive-pack-editor)

## Locale wiring

- **Entry**: `src/main.ts` uses `import { i18n } from "./i18n"` + `app.use(i18n)`.
- **Aligned with oclivenewnew**: `src/i18n/index.ts` uses the same `LOCALE_PREF_KEY` (`oclive.appLocale`), `getLocalePreference` / `setLocalePreference`, `resolveLocaleTag`, and `fallbackLocale: "zh-CN"` so pack editor and host remember one preference when both run on the same machine profile.

## Phase 0 — CJK inventory

Command: `rg -l "\\p{Han}" --glob "*.vue" --glob "*.ts" src`

Typical matches include `App.vue`, `components/pack/*.vue`, `components/AdvFaqList.vue`, `lib/*.ts` (hints/FAQ copy), and both locale files. Prefer moving **user-visible** copy into `src/i18n/locales/*.ts` under an `editor.*` tree.

## Build

- `npm run build` after string migration batches.
