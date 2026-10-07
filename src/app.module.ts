import * as dns from 'node:dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { CustomersModule } from './customers/customers.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EncryptionMiddleware } from './common/crypto/encryption.middleware';
import { EncryptionInterceptor } from './common/crypto/encryption.interceptor';
import { CryptoModule } from './common/crypto/crypto.module';
import { OrdersModule } from './orders/orders.module';
import { PdfKnowledgeModule } from './pdf-knowledge/pdf-knowledge.module';
import { PricingModule } from './pricing/pricing.module';
import { ServicesModule } from './services/services.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const uri = config.get<string>('MONGODB_URI');
console.log('Mongo URI:', uri?.replace(/:.*@/, ':****@'));
    if (!uri) {
      throw new Error('MONGODB_URI is missing in backend/.env');
    }

    return { uri
      // , family: 4,
      //     serverSelectionTimeoutMS: 10000,
     };
  },
}),
    CryptoModule,
    AuthModule,
    ChatModule,
    UsersModule,
    CustomersModule,
    OrdersModule,
    PdfKnowledgeModule,
    ServicesModule,
    PricingModule,
    DashboardModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: EncryptionInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(EncryptionMiddleware).forRoutes('*');
  }
}
