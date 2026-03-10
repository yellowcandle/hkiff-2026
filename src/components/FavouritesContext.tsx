"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { loadStorage, saveStorage } from "@/lib/storage";

interface FavouritesContextValue {
  favourites: string[];
  addFavourite: (filmId: string) => void;
  removeFavourite: (filmId: string) => void;
  isFavourite: (filmId: string) => boolean;
  storageError: boolean;
}

const FavouritesContext = createContext<FavouritesContextValue | null>(null);

export function FavouritesProvider({ children }: { children: React.ReactNode }) {
  const [favourites, setFavourites] = useState<string[]>([]);
  const [storageError, setStorageError] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    const data = loadStorage();
    setFavourites(data.favourites);
    initialized.current = true;
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    const data = loadStorage();
    const ok = saveStorage({ ...data, favourites });
    if (!ok) {
      setStorageError(true);
      setTimeout(() => setStorageError(false), 3000);
    }
  }, [favourites]);

  const addFavourite = useCallback((filmId: string) => {
    setFavourites((prev) => (prev.includes(filmId) ? prev : [...prev, filmId]));
  }, []);

  const removeFavourite = useCallback((filmId: string) => {
    setFavourites((prev) => prev.filter((id) => id !== filmId));
  }, []);

  const isFavourite = useCallback(
    (filmId: string) => favourites.includes(filmId),
    [favourites]
  );

  return (
    <FavouritesContext.Provider
      value={{ favourites, addFavourite, removeFavourite, isFavourite, storageError }}
    >
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites(): FavouritesContextValue {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error("useFavourites must be used within FavouritesProvider");
  return ctx;
}
