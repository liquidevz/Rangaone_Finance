// No imports needed from cart.service for this local implementation

export interface LocalCartItem {
  portfolioId: string;
  bundleId?: string;
  quantity: number;
  subscriptionType: "monthly" | "quarterly" | "yearly";
  itemType: "portfolio" | "bundle";
  addedAt: string;
  planCategory?: "basic" | "premium" | "individual";
  // Store minimal item data for offline display
  itemData: {
    name: string;
    category?: string;
    monthlyPrice?: number;
    quarterlyPrice?: number;
    yearlyPrice?: number;
    description?: Array<{
      key: string;
      value: string;
    }>;
    subscriptionFee?: Array<{
      type: "monthly" | "quarterly" | "yearly";
      price: number;
    }>;
  };
}

export interface LocalCart {
  items: LocalCartItem[];
  lastUpdated: string;
}

const CART_STORAGE_KEY = "RangaOne_local_cart";
const CART_BACKUP_KEY = "RangaOne_local_cart_backup";

export class LocalCartService {
  private static instance: LocalCartService;
  private fallbackCart: LocalCart = { items: [], lastUpdated: new Date().toISOString() };
  private storageAvailable: boolean = true;
  
  public static getInstance(): LocalCartService {
    if (!LocalCartService.instance) {
      LocalCartService.instance = new LocalCartService();
    }
    return LocalCartService.instance;
  }

  private constructor() {
    // Test storage availability on initialization
    this.testStorageAvailability();
  }

  // Test if localStorage is available and working
  private testStorageAvailability(): void {
    try {
      if (!this.isBrowser()) {
        this.storageAvailable = false;
        return;
      }

      const testKey = "__test_storage__";
      const testValue = "test";
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      this.storageAvailable = retrieved === testValue;
      
      if (!this.storageAvailable) {
        console.warn("localStorage is not available, cart will use memory storage");
      }
    } catch (error) {
      console.error("localStorage test failed:", error);
      this.storageAvailable = false;
    }
  }

  // Check if we're in a browser environment
  private isBrowser(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  }

  // Get data from storage with fallback
  private getFromStorage(key: string): string | null {
    if (!this.storageAvailable || !this.isBrowser()) {
      return null;
    }

    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to get ${key} from localStorage:`, error);
      return null;
    }
  }

  // Set data to storage with fallback
  private setToStorage(key: string, value: string): boolean {
    if (!this.storageAvailable || !this.isBrowser()) {
      return false;
    }

    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Failed to set ${key} to localStorage:`, error);
      
