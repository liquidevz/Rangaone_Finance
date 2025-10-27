/**
 * Utility functions for displaying stock actions in a user-friendly format
 */

/**
 * Transforms API action strings to user-friendly display text
 * @param action - The action string from the API
 * @returns User-friendly display text
 */
export function formatActionForDisplay(action: string): string {
  if (!action) return 'Fresh Buy';
  
  const normalizedAction = action.toUpperCase().trim();
  
  // Transform ADDON-BUY to Buy More
  if (normalizedAction === 'ADDON-BUY') {
    return 'Buy More';
  }
  
  // Handle other common transformations
  switch (normalizedAction) {
    case 'FRESH-BUY':
    case 'FRESH_BUY':
      return 'Fresh Buy';
    case 'BUY':
      return 'Buy';
    case 'HOLD':
    case 'MAINTAIN':
      return 'Hold';
    case 'SELL':
    case 'EXIT':
      return 'Sell';
    case 'PARTIAL-SELL':
    case 'PARTIAL_SELL':
    case 'REDUCE':
      return 'Partial Sell';
    case 'WATCH':
    case 'MONITOR':
      return 'Watch';
    case 'ADD':
    case 'ACCUMULATE':
      return 'Add';
    case 'STOP-LOSS':
    case 'STOP_LOSS':
    case 'SL':
      return 'Stop Loss';
    case 'TARGET':
    case 'PROFIT-BOOKING':
    case 'PROFIT_BOOKING':
      return 'Target';
    default:
      // For any other action, return as-is but capitalize properly
      return action.split(/[-_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
  }
}

/**
 * Gets the appropriate color scheme for an action
 * @param action - The action string (can be original or formatted)
 * @returns CSS class string for styling
 */
export function getActionColorScheme(action: string): string {
  const normalizedAction = action.toUpperCase().trim();
  
  // Handle ADDON-BUY specifically with darker green
  if (normalizedAction === 'ADDON-BUY' || normalizedAction === 'BUY MORE') {
    return 'bg-green-600 text-white';
  }
  
  switch (normalizedAction) {
    case 'FRESH-BUY':
    case 'FRESH_BUY':
    case 'FRESH BUY':
    case 'BUY':
      return 'bg-green-500 text-white';
    case 'HOLD':
    case 'MAINTAIN':
      return 'bg-blue-500 text-white';
    case 'SELL':
    case 'EXIT':
      return 'bg-red-500 text-white';
    case 'PARTIAL-SELL':
    case 'PARTIAL_SELL':
    case 'PARTIAL SELL':
    case 'REDUCE':
      return 'bg-orange-500 text-white';
    case 'WATCH':
    case 'MONITOR':
      return 'bg-yellow-500 text-white';
    case 'ADD':
    case 'ACCUMULATE':
      return 'bg-emerald-500 text-white';
    case 'STOP-LOSS':
    case 'STOP_LOSS':
    case 'STOP LOSS':
    case 'SL':
      return 'bg-rose-500 text-white';
    case 'TARGET':
    case 'PROFIT-BOOKING':
    case 'PROFIT_BOOKING':
    case 'PROFIT BOOKING':
      return 'bg-purple-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}