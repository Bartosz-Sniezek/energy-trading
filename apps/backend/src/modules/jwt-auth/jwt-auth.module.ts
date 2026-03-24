import { TokenService } from '@domain/auth/services/token.service';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigModule } from '@technical/app-config/app-config.module';
import { AppCacheModule } from '@technical/cache/app-cache.module';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { JwtAuthService } from './jwt-auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [AppConfigModule, AppCacheModule, JwtModule],
  providers: [TokenService, DatetimeService, JwtAuthService, JwtAuthGuard],
  exports: [
    AppConfigModule,
    JwtModule,
    AppCacheModule,
    TokenService,
    JwtAuthService,
    JwtAuthGuard,
  ],
})
export class JwtAuthModule {}
