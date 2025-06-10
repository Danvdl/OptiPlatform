import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private tokens = new Set<string>();

  onModuleInit() {
    if (admin.apps.length) return;
    try {
      const credsJson = process.env.FIREBASE_SERVICE_ACCOUNT;
      const credsPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      let credential: admin.credential.Credential;
      if (credsJson) {
        credential = admin.credential.cert(JSON.parse(credsJson));
      } else if (credsPath) {
        credential = admin.credential.cert(credsPath);
      } else {
        credential = admin.credential.applicationDefault();
      }
      admin.initializeApp({ credential });
    } catch (e) {
      console.error('Firebase init failed', e);
    }
  }

  registerToken(token: string) {
    this.tokens.add(token);
  }

  async sendLowStockAlert(product: string, quantity: number) {
    if (!this.tokens.size) return;
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title: 'Low Stock',
        body: `${product} has only ${quantity} left`,
      },
      tokens: Array.from(this.tokens),
    };
    try {
      await admin.messaging().sendMulticast(message);
    } catch (err) {
      console.error('Failed to send FCM message', err);
    }
  }
}
