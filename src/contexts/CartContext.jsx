import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const response = await cartService.get();
      setItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = async (productId, quantity = 1, type = 'direct', auctionId = null) => {
    try {
      const response = await cartService.add({
        product_id: productId,
        quantity,
        type,
        auction_id: auctionId,
      });
      await fetchCart();
      return response.data.item;
    } catch (error) {
      throw error;
    }
  };

  const updateItem = async (itemId, quantity) => {
    try {
      await cartService.update(itemId, { quantity });
      await fetchCart();
    } catch (error) {
      throw error;
    }
  };

  const removeItem = async (itemId) => {
    try {
      await cartService.remove(itemId);
      await fetchCart();
    } catch (error) {
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clear();
      setItems([]);
    } catch (error) {
      throw error;
    }
  };

  const checkout = async (shippingAddressId) => {
    try {
      const response = await cartService.checkout({ shipping_address_id: shippingAddressId });
      setItems([]);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      loading,
      totalItems,
      totalAmount,
      addItem,
      updateItem,
      removeItem,
      clearCart,
      checkout,
      refreshCart: fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
