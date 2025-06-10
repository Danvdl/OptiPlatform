import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import { DeviceToken } from './entities/device-token.entity';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private tokens = new Set<string>();

  constructor(
    @InjectRepository(DeviceToken)
    private readonly tokensRepo: Repository<DeviceToken>,
  ) {}

  async onModuleInit() {
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
      const stored = await this.tokensRepo.find();
      stored.forEach((t) => this.tokens.add(t.token));
    } catch (e) {
      console.error('Firebase init failed', e);
    }
  }

  async registerToken(token: string, userId?: number) {
    this.tokens.add(token);
    const exists = await this.tokensRepo.findOne({ where: { token } });
    if (!exists) {
      await this.tokensRepo.save(this.tokensRepo.create({ token, userId }));
    }
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
