# Fallah-Smart

## Notification System

The notification system in Fallah-Smart consists of several components:

1. **Backend Components**:
   - `StockNotification` model: Stores notification data in the database
   - `UserDevice` model: Tracks registered devices for push notifications
   - `NotificationService`: Handles sending notifications to devices
   - Notification routes: API endpoints for notification operations

2. **Frontend Components**:
   - `NotificationService`: Manages device registration and notification handling
   - `NotificationContext`: Provides notification state to the app
   - Notification screens: Display notifications to users

### Setup and Requirements

1. The backend requires:
   - PostgreSQL database with `stock_notifications` and `user_devices` tables
   - Firebase Admin SDK credentials for sending Firebase Cloud Messages (FCM)
   - Expo push notification configuration

2. The frontend requires:
   - Expo notification setup in the app
   - Device registration with the backend
   - Proper handling of received notifications

### Firebase Setup for Production

For production use, you need to properly configure Firebase:

1. **Firebase Service Account**:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Generate a new private key and download the JSON file
   - Save this file as `firebase-service-account.json` in the backend root directory
   - OR set the following environment variables:
     ```
     FIREBASE_PROJECT_ID=your-project-id
     FIREBASE_CLIENT_EMAIL=your-client-email
     FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour key content...\n-----END PRIVATE KEY-----\n"
     ```

2. **FCM Server Key (Legacy API Fallback)**:
   - Go to Firebase Console > Project Settings > Cloud Messaging > Server key
   - Copy the server key and set it in the `.env` file:
     ```
     FCM_SERVER_KEY=your-server-key
     ```

### How It Works

1. **Registration**:
   - When a user logs in, their device token is registered with the backend
   - This token is stored in the `user_devices` table

2. **Sending Notifications**:
   - Notifications are generated by system events (low stock, expiry dates, etc.)
   - The `NotificationService` creates a notification record and sends push notifications
   - Both Expo and FCM tokens are supported with fallback mechanisms
   - Firebase Admin SDK is used for most reliable delivery

3. **Handling Notifications**:
   - The mobile app displays notifications when received
   - Users can interact with notifications to navigate to relevant screens

### Testing the Notification System

To test if notifications are working:

1. Run the test script:
   ```
   node test-notification.js
   ```

2. Use the API endpoint (requires authentication):
   ```
   curl -X POST http://localhost:5000/api/stock/notifications/test \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json"
   ```

3. Check the backend server logs for notification delivery status

### Troubleshooting

If you encounter issues:

1. Check that the Firebase service account file is valid
2. Verify that FCM server key is properly configured
3. Ensure device tokens are being registered correctly
4. Check the database tables structure
5. Look for errors in the notification service logs