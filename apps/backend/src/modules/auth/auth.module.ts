import { Module } from '@nestjs/common';
import { LoginUseCase } from './use-cases/login.use-case';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@modules/users/entities/user.entity';
import { RefreshTokenEntity } from '../../domain/auth/entities/refresh-token.entity';
import { TokenService } from '@domain/auth/services/token.service';
import { AppConfigModule } from '@technical/app-config/app-config.module';
import { DatetimeModule } from '@technical/datetime/datetime.module';
import { JwtModule } from '@nestjs/jwt';
import { CookieService } from './cookie.service';
import { AuthController } from './auth.controller';
import { HashingModule } from '@modules/hashing/hashing.module';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { AppCacheModule } from '@technical/cache/app-cache.module';
import { RotateTokenUseCase } from './use-cases/rotate-token.use-case';
import { AccountTokenActivationResendRequestedUseCase } from './use-cases/account-token-activation-resend-requested.use-case';
import { TokensService } from '@modules/users/token.service';

@Module({
  imports: [
    AppConfigModule,
    AppCacheModule,
    JwtModule,
    DatetimeModule,
    HashingModule,
    TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity]),
  ],
  providers: [
    TokenService,
    TokensService,
    CookieService,
    LoginUseCase,
    LogoutUseCase,
    RotateTokenUseCase,
    AccountTokenActivationResendRequestedUseCase,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
