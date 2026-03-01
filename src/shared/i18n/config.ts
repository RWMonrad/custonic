import { createSharedPathnamesNavigation } from "next-intl/navigation";

export const locales = ["en", "no"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({ locales });

export const localeLabels: Record<Locale, string> = {
  en: "English",
  no: "Norsk",
};
