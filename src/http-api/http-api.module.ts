import { Module } from '@nestjs/common';
import { UsersHttpApiModule } from './users/users-http-api.module';

@Module({
  imports: [UsersHttpApiModule],
})
export class HttpApiModule {}
