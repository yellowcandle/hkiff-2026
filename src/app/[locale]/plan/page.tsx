import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getFilms, getScreenings, getVenues } from "@/lib/data";
import PlanPageClient from "@/components/PlanPageClient";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function PlanPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("plan");
  const screenings = getScreenings();
  const films = getFilms();
  const venues = getVenues();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>
      <PlanPageClient
        screenings={screenings}
        films={films}
        venues={venues}
        locale={locale as "en" | "zh"}
      />
    </div>
  );
}
