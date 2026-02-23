import { UsersModule } from '@modules/users/users.module';
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';

@Module({
  imports: [UsersModule],
  controllers: [UsersController],
})
export class UsersHttpApiModule {}
