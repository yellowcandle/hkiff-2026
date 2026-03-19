"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  loadStorage,
  saveStorage,
  favouriteIds,
  TimestampedItem,
} from "@/lib/storage";

interface FavouritesContextValue {
  favourites: string[];
  addFavourite: (filmId: string) => void;
  removeFavourite: (filmId: string) => void;
  isFavourite: (filmId: string) => boolean;
  storageError: boolean;
  applyMergedState: (
    favourites: Record<string, TimestampedItem>,
    removed: Record<string, TimestampedItem>
  ) => void;
  onFavouritesChange: (callback: () => void) => () => void;
}

const FavouritesContext = createContext<FavouritesContextValue | null>(null);

export function FavouritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [favourites, setFavourites] = useState<string[]>([]);
  const [storageError, setStorageError] = useState(false);
  const initialized = useRef(false);
  const skipSyncRef = useRef(false);
  const changeListenersRef = useRef<Set<() => void>>(new Set());

  useEffect(() => {
    const data = loadStorage();
    setFavourites(favouriteIds(data));
    initialized.current = true;
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    const data = loadStorage();

    // Build v3 favourites map from current state
    const favouritesMap: Record<string, TimestampedItem> = {};
    for (const id of favourites) {
      // Preserve existing timestamps if present, otherwise create new
      if (data.favourites[id]) {
        favouritesMap[id] = data.favourites[id];
      } else {
        favouritesMap[id] = { at: Date.now() };
      }
    }

    const ok = saveStorage({ ...data, favourites: favouritesMap });
    if (!ok) {
      setStorageError(true);
      setTimeout(() => setStorageError(false), 3000);
    }

    if (!skipSyncRef.current) {
      changeListenersRef.current.forEach((cb) => cb());
    }
    skipSyncRef.current = false;
  }, [favourites]);

  const addFavourite = useCallback((filmId: string) => {
    setFavourites((prev) => {
      if (prev.includes(filmId)) return prev;
      // Write the timestamped entry immediately
      const data = loadStorage();
      data.favourites[filmId] = { at: Date.now() };
      delete data.removed[filmId];
      saveStorage(data);
      return [...prev, filmId];
    });
  }, []);

  const removeFavourite = useCallback((filmId: string) => {
    // Move to removed in storage
    const data = loadStorage();
    if (data.favourites[filmId]) {
      data.removed[filmId] = { at: Date.now() };
      delete data.favourites[filmId];
      saveStorage(data);
    }
    setFavourites((prev) => prev.filter((id) => id !== filmId));
  }, []);

  const isFavourite = useCallback(
    (filmId: string) => favourites.includes(filmId),
    [favourites]
  );

  const applyMergedState = useCallback(
    (
      mergedFavourites: Record<string, TimestampedItem>,
      mergedRemoved: Record<string, TimestampedItem>
    ) => {
      skipSyncRef.current = true;
      const data = loadStorage();
      data.favourites = mergedFavourites;
      data.removed = mergedRemoved;
      saveStorage(data);
      setFavourites(Object.keys(mergedFavourites));
    },
    []
  );

  const onFavouritesChange = useCallback((callback: () => void) => {
    changeListenersRef.current.add(callback);
    return () => {
      changeListenersRef.current.delete(callback);
    };
  }, []);

  return (
    <FavouritesContext.Provider
      value={{
        favourites,
        addFavourite,
        removeFavourite,
        isFavourite,
        storageError,
        applyMergedState,
        onFavouritesChange,
      }}
    >
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites(): FavouritesContextValue {
  const ctx = useContext(FavouritesContext);
  if (!ctx)
    throw new Error("useFavourites must be used within FavouritesProvider");
  return ctx;
}
