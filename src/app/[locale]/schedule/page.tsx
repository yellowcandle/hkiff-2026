import { setRequestLocale } from "next-intl/server";
import { getScreenings, getVenues, getFilms, getAllScreeningDates } from "@/lib/data";
import { routing } from "@/i18n/routing";
import SchedulePageClient from "@/components/SchedulePageClient";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function SchedulePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const screenings = getScreenings();
  const venues = getVenues();
  const films = getFilms();
  const dates = getAllScreeningDates();

  return (
    <SchedulePageClient
      screenings={screenings}
      venues={venues}
      films={films}
      dates={dates}
    />
  );
}
