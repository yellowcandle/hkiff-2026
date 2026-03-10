"use client";

import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-[#0A0A0A] text-neutral-400 text-sm border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-xs text-neutral-500">{t("copyright")}</p>
            <p className="text-[11px] text-neutral-600">{t("disclaimer")}</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://www.hkiff.org.hk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs hover:text-white transition-colors"
            >
              hkiff.org.hk ↗
            </a>
            <span className="text-neutral-700">·</span>
            <a
              href="https://www.threads.net/@yellowcandle"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs hover:text-white transition-colors"
            >
              Threads ↗
            </a>
            <span className="text-neutral-700">·</span>
            <a
              href="https://github.com/yellowcandle/hkiff-2026"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs hover:text-white transition-colors"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
