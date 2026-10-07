import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { CryptoService } from './crypto.service';

export interface EncryptedRequest extends Request {
  encryptedRequest?: boolean;
}

@Injectable()
export class EncryptionMiddleware implements NestMiddleware {
  constructor(private readonly crypto: CryptoService) {}

  use(req: EncryptedRequest, _res: Response, next: NextFunction) {
    if (req.is('multipart/form-data')) {
      return next();
    }

    if (req.body?.payload !== undefined) {
      if (typeof req.body.payload !== 'string') {
        throw new BadRequestException('Encrypted payload must be a string');
      }
      req.body = this.crypto.decrypt(req.body.payload);
      req.encryptedRequest = true;
    }

    return next();
  }
}
