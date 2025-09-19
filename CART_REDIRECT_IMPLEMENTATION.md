# Cart Redirect Implementation

This implementation adds cart redirection functionality for unauthenticated users. When users try to add items to cart without being logged in, they are prompted to authenticate and then redirected to the cart page upon successful login.

## Files Modified/Created

### 1. `lib/cart-redirect-state.ts` (NEW)
- Simple state manager using sessionStorage
- Tracks when users should be redirected to cart after login
- Methods: `setPendingCartRedirect()`, `hasPendingCartRedirect()`, `clearPendingCartRedirect()`

### 2. `components/cart/cart-context.tsx` (MODIFIED)
- Added `showAuthPrompt` state and setter to context
- Modified `addToCart` function to trigger auth prompt for unauthenticated users
- Sets redirect state when unauthenticated users try to add items

### 3. `components/auth/auth-context.tsx` (MODIFIED)
- Added cart redirect logic after successful login
- Checks for pending cart redirect and navigates to `/cart` page

### 4. `components/cart-auth-modal.tsx` (NEW)
- Wrapper component that connects cart context with existing auth prompt modal
- Handles successful authentication callback

### 5. `app/layout.tsx` (MODIFIED)
- Added `CartAuthModal` to root layout for global availability

## How It Works

1. **User tries to add item to cart while unauthenticated**
   - `addToCart` function detects unauthenticated state
   - Sets pending cart redirect flag in sessionStorage
   - Shows authentication modal
   - Still adds item to local cart for persistence

2. **User successfully logs in**
   - Auth context detects successful login
   - Checks for pending cart redirect flag
   - Redirects user to `/cart` page
   - Clears redirect flag

3. **Cart state management**
   - Local cart items are synced to server cart after login
   - Cart count is maintained across authentication states
   - Existing cart functionality remains unchanged

## Usage Example

```tsx
import { useCart } from "@/components/cart/cart-context";

const MyComponent = () => {
  const { addToCart } = useCart();

  const handleAddToCart = async () => {
    // This will automatically handle auth prompt for unauthenticated users
    await addToCart("portfolio-id", 1, {
      name: "Portfolio Name",
      subscriptionFee: [{ type: "monthly", price: 1000 }]
    });
  };

  return <button onClick={handleAddToCart}>Add to Cart</button>;
};
```

## Key Features

- **Minimal code changes**: Leverages existing auth and cart infrastructure
- **Seamless UX**: Users are redirected to cart after successful login
- **State persistence**: Cart items are preserved during authentication flow
- **Global availability**: Auth modal is available throughout the app
- **Backward compatibility**: Existing cart functionality unchanged

## Testing

To test the implementation:
1. Ensure you're logged out
2. Try to add any item to cart
3. Auth modal should appear
4. Login with valid credentials
5. Should be redirected to `/cart` page with items preserved