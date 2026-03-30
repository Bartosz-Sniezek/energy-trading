import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../domain/users/entities/user.entity';
import { UserOutboxEntity } from '../../domain/users/entities/users-outbox.entity';
import { CreateUserAccountUseCase } from '@modules/users/use-cases/create-user-account.use-case';
import { DatetimeModule } from '@technical/datetime/datetime.module';
import { HashingModule } from '@modules/hashing/hashing.module';
import { AccountActivationTokenGenerator } from '@domain/auth/services/account-activation-token.generator';
import { GetAuthenticatedUserProfileUseCase } from './use-cases/get-authenticated-user-profile.use-case';
import { UsersController } from './controllers/users.controller';
import { JwtAuthModule } from '@modules/jwt-auth/jwt-auth.module';

@Module({
  imports: [
    JwtAuthModule,
    TypeOrmModule.forFeature([UserEntity, UserOutboxEntity]),
    DatetimeModule,
    HashingModule,
  ],
  providers: [
    AccountActivationTokenGenerator,
    GetAuthenticatedUserProfileUseCase,
    CreateUserAccountUseCase,
  ],
  exports: [CreateUserAccountUseCase],
  controllers: [UsersController],
})
export class UsersModule {}
