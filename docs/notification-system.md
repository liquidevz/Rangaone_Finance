# Notification System Documentation

This document describes the real-time notification system integrated into the RangaOne Finance application.

## Overview

The notification system provides real-time updates to users about:
- New stock recommendations
- Price alerts
- Portfolio updates
- Market updates
- Investment tips
- Order status updates

## Architecture

### Components

1. **WebSocket Service** (`services/websocket.service.ts`)
   - Manages WebSocket connection to the backend
   - Handles automatic reconnection
   - Provides heartbeat mechanism
   - Emits events for different notification types

2. **Notification Service** (`services/notification.service.ts`)
   - Processes incoming WebSocket messages
   - Manages notification state
   - Shows toast notifications
   - Persists notifications to localStorage
   - Respects user preferences

3. **Notification Context** (`components/notifications/notification-context.tsx`)
   - Provides notification state to the entire app
   - Manages unread counts
   - Handles notification actions (mark as read, clear, etc.)

4. **Notification Bell** (`components/notifications/notification-bell.tsx`)
   - Displays notification icon with unread count
   - Shows notification dropdown
   - Provides quick actions

5. **Notification API Service** (`services/notification-api.service.ts`)
   - Handles API calls for notification preferences
   - Manages notification history
   - Supports push notification subscriptions

## Usage

### Basic Implementation

The notification system is automatically initialized when the app loads. It's integrated into:
- Main app layout (`app/layout.tsx`)
- Navigation bar (`components/navbar.tsx`)
- Dashboard layout (`components/dashboard-layout.tsx`)

### Testing Notifications

Visit `/notifications/demo` to test different notification types. This page allows you to:
- Simulate different notification types
- Check WebSocket connection status
- Test the notification flow

### Managing Notifications

Users can:
1. View all notifications at `/notifications`
2. Configure preferences at `/settings?tab=notifications`
3. Mark notifications as read/unread
4. Filter by type and status
5. Clear all notifications

## Notification Types

### 1. Stock Recommendations
```typescript
{
  type: 'recommendation',
  title: 'New Stock Recommendation',
  description: 'AXISBANK - BUY at ₹1150',
  priority: 'high', // for Premium recommendations
  actionUrl: '/rangaone-wealth/recommendation/AXISBANK'
}
```

### 2. Price Alerts
```typescript
{
  type: 'price_alert',
  title: 'Price Alert',
  description: 'INFY reached ₹1520 (+5.2%)',
  priority: 'medium',
  actionUrl: '/rangaone-wealth/recommendation/INFY'
}
```

### 3. Portfolio Updates
```typescript
{
  type: 'portfolio_update',
  title: 'Portfolio Update',
  description: 'Your portfolio "Long Term Growth" has been rebalanced',
  priority: 'medium',
  actionUrl: '/rangaone-wealth/my-portfolios'
}
```

### 4. Market Updates
```typescript
{
  type: 'market_update',
  title: 'Market Update',
  description: 'Nifty 50 hits all-time high',
  priority: 'high', // for urgent news
}
```

### 5. Investment Tips
```typescript
{
  type: 'tip',
  title: 'New Investment Tip',
  description: 'Banking Sector Outlook - Premium',
  priority: 'high',
  actionUrl: '/tips/tip_123'
}
```

### 6. Order Updates
```typescript
{
  type: 'order_update',
  title: 'Order Update',
  description: 'Your order for RELIANCE has been executed',
  priority: 'medium'
}
```

## User Preferences

Users can configure:
- **Email Notifications**: Daily digests and important alerts
- **Push Notifications**: Real-time browser notifications
- **SMS Notifications**: Critical alerts only
- **Frequency**: Real-time, Daily, or Weekly

## WebSocket Events

The system listens for these WebSocket events:
- `connected`: WebSocket connection established
- `disconnected`: WebSocket connection lost
- `recommendation`: New stock recommendation
- `price_alert`: Price threshold reached
- `portfolio_update`: Portfolio changes
- `market_update`: Market news
- `tip`: New investment tip

## Backend Integration

### WebSocket Endpoint
```
wss://your-backend-url/ws?token={authToken}
```

### Required WebSocket Message Format
```json
{
  "type": "recommendation",
  "data": {
    "stockId": "AXISBANK",
    "stockName": "Axis Bank",
    "symbol": "AXISBANK",
    "action": "BUY",
    "price": 1150,
    "target": 1300,
    "category": "Premium"
  },
  "timestamp": "2024-01-03T10:30:00Z"
}
```

### API Endpoints

1. **Get Notification Preferences**
   ```
   GET /api/user/notification-settings
   ```

2. **Update Notification Preferences**
   ```
   PUT /api/user/notification-settings
   ```

3. **Get Notification History**
   ```
   GET /api/notifications?limit=50&offset=0&type=recommendation&unreadOnly=true
   ```

4. **Mark as Read**
   ```
   PUT /api/notifications/{notificationId}/read
   ```

5. **Mark All as Read**
   ```
   PUT /api/notifications/read-all
   ```

6. **Clear All Notifications**
   ```
   PUT /api/notifications/clear-all
   ```

## Development

### Simulating Notifications

For development/testing, you can simulate notifications:

```typescript
import { notificationService } from '@/services/notification.service';

// Simulate a recommendation notification
notificationService.simulateNotification('recommendation');
```

### Debugging

1. Check WebSocket connection status in the notification bell
2. Open browser console to see WebSocket messages
3. Check localStorage for persisted notifications
4. Visit `/notifications/demo` for testing

## Best Practices

1. **Performance**: Notifications are limited to 100 in memory, 50 in localStorage
2. **User Experience**: High-priority notifications use distinct styling
3. **Persistence**: Notifications survive page refreshes
4. **Accessibility**: All notifications have proper ARIA labels
5. **Security**: WebSocket connection uses authentication token

## Future Enhancements

1. **Push Notifications**: Browser push notification support
2. **Sound Alerts**: Optional sound for high-priority notifications
3. **Rich Notifications**: Charts and images in notifications
4. **Notification Groups**: Group similar notifications
5. **Do Not Disturb**: Time-based notification silencing