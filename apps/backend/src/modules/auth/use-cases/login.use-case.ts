import { InvalidCredentialsError } from '@domain/auth/errors/invalid-credentials.error';
import {
  AccountActivationChallenge,
  TokenService,
} from '@domain/auth/services/token.service';
import { Email } from '@domain/users/value-objects/email';
import { UserEntity } from '@domain/users/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshTokenEntity } from '../../../domain/auth/entities/refresh-token.entity';
import { AccessToken, RefreshToken } from '@domain/auth/types';
import { HashingService } from '@modules/hashing/hashing.service';
import { AccountNotActivatedError } from '@domain/auth/errors/account-not-activated.error';
import { SessionAuthBridge } from '@domain/auth/services/session-auth.bridge';

export interface LoginInput {
  email: Email;
  password: string;
}

export interface LoginOutput {
  accessToken: AccessToken;
  refreshToken: RefreshToken;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
    private readonly tokenService: TokenService,
    private readonly hashingService: HashingService,
    private readonly sessionAuthBridge: SessionAuthBridge,
  ) {}

  async execute(options: LoginInput): Promise<LoginOutput> {
    const user = await this.usersRepository.findOneBy({
      email: options.email.getValue(),
    });

    if (user == null) {
      // do dummy hashing to prevent email enumeration (increase response time)
      await this.hashingService.dummyHash();
      throw new InvalidCredentialsError();
    }

    const passwordMatch = await this.hashingService.compare(
      options.password,
      user.passwordHash,
    );

    if (!passwordMatch) throw new InvalidCredentialsError();
    if (!user.isActive) {
      const challange = await this.getResendActivationChallenge(options.email);

      throw new AccountNotActivatedError({
        challenge: challange.token,
        expirationDate: challange.expiresAt,
      });
    }

    const { tokenEntity, token } = this.tokenService.createRefreshToken(user);
    const accessToken = await this.tokenService.generateAccessToken(
      user,
      tokenEntity.family,
    );

    await this.refreshTokenRepository.save(tokenEntity);
    await this.sessionAuthBridge.setSessionInCache(tokenEntity.family);

    return {
      accessToken,
      refreshToken: token,
    };
  }

  private async getResendActivationChallenge(
    email: Email,
  ): Promise<AccountActivationChallenge> {
    const data =
      await this.tokenService.getAccountActivationChallengeByEmail(email);

    if (data) return data;

    return this.tokenService.generateResendActivationChallenge(email);
  }
}
