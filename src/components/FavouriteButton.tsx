"use client";

import { useTranslations } from "next-intl";
import { useFavourites } from "@/components/FavouritesContext";

type Props = { filmId: string };

export default function FavouriteButton({ filmId }: Props) {
  const t = useTranslations("favourites");
  const { isFavourite, addFavourite, removeFavourite } = useFavourites();
  const favourited = isFavourite(filmId);

  return (
    <button
      onClick={() => (favourited ? removeFavourite(filmId) : addFavourite(filmId))}
      aria-label={favourited ? t("removeFavourite") : t("addFavourite")}
      className={`text-sm font-medium px-4 py-2.5 transition-colors ${
        favourited
          ? "bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200"
          : "border border-[var(--border)] text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:border-[var(--fg-muted)]"
      }`}
    >
      {favourited ? "\u2605" : "\u2606"} {favourited ? t("removeFavourite") : t("addFavourite")}
    </button>
  );
}
