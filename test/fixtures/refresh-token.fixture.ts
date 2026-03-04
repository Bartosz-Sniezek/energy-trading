import { RefreshTokenEntity } from '@domain/auth/entities/refresh-token.entity';
import { TokenService } from '@domain/auth/services/token.service';
import { RefreshToken, TokenGenerationOutput } from '@domain/auth/types';
import { Email } from '@domain/users/value-objects/email';
import { Password } from '@domain/users/value-objects/password';
import { LogoutUseCase } from '@modules/auth/use-cases/logout.use-case';
import { RotateTokenUseCase } from '@modules/auth/use-cases/rotate-token.use-case';
import { UserEntity } from '@modules/users/entities/user.entity';
import { UserId } from '@modules/users/types';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';

export interface UserCredentials {
  user: UserEntity;
  email: Email;
  password: Password;
}

export class RefreshTokenFixture {
  private readonly tokenService: TokenService;
  private readonly refreshTokenRepository: Repository<RefreshTokenEntity>;
  private readonly logoutUseCase: LogoutUseCase;
  private readonly rotateTokenUseCase: RotateTokenUseCase;

  constructor(app: INestApplication<App>) {
    this.tokenService = app.get(TokenService);
    this.refreshTokenRepository = app.get(
      getRepositoryToken(RefreshTokenEntity),
    );
  }

  async createRefreshTokenFor(user: UserEntity): Promise<RefreshTokenEntity> {
    const refreshToken = this.tokenService.createRefreshToken(user);

    await this.refreshTokenRepository.save(refreshToken);

    return refreshToken;
  }

  async logout(userId: UserId, sessionId: string): Promise<void> {
    await this.logoutUseCase.execute(userId, sessionId);
  }

  async rotate(token: RefreshToken): Promise<TokenGenerationOutput> {
    return this.rotateTokenUseCase.execute(token);
  }

  async getEntityByToken(token: RefreshToken): Promise<RefreshTokenEntity> {
    return this.refreshTokenRepository.findOneByOrFail({ token });
  }
}
