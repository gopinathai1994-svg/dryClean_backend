import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { CryptoService } from './crypto.service';
import { EncryptedRequest } from './encryption.middleware';

@Injectable()
export class EncryptionInterceptor implements NestInterceptor {
  constructor(private readonly crypto: CryptoService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<EncryptedRequest>();
    const wantsEncryptedResponse =
      request.encryptedRequest || request.headers['x-encrypted-response'] === 'true';

    return next.handle().pipe(
      map((data) => {
        if (!wantsEncryptedResponse) {
          return data;
        }

        return {
          payload: this.crypto.encrypt(data ?? null),
        };
      }),
    );
  }
}
