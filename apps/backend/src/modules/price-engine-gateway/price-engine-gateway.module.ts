import { Module } from '@nestjs/common';
import { RedisModule } from '@technical/redis/redis.module';
import { PriceEngineGateway } from './price-engine-gateway';
import { JwtAuthModule } from '@modules/jwt-auth/jwt-auth.module';
import { SessionAuthBridge } from '@domain/auth/services/session-auth.bridge';

@Module({
  imports: [RedisModule, JwtAuthModule],
  providers: [PriceEngineGateway, SessionAuthBridge],
})
export class PriceEngineGatewayModule {}
