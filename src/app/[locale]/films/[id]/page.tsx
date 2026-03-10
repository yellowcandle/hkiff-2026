import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getFilm, getFilms, getScreeningsForFilm, getSection } from "@/lib/data";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import ScreeningsList from "@/components/ScreeningsList";
import FavouriteButton from "@/components/FavouriteButton";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export function generateStaticParams() {
  const films = getFilms();
  return routing.locales.flatMap((locale) =>
    films.map((film) => ({ locale, id: film.id }))
  );
}

export default async function FilmDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const film = getFilm(id);
  if (!film) notFound();

  const screenings = getScreeningsForFilm(id);
  const section = getSection(film.section);
  const l = locale as "en" | "zh";

  const metaItems = [
    { label: l === "en" ? "Director" : "導演", value: film.director[l] },
    film.country ? { label: l === "en" ? "Country" : "國家／地區", value: film.country } : null,
    film.year ? { label: l === "en" ? "Year" : "年份", value: String(film.year) } : null,
    film.runtime ? { label: l === "en" ? "Runtime" : "片長", value: `${film.runtime} ${l === "en" ? "min" : "分鐘"}` } : null,
    film.language ? { label: l === "en" ? "Language" : "語言", value: film.language } : null,
    film.subtitles?.length ? { label: l === "en" ? "Subtitles" : "字幕", value: film.subtitles.join(", ") } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Link href="/films" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg-primary)] mb-8 inline-block transition-colors">
        ← {l === "en" ? "Back to Films" : "返回電影目錄"}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Poster */}
        <div className="md:col-span-1">
          <div className="aspect-[2/3] bg-neutral-100 relative overflow-hidden">
            {film.posterUrl ? (
              <Image
                src={film.posterUrl}
                alt={film.title[l]}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm">
                {film.title[l]}
              </div>
            )}
          </div>
          {section && (
            <p className="mt-3 text-xs uppercase tracking-wider text-[var(--fg-muted)] font-medium">
              {section.label[l]}
            </p>
          )}
        </div>

        {/* Details */}
        <div className="md:col-span-2">
          <h1 className="font-display text-3xl sm:text-4xl mb-1">{film.title[l]}</h1>
          {l === "zh" && film.title.en !== film.title.zh && (
            <p className="text-[var(--fg-muted)] text-lg mb-4">{film.title.en}</p>
          )}
          {l === "en" && film.title.zh !== film.title.en && (
            <p className="text-[var(--fg-muted)] text-lg mb-4">{film.title.zh}</p>
          )}

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
            {metaItems.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-[var(--fg-muted)]">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap gap-3 mb-8">
            <FavouriteButton filmId={id} />
            {screenings[0]?.ticketUrl && (
              <a
                href={screenings[0].ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-5 py-2.5 transition-colors"
              >
                {l === "en" ? "Buy Tickets on HKIFF ↗" : "購票 HKIFF ↗"}
              </a>
            )}
            {film.imdbId && (
              <a
                href={`https://www.imdb.com/title/${film.imdbId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] border border-[var(--border)] px-4 py-2.5 transition-colors"
              >
                IMDb ↗
              </a>
            )}
            {film.letterboxdSlug && (
              <a
                href={`https://letterboxd.com/film/${film.letterboxdSlug}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] border border-[var(--border)] px-4 py-2.5 transition-colors"
              >
                Letterboxd ↗
              </a>
            )}
          </div>

          {film.synopsis && (
            <>
              <h2 className="font-semibold mb-2">{l === "en" ? "Synopsis" : "劇情簡介"}</h2>
              <p className="text-[var(--fg-secondary)] leading-relaxed mb-8">{film.synopsis[l]}</p>
            </>
          )}

          {screenings.length > 0 && (
            <>
              <h2 className="font-semibold mb-4">{l === "en" ? "Screenings" : "放映場次"}</h2>
              <ScreeningsList screenings={screenings} locale={l} filmId={id} />
            </>
          )}

          {screenings.length === 0 && (
            <p className="text-[var(--fg-muted)] text-sm italic">
              {l === "en" ? "No screenings scheduled yet." : "暫未安排放映場次。"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
