"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePlan } from "@/components/PlanContext";
import { useFavourites } from "@/components/FavouritesContext";
import { getScreenings } from "@/lib/data";
import type { Film } from "@/lib/types";

const allScreenings = getScreenings();

type Props = { film: Film };

export default function FilmCard({ film }: Props) {
  const locale = useLocale() as "en" | "zh";
  const t = useTranslations("plan");
  const tFav = useTranslations("favourites");
  const { plan } = usePlan();
  const { isFavourite, addFavourite, removeFavourite } = useFavourites();
  const filmScreeningIds = allScreenings
    .filter((s) => s.filmId === film.id)
    .map((s) => s.id);
  const inPlan = filmScreeningIds.some((id) => plan.includes(id));
  const favourited = isFavourite(film.id);

  function handleFavouriteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (favourited) {
      removeFavourite(film.id);
    } else {
      addFavourite(film.id);
    }
  }

  return (
    <Link
      href={`/films/${film.id}`}
      className="film-card group block bg-white border border-[var(--border-subtle)] overflow-hidden"
    >
      <div className="film-poster aspect-[2/3] bg-neutral-100 relative">
        {inPlan && (
          <span className="absolute top-3 right-3 z-20 bg-emerald-600 text-white text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1">
            {t("inPlan")}
          </span>
        )}
        <button
          onClick={handleFavouriteClick}
          aria-label={favourited ? tFav("removeFavourite") : tFav("addFavourite")}
          className={`absolute top-3 left-3 z-20 w-8 h-8 flex items-center justify-center rounded-full transition-colors drop-shadow-md ${
            favourited
              ? "bg-amber-400 text-white"
              : "bg-black/40 text-white/70 hover:bg-black/60 hover:text-white"
          }`}
        >
          {favourited ? "\u2605" : "\u2606"}
        </button>
        {film.posterUrl ? (
          <Image
            src={film.posterUrl}
            alt={film.title[locale]}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 px-4 text-center">
            <span className="text-neutral-300 text-4xl mb-3">🎬</span>
            <span className="text-neutral-400 text-xs font-medium leading-tight line-clamp-3">
              {film.title[locale]}
            </span>
          </div>
        )}
        {/* Cinematic hover overlay */}
        <div className="film-overlay absolute inset-0 z-10 flex flex-col justify-end p-4">
          <p className="text-white/70 text-xs font-medium">
            {film.director}
          </p>
          {(film.country || film.year) && (
            <p className="text-white/50 text-[11px]">
              {[film.country, film.year].filter(Boolean).join(" \u00b7 ")}
            </p>
          )}
        </div>
      </div>
      <div className="p-3.5">
        <h3 className="font-semibold text-[13px] leading-snug mb-0.5 line-clamp-2 group-hover:text-[var(--accent)] transition-colors duration-300">
          {film.title[locale]}
        </h3>
        <p className="text-[var(--fg-muted)] text-[11px]">
          {film.director}
        </p>
      </div>
    </Link>
  );
}
