// components/cart/cart-context.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { cartService, Cart } from "@/services/cart.service";
import { localCartService, LocalCart } from "@/services/local-cart.service";
import { useAuth } from "@/components/auth/auth-context";
import { cartRedirectState } from "@/lib/cart-redirect-state";

interface CartContextType {
  cart: Cart | null;
  cartItemCount: number;
  loading: boolean;
  couponCode: string;
  setCouponCode: (code: string) => void;
  refreshCart: () => Promise<void>;
  addToCart: (portfolioId: string, quantity?: number, portfolioData?: any) => Promise<void>;
  updateQuantity: (portfolioId: string, newQuantity: number) => Promise<void>;
  setQuantity: (portfolioId: string, exactQuantity: number) => Promise<void>;
  removeFromCart: (portfolioId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getItemQuantity: (portfolioId: string) => number;
  calculateTotal: (subscriptionType: "monthly" | "quarterly" | "yearly", isEmandate?: boolean) => number;
  getEffectiveCart: () => Cart | null;
  syncing: boolean;
  error: string | null;
  clearError: () => void;
  hasBundle: (bundleId: string) => boolean;
  addBundleToCart: (bundleId: string, subscriptionType: "monthly" | "quarterly" | "yearly", category?: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");

  const { isAuthenticated, user } = useAuth();

  const cartItemCount = React.useMemo(() => {
    if (!isAuthenticated) {
      const localCount = localCartService.getLocalCartItemCount();
      console.log("Local cart item count:", localCount);
      return localCount;
    }
    return cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  }, [isAuthenticated, cart?.items]);

  const clearError = () => {
    setError(null);
  };

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      // Load local cart for unauthenticated users
      const localCart = localCartService.getLocalCart();
      console.log("Local cart loaded:", localCart);
      
      if (localCart.items.length > 0) {
        const displayCart: Cart = {
          _id: "local",
          userId: "local",
          items: localCart.items.map(item => ({
            _id: item.portfolioId,
            portfolio: {
              _id: item.portfolioId,
              name: item.itemData.name,
              subscriptionFee: item.itemData.subscriptionFee || [],
              description: item.itemData.description || []
            } as any,
            quantity: item.quantity
          })),
          createdAt: localCart.lastUpdated,
          updatedAt: localCart.lastUpdated
        };
        console.log("Display cart created:", displayCart);
        setCart(displayCart);
      } else {
        console.log("No local cart items found");
        setCart(null);
      }
      return;
    }
    
    try {
      setLoading(true);
      setSyncing(true);
      setError(null);
      const cartData = await cartService.getCart();
      
      setCart(cartData);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      setError("Failed to load cart. Please try again.");
      // Don't set cart to null on error, keep previous state
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const syncCartOnLogin = async () => {
      if (isAuthenticated && user) {
        // Check if there's a pending portfolio to add
        const pendingPortfolioId = sessionStorage.getItem("pendingPortfolioId");
        if (pendingPortfolioId) {
          try {
            await cartService.addToCart({
              portfolioId: pendingPortfolioId,
              quantity: 1
            });
            sessionStorage.removeItem("pendingPortfolioId");
            console.log("Pending portfolio added to cart:", pendingPortfolioId);
          } catch (error) {
            console.error("Failed to add pending portfolio:", error);
          }
        }
        
        // Check if there's a local cart to sync
        const localCart = localCartService.getLocalCart();
        if (localCart.items.length > 0) {
          console.log("Syncing local cart to server:", localCart);
          try {
            // Add each local cart item to server cart (force quantity to 1)
            for (const item of localCart.items) {
              await cartService.addToCart({
                portfolioId: item.portfolioId,
                quantity: 1 // Force quantity to 1 for portfolios
              });
            }
            // Clear local cart after successful sync
            localCartService.clearLocalCart();
            console.log("Local cart synced and cleared");
          } catch (error) {
            console.error("Failed to sync local cart:", error);
          }
        }
        await refreshCart();
      } else {
        // Load local cart for unauthenticated users
        refreshCart();
      }
    };
    
    syncCartOnLogin();
  }, [isAuthenticated, user]);

  const addToCart = async (portfolioId: string, quantity: number = 1, portfolioData?: any) => {
    try {
      // Check if portfolio already exists in cart
      const currentCart = isAuthenticated ? cart : {
        items: localCartService.getLocalCart().items.map(item => ({
          portfolio: { _id: item.portfolioId },
          quantity: item.quantity
        }))
      };
      
      const existingItem = currentCart?.items?.find(item => item.portfolio._id === portfolioId);
      if (existingItem) {
        throw new Error("This portfolio is already in your cart. Each portfolio can only be purchased once.");
      }
      
      if (!isAuthenticated) {
        // Add to local cart and set redirect state
        localCartService.addPortfolioToLocalCart(
          portfolioId,
          1, // Force quantity to 1
          "monthly",
          {
            name: portfolioData?.name || "Portfolio",
            subscriptionFee: portfolioData?.subscriptionFee || []
          }
        );
        cartRedirectState.setPendingCartRedirect();
        window.location.href = "/cart";
        return;
      }
      
      const updatedCart = await cartService.addToCart({ portfolioId, quantity: 1 }); // Force quantity to 1
      setCart(updatedCart);
      // Redirect to cart page after adding item
      window.location.href = "/cart";
    } catch (error) {
      console.error("Failed to add to cart:", error);
      throw error;
    }
  };

