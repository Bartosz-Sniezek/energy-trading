import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { EmailVerificationTokenEntity } from './entities/email-verification-token.entity';
import { UserOutboxEntity } from './entities/users-outbox.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      EmailVerificationTokenEntity,
      UserOutboxEntity,
    ]),
  ],
})
export class UsersModule {}
