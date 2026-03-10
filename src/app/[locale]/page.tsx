import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getFilms, getSections } from "@/lib/data";
import { routing } from "@/i18n/routing";
import FilmCard from "@/components/FilmCard";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const tFilms = await getTranslations("films");
  const films = getFilms();
  const sections = getSections();
  const featured = films.filter((f) => f.section === "gala-presentation").slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="hero-gradient grain-overlay relative overflow-hidden">
        <div className="relative z-10 max-w-5xl mx-auto text-center px-4 py-28 sm:py-36">
          <p className="animate-fade-up text-[13px] uppercase tracking-[0.3em] text-neutral-400 font-medium mb-6">
            {t("subtitle")}
          </p>
          <h1 className="animate-fade-up delay-1 font-display text-5xl sm:text-7xl lg:text-8xl text-white leading-[0.95] tracking-tight mb-4 text-balance">
            {locale === "en" ? (
              <>
                Hong Kong<br />
                International<br />
                Film Festival
              </>
            ) : (
              <>香港國際電影節</>
            )}
          </h1>
          <p className="animate-fade-up delay-2 text-2xl sm:text-3xl text-neutral-300 font-medium tracking-wide mb-4">
            {t("subtitle-2")}
          </p>
          <p className="animate-fade-up delay-2 text-lg text-[#DC2626] font-medium tracking-wide mb-10">
            {t("dates")}
          </p>
          <div className="animate-fade-up delay-3 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/films"
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold text-sm px-8 py-3.5 transition-all duration-300"
            >
              {t("browseFilms")}
            </Link>
            <Link
              href="/schedule"
              className="border border-white/30 hover:border-white/70 text-white font-medium text-sm px-8 py-3.5 transition-all duration-300"
            >
              {t("viewSchedule")}
            </Link>
          </div>
        </div>
      </section>

      {/* Programme Update Notice */}
      <section className="bg-amber-50/80 border-b border-amber-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-amber-800 font-semibold text-xs uppercase tracking-wider shrink-0">
            {locale === "en" ? "⚠ Programme Updates" : "⚠ 節目更新"}
          </span>
          <span className="text-amber-700/90 text-sm flex-1">
            {locale === "en"
              ? "Check the HKIFF website for the latest schedule changes, Category III classifications, sold-out screenings, and duration updates."
              : "請瀏覽香港國際電影節網站，查看最新節目更改、三級分類、滿座場次及片長更新。"}
          </span>
          <div className="flex flex-wrap gap-1.5 shrink-0">
            {[
              { id: 786, label: locale === "en" ? "Programme Changes" : "節目更改" },
              { id: 787, label: locale === "en" ? "Category III" : "三級電影" },
              { id: 788, label: locale === "en" ? "Meet the Audience" : "映後座談" },
              { id: 789, label: locale === "en" ? "Full House" : "滿座場次" },
              { id: 790, label: locale === "en" ? "Duration Changes" : "片長更改" },
            ].map(({ id, label }) => (
              <a
                key={id}
                href={`https://www.hkiff.org.hk/programme/index/category_id/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium text-amber-800 bg-amber-100/80 hover:bg-amber-200 border border-amber-300/60 px-2 py-0.5 transition-colors"
              >
                {label} ↗
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Films */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--fg-muted)] font-medium mb-2">
              {locale === "en" ? "Highlights" : "精選"}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl">{t("featuredFilms")}</h2>
          </div>
          <Link
            href="/films"
            className="text-sm font-medium text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition-colors hidden sm:block"
          >
            {locale === "en" ? "View all films →" : "瀏覽所有電影 →"}
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-5 sm:gap-6">
          {featured.map((film, i) => (
            <div key={film.id} className={`animate-fade-up delay-${i + 1}`}>
              <FilmCard film={film} />
            </div>
          ))}
        </div>
      </section>

      {/* Browse by Section */}
      <section className="bg-[#0A0A0A] grain-overlay">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-medium mb-2">
                {locale === "en" ? "Explore" : "探索"}
              </p>
              <h2 className="font-display text-3xl sm:text-4xl text-white">
                {locale === "en" ? "Browse by Section" : "按類別瀏覽"}
              </h2>
            </div>
            <Link
              href="/films"
              className="text-sm font-medium text-[#DC2626] hover:text-red-400 transition-colors hidden sm:block"
            >
              {locale === "en" ? "View all sections →" : "所有類別 →"}
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {sections.slice(0, 5).map((section, i) => {
              const loc = locale as "en" | "zh";
              const sectionFilmCount = films.filter((f) => f.section === section.id).length;
              const isAccent = i === 2;
              return (
                <Link
                  key={section.id}
                  href={`/films?section=${section.id}`}
                  className={`group p-6 flex flex-col justify-between h-40 transition-all duration-300 hover:translate-y-[-2px] ${
                    isAccent
                      ? "bg-[#DC2626] hover:bg-[#B91C1C]"
                      : "bg-[#1A1A1A] hover:bg-[#222222] border border-white/5"
                  }`}
                >
                  <h3 className={`text-[15px] font-semibold leading-tight ${
                    isAccent ? "text-white" : "text-white"
                  }`}>
                    {section.label[loc]}
                  </h3>
                  <p className={`text-xs ${
                    isAccent ? "text-red-200" : "text-neutral-500"
                  }`}>
                    {tFilms("filmCount", { count: sectionFilmCount })}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
