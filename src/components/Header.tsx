"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LocaleSwitch from "./LocaleSwitch";
import { usePlan } from "@/components/PlanContext";

export default function Header() {
  const t = useTranslations("nav");
  const { plan } = usePlan();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: "/films" as const, label: t("films") },
    { href: "/schedule" as const, label: t("schedule") },
    { href: "/plan" as const, label: t("plan"), badge: plan.length },
  ];

  return (
    <header className="bg-[#0A0A0A] text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-1 group">
          <span className="text-lg font-bold tracking-tight">
            HKIFF
          </span>
          <span className="text-lg font-bold text-[#DC2626] tabular-nums">
            50
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map(({ href, label, badge }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative text-[13px] font-medium tracking-wide uppercase px-4 py-2 transition-colors duration-200 ${
                  isActive
                    ? "text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {label}
                {typeof badge === "number" && badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#DC2626] text-white text-[10px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center">
                    {badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#DC2626]" />
                )}
              </Link>
            );
          })}
          <div className="ml-3 pl-3 border-l border-white/10">
            <LocaleSwitch />
          </div>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="sm:hidden flex flex-col gap-1.5 p-2"
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-white transition-transform duration-200 ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block w-5 h-0.5 bg-white transition-opacity duration-200 ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-white transition-transform duration-200 ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="sm:hidden border-t border-white/10 px-4 pb-4 pt-2 space-y-1">
          {navItems.map(({ href, label, badge }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between text-sm font-medium uppercase tracking-wide px-3 py-2.5 rounded transition-colors ${
                  isActive
                    ? "text-white bg-white/10"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {label}
                {typeof badge === "number" && badge > 0 && (
                  <span className="bg-[#DC2626] text-white text-[10px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-2 px-3">
            <LocaleSwitch />
          </div>
        </nav>
      )}
    </header>
  );
}
