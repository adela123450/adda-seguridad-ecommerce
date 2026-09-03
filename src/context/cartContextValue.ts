import { createContext } from "react";

export type CartItem = {
  id: string;
  name: string;
  slug: string;
  img: string;
  price: number;
  stock: number;
  quantity: number;
};

export type CartContextType = {
  cart: CartItem[];
  addToCart: (product: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

export const CartContext = createContext<CartContextType | undefined>(undefined);