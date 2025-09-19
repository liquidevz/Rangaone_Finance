# Digio Consent-Based Verification Migration Guide

## Overview
This guide helps you migrate from the old popup-based Digio verification to the new consent-based approach that works better on Safari and provides a Razorpay-like user experience.

## Key Improvements

### ✅ What's Fixed
- **Safari Compatibility**: No more popup blocking issues on Safari
- **Consent-Based Flow**: Users explicitly consent before opening verification window
- **Auto-Close on Success**: Window automatically closes when verification is complete
- **Better Error Handling**: Clear error messages and fallback options
- **Mobile Friendly**: Better handling for mobile devices
- **Status Tracking**: Real-time monitoring of verification status

### 🔄 Migration Steps

#### 1. Replace Old Components

**Before (Old Approach):**
```tsx
import DigioIntegration from '@/components/digio-integration';

<DigioIntegration
  productType="Bundle"
  productId="686a629db4f9ab73bb2dba3d"
  productName="Premium Subscription"
  onComplete={() => proceedToPayment()}
/>
```

**After (New Approach):**
```tsx
import DigioConsentIntegration from '@/components/digio-consent-integration';

<DigioConsentIntegration
  productType="Bundle"
  productId="686a629db4f9ab73bb2dba3d"
  productName="Premium Subscription"
  customerName={user?.name} // Optional but recommended
  onComplete={() => proceedToPayment()}
  onError={(error) => showErrorMessage(error)}
/>
```

#### 2. Update Verification Modal Usage

**Before:**
```tsx
import { DigioVerificationModal } from '@/components/digio-verification-modal';

<DigioVerificationModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onVerificationComplete={() => handleComplete()}
  agreementData={agreementData}
/>
```

**After:**
```tsx
import DigioConsentIntegration from '@/components/digio-consent-integration';

<DigioConsentIntegration
  productType={agreementData.productType || "Bundle"}
  productId={agreementData.productId || ""}
  productName={agreementData.productName || "Subscription"}
  customerName={agreementData.customerName}
  onComplete={() => handleComplete()}
  onError={(error) => handleError(error)}
/>
```

#### 3. Using the Custom Hook (Advanced)

For more control, you can use the `useDigioConsent` hook directly:

```tsx
import { useDigioConsent } from '@/hooks/use-digio-consent';
import DigioConsentWindow from '@/components/digio-consent-window';

function MyComponent() {
  const {
    isOpen,
    authenticationUrl,
    documentId,
    isLoading,
    startVerification,
    handleSigningComplete,
    closeWindow
  } = useDigioConsent({
    onSuccess: () => proceedToPayment(),
    onError: (error) => showError(error)
  });

  const handleStart = async () => {
    await startVerification(
      { productName: "My Product" },
      "Bundle",
      "product-id"
    );
  };

  return (
    <>
      <button onClick={handleStart} disabled={isLoading}>
        {isLoading ? 'Preparing...' : 'Start Verification'}
      </button>

      <DigioConsentWindow
        open={isOpen}
        onClose={closeWindow}
        authenticationUrl={authenticationUrl}
        documentId={documentId}
        onSigningComplete={handleSigningComplete}
        customerName="John Doe"
      />
    </>
  );
}
```

## New Features

### 1. Consent-Based Flow
- Users see a clear explanation before verification starts
- Explicit consent required to open verification window
- Better user experience and trust

### 2. Safari Compatibility
- Enhanced popup handling for Safari
- Fallback options when popups are blocked
- Clear error messages for Safari users

### 3. Auto-Close on Success
- Window automatically closes when verification is complete
- Real-time status monitoring
- No manual intervention required

### 4. Better Error Handling
- Clear error messages
- Retry functionality
- Fallback options (open in new tab)

## Testing Checklist

### ✅ Browser Testing
- [ ] Chrome (popup and consent flow)
- [ ] Safari (popup blocking and fallbacks)
- [ ] Firefox (popup handling)
- [ ] Edge (compatibility)
- [ ] Mobile Safari (redirect handling)
- [ ] Mobile Chrome (redirect handling)

### ✅ Flow Testing
- [ ] Successful verification flow
- [ ] Popup blocked scenario
- [ ] Network error handling
- [ ] User cancellation
- [ ] Window closed manually
- [ ] Multiple verification attempts

### ✅ Integration Testing
- [ ] Profile completion flow
- [ ] Payment integration
- [ ] Error state handling
- [ ] Loading states
- [ ] Mobile responsiveness

## Troubleshooting

### Common Issues

1. **Popup Still Blocked on Safari**
   - Ensure users click the consent button (user gesture required)
   - Use the "Open in New Tab" fallback option
   - Check Safari popup settings

2. **Window Not Closing Automatically**
   - Check document status polling interval
   - Verify API endpoint responses
   - Check network connectivity

3. **Mobile Redirect Issues**
   - Ensure mobile detection is working
   - Test redirect flow on actual devices
   - Check mobile browser compatibility

### Debug Mode

Add this to your component for debugging:

```tsx
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Digio Debug:', {
    isOpen,
    authenticationUrl,
    documentId,
    step
  });
}
```

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify API endpoints are working
3. Test on different browsers and devices
4. Check network connectivity
5. Review Digio service configuration

## Rollback Plan

If you need to rollback to the old implementation:
1. Keep the old components for now
2. Switch imports back to old components
3. Test thoroughly before removing new components