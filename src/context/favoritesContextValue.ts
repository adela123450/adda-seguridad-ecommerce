import { createContext } from "react";

export type FavoriteItem = {
  slug: string;
  name: string;
  brand: string;
  img: string;
  formattedPrice: string;
};

export type FavoritesContextType = {
  favorites: FavoriteItem[];
  addToFavorites: (product: FavoriteItem) => void;
  removeFromFavorites: (slug: string) => void;
  toggleFavorite: (product: FavoriteItem) => void;
  isFavorite: (slug: string) => boolean;
  clearFavorites: () => void;
  totalFavorites: number;
};

export const FavoritesContext = createContext<
  FavoritesContextType | undefined
>(undefined);