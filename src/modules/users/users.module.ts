import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UserOutboxEntity } from './entities/users-outbox.entity';
import { CreateUserAccountCommand } from '@modules/users/commands/create-user-account.command';
import { DatetimeModule } from '@technical/datetime/datetime.module';
import { TokensService } from '@modules/users/token.service';
import { ActivateUserAccountCommand } from './commands/activate-user-account.command';
import { HashingModule } from '@modules/hashing/hashing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, UserOutboxEntity]),
    DatetimeModule,
    HashingModule,
  ],
  providers: [
    CreateUserAccountCommand,
    ActivateUserAccountCommand,
    TokensService,
  ],
  exports: [CreateUserAccountCommand, ActivateUserAccountCommand],
})
export class UsersModule {}