      // Try to clear some space and retry
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn("localStorage quota exceeded, attempting to clear backup data");
        try {
          localStorage.removeItem(CART_BACKUP_KEY);
          localStorage.setItem(key, value);
          return true;
        } catch (retryError) {
          console.error("Failed to save even after clearing backup:", retryError);
        }
      }
      
      return false;
    }
  }

  // Remove data from storage
  private removeFromStorage(key: string): boolean {
    if (!this.storageAvailable || !this.isBrowser()) {
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove ${key} from localStorage:`, error);
      return false;
    }
  }

  // Get local cart from localStorage with enhanced error handling
  getLocalCart(): LocalCart {
    if (!this.isBrowser()) {
      return { items: [], lastUpdated: new Date().toISOString() };
    }

    try {
      const cartData = this.getFromStorage(CART_STORAGE_KEY);
      
      if (!cartData) {
        return { items: [], lastUpdated: new Date().toISOString() };
      }

      const parsedCart = JSON.parse(cartData);
      
      // Validate cart structure
      if (!parsedCart || typeof parsedCart !== 'object' || !Array.isArray(parsedCart.items)) {
        console.warn("Invalid cart data structure, returning empty cart");
        this.clearLocalCart();
        return { items: [], lastUpdated: new Date().toISOString() };
      }

      // Validate each item
      const validItems = parsedCart.items.filter((item: any) => {
        return item && 
               typeof item === 'object' && 
               item.portfolioId && 
               item.itemType && 
               item.quantity && 
               item.addedAt &&
               item.itemData;
      });

      if (validItems.length !== parsedCart.items.length) {
        console.warn(`Filtered out ${parsedCart.items.length - validItems.length} invalid cart items`);
      }

      const validCart = {
        items: validItems,
        lastUpdated: parsedCart.lastUpdated || new Date().toISOString()
      };

      return validCart;
    } catch (error) {
      console.error("Failed to parse local cart data:", error);
      
      // Try to load from backup
      try {
        const backupData = this.getFromStorage(CART_BACKUP_KEY);
        if (backupData) {
          const backupCart = JSON.parse(backupData);
          return backupCart;
        }
      } catch (backupError) {
        console.error("Failed to load backup cart:", backupError);
      }
      
      // Clear corrupted data
      this.clearLocalCart();
      return { items: [], lastUpdated: new Date().toISOString() };
    }
  }

  // Save local cart to localStorage with enhanced error handling
  private saveLocalCart(cart: LocalCart): void {
    if (!this.isBrowser()) {
      // Store in memory fallback
      this.fallbackCart = { ...cart };
      return;
    }

    try {
      cart.lastUpdated = new Date().toISOString();
      const cartJson = JSON.stringify(cart);
      
      // Save main cart
      const saved = this.setToStorage(CART_STORAGE_KEY, cartJson);
      
      if (saved) {
        
        // Create backup (with size limit)
        if (cartJson.length < 50000) { // ~50KB limit for backup
          this.setToStorage(CART_BACKUP_KEY, cartJson);
        }
      } else {
        console.warn("Failed to save cart to localStorage, using memory storage");
        this.fallbackCart = { ...cart };
      }
    } catch (error) {
      console.error("Failed to save local cart:", error);
      this.fallbackCart = { ...cart };
    }
  }

  // Add portfolio to local cart with enhanced error handling
  addPortfolioToLocalCart(
    portfolioId: string, 
    quantity: number = 1,
    subscriptionType: "monthly" | "quarterly" | "yearly" = "monthly",
    itemData: LocalCartItem["itemData"],
    planCategory?: "basic" | "premium" | "individual"
  ): LocalCart {
    const currentCart = this.getLocalCart();
    const existingItemIndex = currentCart.items.findIndex(
      (item) => item.portfolioId === portfolioId && item.itemType === "portfolio"
    );

    if (existingItemIndex > -1) {
      // Portfolio already exists - throw error instead of updating quantity
      throw new Error("This portfolio is already in your cart. Each portfolio can only be purchased once.");
    } else {
      // Add new item with quantity forced to 1
      currentCart.items.push({
        portfolioId,
        quantity: 1, // Force quantity to 1
        addedAt: new Date().toISOString(),
        itemType: "portfolio",
        subscriptionType,
        itemData,
        ...(planCategory && { planCategory }),
      });
    }
    this.saveLocalCart(currentCart);
    return currentCart;
  }

  // Add bundle to local cart with enhanced error handling
  addBundleToLocalCart(
    bundleId: string,
    subscriptionType: "monthly" | "quarterly" | "yearly" = "monthly",
    itemData: LocalCartItem["itemData"],
    planCategory?: "basic" | "premium" | "individual"
  ): LocalCart {
    const currentCart = this.getLocalCart();
    const existingItemIndex = currentCart.items.findIndex(
      (item) => item.bundleId === bundleId && item.itemType === "bundle"
    );

    if (existingItemIndex > -1) {
      // Update quantity (bundles are typically quantity 1, but for consistency)
      currentCart.items[existingItemIndex].quantity += 1;
      // Ensure latest itemData is used
      currentCart.items[existingItemIndex].itemData = itemData;
      currentCart.items[existingItemIndex].subscriptionType = subscriptionType;
      if (planCategory) {
        currentCart.items[existingItemIndex].planCategory = planCategory;
      }
    } else {
      // Add new bundle
      currentCart.items.push({
        portfolioId: bundleId, // Use bundleId as portfolioId for consistent access
        bundleId,
        quantity: 1,
        addedAt: new Date().toISOString(),
        itemType: "bundle",
        subscriptionType,
        itemData,
        ...(planCategory && { planCategory }),
      });
    }
    this.saveLocalCart(currentCart);
    return currentCart;
  }

  // Remove item from local cart with enhanced error handling
  removeFromLocalCart(itemId: string): LocalCart {
    const currentCart = this.getLocalCart();
    currentCart.items = currentCart.items.filter(
      (item) => item.portfolioId !== itemId && item.bundleId !== itemId
    );
    this.saveLocalCart(currentCart);
    return currentCart;
  }

  // Update item quantity in local cart with enhanced error handling
  updateLocalCartQuantity(itemId: string, newQuantity: number): LocalCart {
    const currentCart = this.getLocalCart();
    const itemIndex = currentCart.items.findIndex(
      (item) => item.portfolioId === itemId || item.bundleId === itemId
    );

    if (itemIndex > -1) {
      if (newQuantity <= 0) {
        currentCart.items.splice(itemIndex, 1);
      } else {
        currentCart.items[itemIndex].quantity = newQuantity;
      }
    }
    this.saveLocalCart(currentCart);
    return currentCart;
  }

  // Clear local cart with enhanced error handling
  clearLocalCart(): void {
    // Don't clear during sync - only clear manually
    if (new Error().stack?.includes('syncCartOnLogin')) {
      return;
    }
    this.removeFromStorage(CART_STORAGE_KEY);
    this.removeFromStorage(CART_BACKUP_KEY);
    this.fallbackCart = { items: [], lastUpdated: new Date().toISOString() };
  }

  // Get local cart item count with error handling
  getLocalCartItemCount(): number {
    try {
      const cart = this.getLocalCart();
      return cart?.items?.reduce((count, item) => count + item.quantity, 0) || 0;
    } catch (error) {
      console.error("Error getting local cart item count:", error);
      return 0;
    }
  }

  // Check if item is in local cart with error handling
  isInLocalCart(itemId: string): boolean {
    return this.getLocalCart().items.some(
      (item) => item.portfolioId === itemId || item.bundleId === itemId
    );
  }

  // Get item quantity from local cart with error handling
  getLocalItemQuantity(itemId: string): number {
    const item = this.getLocalCart().items.find(
      (i) => i.portfolioId === itemId || i.bundleId === itemId
    );
    return item ? item.quantity : 0;
  }

  // Calculate local cart total for a subscription type with error handling
  calculateLocalCartTotal(subscriptionType: "monthly" | "quarterly" | "yearly"): number {
    const cart = this.getLocalCart();
    return cart.items.reduce((total, item) => {
      const priceInfo = item.itemData.subscriptionFee?.find(
        (fee: any) => fee.type === subscriptionType
      );
      return total + (priceInfo?.price || 0) * item.quantity;
    }, 0);
  }

  // Convert local cart to server cart format for syncing
  convertToServerCartFormat(): Array<{
    portfolioId: string;
    quantity: number;
    itemType?: string;
    subscriptionType?: string;
    planCategory?: string; // Add planCategory here
  }> {
    const localCart = this.getLocalCart();
    return localCart.items.map((item) => ({
      portfolioId: item.itemType === "bundle" ? item.bundleId! : item.portfolioId,
      quantity: item.quantity,
      itemType: item.itemType,
      subscriptionType: item.subscriptionType,
      ...(item.planCategory && { planCategory: item.planCategory }), // Include planCategory if it exists
    }));
  }

  // Check if local cart has any items with error handling
  hasItems(): boolean {
    return this.getLocalCart().items.length > 0;
  }

  // Get local cart summary for display with error handling
  getCartSummary(): {
    itemCount: number;
    totalValue: number;
    items: Array<{
      id: string;
      name: string;
      type: "portfolio" | "bundle";
      quantity: number;
    }>;
  } {
    const cart = this.getLocalCart();
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = this.calculateLocalCartTotal("monthly"); // Or a more appropriate default/selected type

    const items = cart.items.map((item) => ({
      id: item.itemType === "bundle" ? item.bundleId! : item.portfolioId,
      name: item.itemData.name,
      type: item.itemType,
      quantity: item.quantity,
    }));

    return {
      itemCount,
      totalValue,
      items,
    };
  }

  // Get storage status information
  getStorageStatus(): {
    available: boolean;
    size: number;
    backupAvailable: boolean;
  } {
    if (!this.isBrowser()) {
      return {
        available: false,
        size: 0,
        backupAvailable: false,
      };
    }

    try {
      const cartData = this.getFromStorage(CART_STORAGE_KEY);
      const backupData = this.getFromStorage(CART_BACKUP_KEY);
      return {
        available: this.storageAvailable,
        size: cartData ? new TextEncoder().encode(cartData).length : 0,
        backupAvailable: !!backupData,
      };
    } catch (error) {
      console.error("Error getting storage status:", error);
      return {
        available: false,
        size: 0,
        backupAvailable: false,
      };
    }
  }
}

// Export singleton instance
export const localCartService = LocalCartService.getInstance(); 