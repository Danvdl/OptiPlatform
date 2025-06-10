import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export async function registerFCM(register: (token: string) => Promise<void>) {
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
  onMessage(messaging, cb);
}
