import { TokenService } from '@domain/auth/services/token.service';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigModule } from '@technical/app-config/app-config.module';
import { AppCacheModule } from '@technical/cache/app-cache.module';
import { DatetimeService } from '@technical/datetime/datetime.service';

@Module({
  imports: [AppConfigModule, AppCacheModule, JwtModule],
  providers: [TokenService, DatetimeService],
  exports: [AppConfigModule, JwtModule, AppCacheModule, TokenService, DatetimeService],
})
export class JwtAuthModule {}
