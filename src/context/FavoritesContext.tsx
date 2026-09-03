import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  FavoritesContext,
  type FavoriteItem,
} from "./favoritesContextValue";

type Props = {
  children: ReactNode;
};

export const FavoritesProvider = ({ children }: Props) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    try {
      const storedFavorites = localStorage.getItem("favorites");
      return storedFavorites ? JSON.parse(storedFavorites) : [];
    } catch (error) {
      console.error("Error leyendo favoritos desde localStorage:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    } catch (error) {
      console.error("Error guardando favoritos en localStorage:", error);
    }
  }, [favorites]);

  const addToFavorites = (product: FavoriteItem) => {
    setFavorites((currentFavorites) => {
      const exists = currentFavorites.some(
        (item) => item.slug === product.slug
      );

      if (exists) return currentFavorites;

      return [...currentFavorites, product];
    });
  };

  const removeFromFavorites = (slug: string) => {
    setFavorites((currentFavorites) =>
      currentFavorites.filter((item) => item.slug !== slug)
    );
  };

  const toggleFavorite = (product: FavoriteItem) => {
    setFavorites((currentFavorites) => {
      const exists = currentFavorites.some(
        (item) => item.slug === product.slug
      );

      if (exists) {
        return currentFavorites.filter((item) => item.slug !== product.slug);
      }

      return [...currentFavorites, product];
    });
  };

  const isFavorite = (slug: string) => {
    return favorites.some((item) => item.slug === slug);
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  const totalFavorites = useMemo(() => favorites.length, [favorites]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        toggleFavorite,
        isFavorite,
        clearFavorites,
        totalFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};