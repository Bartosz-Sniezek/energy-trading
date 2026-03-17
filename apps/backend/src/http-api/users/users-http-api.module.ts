import { UsersModule } from '@modules/users/users.module';
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { GetAuthenticatedUserProfileUseCase } from './use-cases/get-authenticated-user-profile.use-case';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@modules/users/entities/user.entity';
import { JwtAuthModule } from '@modules/jwt-auth/jwt-auth.module';

@Module({
  imports: [JwtAuthModule, UsersModule, TypeOrmModule.forFeature([UserEntity])],
  providers: [GetAuthenticatedUserProfileUseCase],
  controllers: [UsersController],
})
export class UsersHttpApiModule {}