  const updateQuantity = async (portfolioId: string, newQuantity: number) => {
    try {
      // Prevent quantity updates greater than 1 for portfolios
      if (newQuantity > 1) {
        throw new Error("Each portfolio can only be purchased once. Quantity cannot exceed 1.");
      }
      
      // Optimistically update the UI
      if (cart) {
        const optimisticCart = { ...cart };
        const itemIndex = optimisticCart.items.findIndex(item => item.portfolio._id === portfolioId);
        
        if (itemIndex >= 0) {
          if (newQuantity <= 0) {
            // Remove item
            optimisticCart.items.splice(itemIndex, 1);
          } else {
            // Update quantity (but cap at 1)
            optimisticCart.items[itemIndex] = {
              ...optimisticCart.items[itemIndex],
              quantity: 1
            };
          }
          setCart(optimisticCart);
        }
      }

      // Then update on server
      const updatedCart = await cartService.updateQuantity(portfolioId, newQuantity <= 0 ? 0 : 1);
      setCart(updatedCart);
    } catch (error) {
      console.error("Failed to update quantity:", error);
      // Revert optimistic update by refreshing cart
      await refreshCart();
      throw error;
    }
  };

  const setQuantity = async (portfolioId: string, exactQuantity: number) => {
    try {
      // Prevent quantity greater than 1 for portfolios
      if (exactQuantity > 1) {
        throw new Error("Each portfolio can only be purchased once. Quantity cannot exceed 1.");
      }
      
      // Optimistically update the UI
      if (cart) {
        const optimisticCart = { ...cart };
        const itemIndex = optimisticCart.items.findIndex(item => item.portfolio._id === portfolioId);
        
        if (itemIndex >= 0) {
          if (exactQuantity <= 0) {
            // Remove item
            optimisticCart.items.splice(itemIndex, 1);
          } else {
            // Update quantity (but cap at 1)
            optimisticCart.items[itemIndex] = {
              ...optimisticCart.items[itemIndex],
              quantity: 1
            };
          }
        } else if (exactQuantity > 0) {
        }
        setCart(optimisticCart);
      }

      // Then update on server
      const updatedCart = await cartService.setQuantity(portfolioId, exactQuantity <= 0 ? 0 : 1);
      setCart(updatedCart);
    } catch (error) {
      console.error("Failed to set quantity:", error);
      // Revert optimistic update by refreshing cart
      await refreshCart();
      throw error;
    }
  };

  const removeFromCart = async (portfolioId: string) => {
    try {
      if (!isAuthenticated) {
        // Use local cart for unauthenticated users
        const localCart = localCartService.removeFromLocalCart(portfolioId);
        const displayCart: Cart = {
          _id: "local",
          userId: "local",
          items: localCart.items.map(item => ({
            _id: item.portfolioId,
            portfolio: {
              _id: item.portfolioId,
              name: item.itemData.name,
              subscriptionFee: item.itemData.subscriptionFee || [],
              description: item.itemData.description || []
            } as any,
            quantity: item.quantity
          })),
          createdAt: localCart.lastUpdated,
          updatedAt: localCart.lastUpdated
        };
        setCart(displayCart.items.length > 0 ? displayCart : null);
        return;
      }
      
      // Optimistically remove from UI first
      if (cart) {
        const optimisticCart = { ...cart };
        optimisticCart.items = optimisticCart.items.filter(item => item.portfolio._id !== portfolioId);
        setCart(optimisticCart.items.length > 0 ? optimisticCart : null);
      }
      
      // Then update on server
      const updatedCart = await cartService.removeFromCart(portfolioId);
      setCart(updatedCart.items.length > 0 ? updatedCart : null);
    } catch (error) {
      console.error("Failed to remove from cart:", error);
      // Revert optimistic update by refreshing cart
      await refreshCart();
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      if (!isAuthenticated) {
        // Clear local cart for unauthenticated users
        localCartService.clearLocalCart();
        setCart(null);
        return;
      }
      
      // Optimistically clear cart in UI
      setCart(null);
      
      // Then clear on server
      const result = await cartService.clearCart();
      setCart(result.cart.items.length > 0 ? result.cart : null);
    } catch (error) {
      console.error("Failed to clear cart:", error);
      // Revert optimistic update by refreshing cart
      await refreshCart();
      throw error;
    }
  };

  const getItemQuantity = (portfolioId: string): number => {
    const item = cart?.items.find(item => item.portfolio._id === portfolioId);
    return item?.quantity || 0;
  };

  const calculateTotal = (subscriptionType: "monthly" | "quarterly" | "yearly", isEmandate: boolean = false): number => {
    if (!cart) return 0;
    return cartService.calculateCartTotal(cart, subscriptionType, isEmandate);
  };

  const getEffectiveCart = (): Cart | null => {
    return cart;
  };

  const hasBundle = (bundleId: string): boolean => {
    // For now, we'll check if any item in the cart has a portfolio with the bundle ID
    // This is a simplified implementation since bundles are not directly stored in cart
    return cart?.items.some(item => item.portfolio._id === bundleId) || false;
  };

  const addBundleToCart = async (bundleId: string, subscriptionType: "monthly" | "quarterly" | "yearly", category?: string) => {
    try {
      // For now, we'll add the bundle as a portfolio item
      // This is a simplified implementation - in a real app, you'd have separate bundle handling
      const updatedCart = await cartService.addToCart({ portfolioId: bundleId, quantity: 1 });
      setCart(updatedCart);
    } catch (error) {
      console.error("Failed to add bundle to cart:", error);
      throw error;
    }
  };

  const value: CartContextType = {
    cart,
    cartItemCount,
    loading,
    couponCode,
    setCouponCode,
    refreshCart,
    addToCart,
    updateQuantity,
    setQuantity,
    removeFromCart,
    clearCart,
    getItemQuantity,
    calculateTotal,
    getEffectiveCart,
    syncing,
    error,
    clearError,
    hasBundle,
    addBundleToCart,

  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};