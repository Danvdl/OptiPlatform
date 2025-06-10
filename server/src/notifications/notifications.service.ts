import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private tokens = new Set<string>();

  onModuleInit() {
    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
      } catch (e) {
        console.error('Firebase init failed', e);
      }
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
