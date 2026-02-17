import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { EmailVerificationTokenEntity } from './entities/email-verification-token.entity';
import { UserOutboxEntity } from './entities/users-outbox.entity';
import { CreateUserAccountCommand } from '@modules/users/commands/create-user-account.command';
import { DatetimeModule } from '@technical/datetime/datetime.module';
import { TokensService } from '@modules/token.service';
import { HashingService } from './hashing.service';
import { HASHING_SERVICE_SALT_ROUNDS } from './constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      EmailVerificationTokenEntity,
      UserOutboxEntity,
    ]),
    DatetimeModule,
  ],
  providers: [
    CreateUserAccountCommand,
    {
      provide: HASHING_SERVICE_SALT_ROUNDS,
      useValue: 15,
    },
    TokensService,
    HashingService,
  ],
  exports: [CreateUserAccountCommand],
})
export class UsersModule {}
