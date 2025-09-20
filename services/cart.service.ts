// services/cart.service.ts
import { get, post, del } from "@/lib/axios";
import { authService } from "./auth.service";

export interface CartItem {
  _id: string;
  portfolio: {
    _id: string;
    name: string;
    description: Array<{
      key: string;
      value: string;
    }>;
    subscriptionFee: Array<{
      type: "monthly" | "quarterly" | "yearly";
      price: number;
    }>;
    minInvestment: number;
    durationMonths: number;
  };
  quantity: number;
  addedAt: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartPayload {
  portfolioId: string;
  quantity?: number;
}

export interface UpdateQuantityPayload {
  portfolioId: string;
  quantity: number;
}

export const cartService = {
  // Get user's cart
  getCart: async (): Promise<Cart> => {
    const token = authService.getAccessToken();
    return await get<Cart>("/api/user/cart", {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Add item to cart (or update quantity if it exists)
  addToCart: async (payload: AddToCartPayload): Promise<Cart> => {
    const token = authService.getAccessToken();
    return await post<Cart>("/api/user/cart", payload, {
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Update quantity of existing item in cart
  updateQuantity: async (portfolioId: string, newQuantity: number): Promise<Cart> => {
    const token = authService.getAccessToken();
    
    if (newQuantity <= 0) {
      // If quantity is 0 or less, remove the item
      return await cartService.removeFromCart(portfolioId);
    }

    try {
      // First, get the current cart to determine current quantity
      const currentCart = await cartService.getCart();
      const existingItem = currentCart.items.find(item => item.portfolio._id === portfolioId);
      
      if (!existingItem) {
        // Item doesn't exist, add it with the specified quantity
        return await cartService.addToCart({ portfolioId, quantity: newQuantity });
      }

      const currentQuantity = existingItem.quantity;
      
      if (newQuantity === currentQuantity) {
        // No change needed
        return currentCart;
      }

      if (newQuantity > currentQuantity) {
        // Increase quantity: add the difference
        const quantityToAdd = newQuantity - currentQuantity;
        return await cartService.addToCart({ portfolioId, quantity: quantityToAdd });
      } else {
        // Decrease quantity: remove and re-add with correct quantity
        // This is a workaround since the API doesn't have a direct update endpoint
        await cartService.removeFromCart(portfolioId);
        return await cartService.addToCart({ portfolioId, quantity: newQuantity });
      }
    } catch (error) {
      console.error("Failed to update quantity:", error);
      throw error;
    }
  },

  // Set exact quantity for an item (more efficient for direct quantity changes)
  setQuantity: async (portfolioId: string, exactQuantity: number): Promise<Cart> => {
    const token = authService.getAccessToken();
    
    if (exactQuantity <= 0) {
      return await cartService.removeFromCart(portfolioId);
    }

    try {
      // Remove the item completely first
      await cartService.removeFromCart(portfolioId);
      // Then add it back with the exact quantity
      return await cartService.addToCart({ portfolioId, quantity: exactQuantity });
    } catch (error) {
      // If removal fails (item might not exist), just try to add
      return await cartService.addToCart({ portfolioId, quantity: exactQuantity });
    }
  },

  // Remove item from cart
  removeFromCart: async (portfolioId: string): Promise<Cart> => {
    const token = authService.getAccessToken();
    try {
      return await del<Cart>(`/api/user/cart/${portfolioId}`, {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Item already removed or doesn't exist, return current cart
        return await cartService.getCart();
      }
      throw error;
    }
  },

  // Clear cart
  clearCart: async (): Promise<{ message: string; cart: Cart }> => {
    const token = authService.getAccessToken();
    try {
      return await del<{ message: string; cart: Cart }>("/api/user/cart", {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Cart already empty, return empty cart structure
        const emptyCart = await cartService.getCart();
        return { message: "Cart cleared", cart: emptyCart };
      }
      throw error;
    }
  },

  // Get cart item count
  getCartItemCount: async (): Promise<number> => {
    try {
      const cart = await cartService.getCart();
      return cart.items.reduce((total, item) => total + item.quantity, 0);
    } catch (error) {
      console.error("Failed to get cart count:", error);
      return 0;
    }
  },

  // Helper function to get item quantity by portfolio ID
  getItemQuantity: async (portfolioId: string): Promise<number> => {
    try {
      const cart = await cartService.getCart();
      const item = cart.items.find(item => item.portfolio._id === portfolioId);
      return item?.quantity || 0;
    } catch (error) {
      console.error("Failed to get item quantity:", error);
      return 0;
    }
  },

  // Calculate cart total for a specific subscription type
  calculateCartTotal: (cart: Cart, subscriptionType: "monthly" | "quarterly" | "yearly"): number => {
    return cart.items.reduce((total, item) => {
      const fee = item.portfolio.subscriptionFee.find(f => f.type === subscriptionType);
      const price = fee?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  },

  // Validate cart items (check if portfolios still exist and are valid)
  validateCart: async (): Promise<{ isValid: boolean; invalidItems: string[] }> => {
    try {
      const cart = await cartService.getCart();
      const invalidItems: string[] = [];

      // This would need to be implemented with a portfolio validation endpoint
      // For now, we'll assume all items are valid
      
      return {
        isValid: invalidItems.length === 0,
        invalidItems,
      };
    } catch (error) {
      console.error("Failed to validate cart:", error);
      return { isValid: false, invalidItems: [] };
    }
  },
};