import { createI18n } from "vue-i18n";

import enUS from "./locales/en-US";
import zhCN from "./locales/zh-CN";

function getSystemLocale(): "zh-CN" | "en-US" {
  const langs =
    typeof navigator !== "undefined" ? (navigator.languages ?? []) : [];
  const raw = (langs[0] ?? navigator.language ?? "en-US").toLowerCase();
  if (raw.startsWith("zh")) return "zh-CN";
  return "en-US";
}

export type AppLocale = "system" | "zh-CN" | "en-US";

export const i18n = createI18n({
  legacy: false,
  locale: getSystemLocale(),
  fallbackLocale: "en-US",
  messages: {
    "en-US": enUS,
    "zh-CN": zhCN,
  },
});

export function setAppLocale(locale: AppLocale): void {
  const next = locale === "system" ? getSystemLocale() : locale;
  i18n.global.locale.value = next;
}

