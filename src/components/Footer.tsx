"use client";

import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-[#0A0A0A] text-neutral-500 text-sm border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs">{t("copyright")}</p>
        <a
          href="https://www.hkiff.org.hk"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs hover:text-white transition-colors"
        >
          {t("website")} ↗
        </a>
      </div>
    </footer>
  );
}
