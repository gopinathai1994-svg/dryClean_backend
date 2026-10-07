import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class CryptoService {
  constructor(private readonly config: ConfigService) {}

  private get key(): string {
    const key = this.config.get<string>('CRYPTO_KEY');
    if (!key) {
      throw new BadRequestException('Encryption key is not configured');
    }
    return key;
  }

  encrypt(value: unknown): string {
    return CryptoJS.AES.encrypt(JSON.stringify(value), this.key).toString();
  }

  decrypt<T = unknown>(payload: string): T {
    try {
      const bytes = CryptoJS.AES.decrypt(payload, this.key);
      const plainText = bytes.toString(CryptoJS.enc.Utf8);
      if (!plainText) {
        throw new Error('Unable to decrypt payload');
      }
      return JSON.parse(plainText) as T;
    } catch {
      throw new BadRequestException('Invalid encrypted payload');
    }
  }
}
