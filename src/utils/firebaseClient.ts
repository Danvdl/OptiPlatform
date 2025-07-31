import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase config is available
const isFirebaseConfigured = Object.values(firebaseConfig).every(value => value && value !== 'undefined');

let app: any = null;
let messaging: any = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
  }
}

export async function registerFCM(register: (token: string) => Promise<void>) {
  if (!messaging) {
    console.warn('Firebase messaging not configured - skipping FCM registration');
    return;
  }
  
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return;
    const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_PUBLIC_VAPID_KEY });
    if (token) {
      await register(token);
    }
  } catch (err) {
    console.error('FCM registration failed', err);
  }
}

export function onForegroundMessage(cb: (payload: any) => void) {
  if (!messaging) {
    console.warn('Firebase messaging not configured - skipping message listener');
    return;
  }
  onMessage(messaging, cb);
}
