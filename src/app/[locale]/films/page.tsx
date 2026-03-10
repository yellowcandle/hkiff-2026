import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getFilms, getSections } from "@/lib/data";
import { routing } from "@/i18n/routing";
import FilmCatalogueClient from "@/components/FilmCatalogueClient";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function FilmsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("films");
  const films = getFilms();
  const sections = getSections();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--fg-muted)] font-medium mb-2">
          {locale === "en" ? "Programme" : "節目"}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl">{t("title")}</h1>
      </div>
      <Suspense>
        <FilmCatalogueClient films={films} sections={sections} />
      </Suspense>
    </div>
  );
}
