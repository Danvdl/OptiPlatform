import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export async function registerFCM(register: (token: string) => Promise<void>) {
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return;
    const token = await getToken(messaging, { vapidKey: 'YOUR_PUBLIC_VAPID_KEY' });
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
