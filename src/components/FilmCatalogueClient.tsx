"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import type { Film, Section } from "@/lib/types";
import FilmCard from "./FilmCard";
import { useFavourites } from "@/components/FavouritesContext";

type Props = {
  films: Film[];
  sections: Section[];
};

export default function FilmCatalogueClient({ films, sections }: Props) {
  const t = useTranslations("films");
  const tFav = useTranslations("favourites");
  const rawLocale = useLocale();
  const locale: "en" | "zh" = rawLocale === "zh" ? "zh" : "en";
  const searchParams = useSearchParams();
  const initialSection = searchParams.get("section") ?? "";
  const [query, setQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState(initialSection);
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false);
  const { favourites } = useFavourites();

  const filtered = films.filter((film) => {
    const matchesQuery =
      !query ||
      film.title.en.toLowerCase().includes(query.toLowerCase()) ||
      film.title.zh.includes(query);
    const matchesSection =
      !selectedSection || film.section === selectedSection;
    const matchesFavourites =
      !showFavouritesOnly || favourites.includes(film.id);
    return matchesQuery && matchesSection && matchesFavourites;
  });

  return (
    <div>
      {/* Search bar */}
      <div className="mb-5">
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border border-[var(--border)] bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-shadow"
        />
      </div>

      {/* Section filter chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedSection("")}
          className={`chip ${!selectedSection ? "chip-active" : ""}`}
        >
          {t("allSections")}
        </button>
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSection(s.id === selectedSection ? "" : s.id)}
            className={`chip ${selectedSection === s.id ? "chip-active" : ""}`}
          >
            {s.label[locale]}
          </button>
        ))}
        <button
          onClick={() => setShowFavouritesOnly((prev) => !prev)}
          className={`chip ${showFavouritesOnly ? "chip-active" : ""}`}
        >
          {showFavouritesOnly ? "\u2605" : "\u2606"} {tFav("favouritesOnly")}
        </button>
      </div>

      {/* Results count */}
      <p className="text-xs text-[var(--fg-muted)] uppercase tracking-wider font-medium mb-6">
        {t("filmCount", { count: filtered.length })}
      </p>

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="text-[var(--fg-muted)] text-center py-16 text-sm">
          {showFavouritesOnly && favourites.length === 0
            ? tFav("noFavourites")
            : t("noResults")}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((film) => (
            <FilmCard key={film.id} film={film} />
          ))}
        </div>
      )}
    </div>
  );
}
