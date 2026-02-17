import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UserOutboxEntity } from './entities/users-outbox.entity';
import { CreateUserAccountCommand } from '@modules/users/commands/create-user-account.command';
import { DatetimeModule } from '@technical/datetime/datetime.module';
import { TokensService } from '@modules/token.service';
import { HashingService } from './hashing.service';
import { HASHING_SERVICE_SALT_ROUNDS } from './constants';
import { ActivateUserAccountCommand } from './commands/activate-user-account.command';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, UserOutboxEntity]),
    DatetimeModule,
  ],
  providers: [
    CreateUserAccountCommand,
    ActivateUserAccountCommand,
    {
      provide: HASHING_SERVICE_SALT_ROUNDS,
      useValue: 15,
    },
    TokensService,
    HashingService,
  ],
  exports: [CreateUserAccountCommand, ActivateUserAccountCommand],
})
export class UsersModule {}
