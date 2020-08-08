import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cart = await AsyncStorage.getItem('@GoMarketPlace:cart');
      if (cart) {
        setProducts(JSON.parse(cart));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(p => p.id === id);
      if (productIndex < 0) {
        return;
      }

      products[productIndex].quantity += 1;

      const newCart = [...products];

      await AsyncStorage.setItem(
        '@GoMarketPlace:cart',
        JSON.stringify(newCart),
      );
      setProducts(newCart);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(p => p.id === id);
      if (productIndex >= 0) {
        products[productIndex].quantity -= 1;
      }

      const newCart =
        products[productIndex].quantity <= 0
          ? [...products.filter(p => p.id !== id)]
          : [...products];

      await AsyncStorage.setItem(
        '@GoMarketPlace:cart',
        JSON.stringify(newCart),
      );
      setProducts(newCart);
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const productIndex = products.findIndex(p => p.id === product.id);
      const newProduct: Product = { ...product };
      if (productIndex < 0) {
        newProduct.quantity = 1;
      } else {
        products[productIndex].quantity += 1;
      }

      const newCart =
        productIndex < 0 ? [...products, newProduct] : [...products];

      await AsyncStorage.setItem(
        '@GoMarketPlace:cart',
        JSON.stringify(newCart),
      );
      setProducts(newCart);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
