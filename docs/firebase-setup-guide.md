# Firebase Setup Guide for RangaOne Finance Notifications

This guide will walk you through setting up Firebase Cloud Messaging for your RangaOne Finance application.

## 🚀 Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Sign in with your Google account

2. **Create New Project**
   - Click "Create a project"
   - Enter project name: `rangaone-finance-notifications`
   - Enable Google Analytics (optional)
   - Click "Create project"

## 🔧 Step 2: Enable Cloud Messaging

1. **In Firebase Console:**
   - Go to your project dashboard
   - Click on "Cloud Messaging" in the left sidebar
   - Cloud Messaging should be automatically enabled

## 📱 Step 3: Add Web App

1. **Register Your App:**
   - Click the web icon (</>) to add a web app
   - App nickname: `RangaOne Finance Web`
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"

2. **Copy Configuration:**
   - Copy the Firebase SDK configuration object
   - You'll need this for your frontend environment variables

## 🔑 Step 4: Generate VAPID Key

1. **In Project Settings:**
   - Click gear icon → "Project settings"
   - Go to "Cloud Messaging" tab
   - Under "Web configuration" section
   - Click "Generate key pair"
   - Copy the VAPID key (starts with B...)

## 🛡️ Step 5: Generate Service Account Key

1. **For Backend Integration:**
   - Go to "Project settings" → "Service accounts"
   - Click "Generate new private key"
   - Download the JSON file
   - **Keep this file secure** - never commit to version control

## 📋 Step 6: Configure Frontend Environment

Create/update your `.env.local` file:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BN4o_5...

# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.rangaone.finance
```

## 🔧 Step 7: Update Service Worker

Update `public/firebase-messaging-sw.js` with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 🧪 Step 8: Test the Setup

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Visit the demo page:**
   - Go to `http://localhost:3000/notifications/demo`
   - Click "Enable Push Notifications"
   - Allow notifications when prompted

3. **Test notifications:**
   - Click "Send Firebase Notification" buttons
   - You should see notifications even with the tab closed

## 🔒 Security Considerations

1. **Environment Variables:**
   - All `NEXT_PUBLIC_` variables are exposed to the client
   - This is normal for Firebase web configuration
   - The VAPID key should be public

2. **Service Account Key:**
   - Keep the JSON file secure on your backend
   - Never expose it in frontend code
   - Use environment variables for the file path

3. **Domain Authorization:**
   - In Firebase Console → Project Settings → General
   - Add your production domain to "Authorized domains"

## 🚀 Production Deployment

### Frontend (Vercel/Netlify)

Add environment variables to your deployment platform:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
```

### Backend

1. **Upload service account key securely**
2. **Set environment variables:**
   ```bash
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_SERVICE_ACCOUNT_KEY=/secure/path/to/service-account.json
   ```

## 📊 Monitoring

1. **Firebase Console:**
   - Monitor notification delivery in Cloud Messaging section
   - View analytics and engagement metrics

2. **Application Logs:**
   - Check browser console for FCM token registration
   - Monitor backend logs for notification sending

## 🐛 Troubleshooting

### Common Issues:

1. **"Notifications not supported"**
   - Check if using HTTPS (required for notifications)
   - Verify browser supports notifications

2. **"Permission denied"**
   - Check browser notification settings
   - Clear site data and try again

3. **"Service worker not found"**
   - Ensure `firebase-messaging-sw.js` is in `/public` directory
   - Check browser network tab for 404 errors

4. **"Invalid VAPID key"**
   - Verify VAPID key is correctly copied
   - Check for extra spaces or characters

### Debug Mode:

Add to your environment for debugging:

```bash
NEXT_PUBLIC_DEBUG_FCM=true
```

This will enable additional console logging for FCM operations.

## ✅ Verification Checklist

- [ ] Firebase project created
- [ ] Cloud Messaging enabled  
- [ ] Web app registered
- [ ] VAPID key generated
- [ ] Service account key downloaded
- [ ] Frontend environment variables configured
- [ ] Service worker updated with config
- [ ] Demo page working
- [ ] Notifications appearing in browser
- [ ] Backend integration completed (if applicable)

## 🎉 Next Steps

Once Firebase is set up:

1. **Integrate with your backend** using the Firebase Admin SDK
2. **Configure notification preferences** in your user settings
3. **Set up automated notifications** for stock recommendations, price alerts, etc.
4. **Monitor delivery rates** and optimize for engagement

Your Firebase notification system is now ready to keep your users engaged with real-time financial updates! 🚀

## 📞 Need Help?

- [Firebase Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Console](https://console.firebase.google.com/)
- [FCM Troubleshooting Guide](https://firebase.google.com/docs/cloud-messaging/troubleshooting)