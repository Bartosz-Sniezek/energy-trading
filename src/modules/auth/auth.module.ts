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

@Module({
  imports: [
    AppConfigModule,
    JwtModule,
    DatetimeModule,
    HashingModule,
    TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity]),
  ],
  providers: [TokenService, CookieService, LoginUseCase],
  controllers: [AuthController],
})
export class AuthModule {}
