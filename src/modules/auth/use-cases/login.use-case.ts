import { InvalidCredentialsError } from '@domain/auth/errors/invalid-credentials.error';
import { TokenService } from '@domain/auth/services/token.service';
import { Email } from '@domain/users/value-objects/email';
import { UserEntity } from '@modules/users/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshTokenEntity } from '../../../domain/auth/entities/refresh-token.entity';
import { AccessToken, RefreshToken } from '@domain/auth/types';

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
  ) {}

  async execute(options: LoginInput): Promise<LoginOutput> {
    const user = await this.usersRepository.findOneBy({
      email: options.email.getValue(),
    });

    if (user == null) throw new InvalidCredentialsError();

    const accessToken = await this.tokenService.generateAccessToken(user);
    const refreshToken = this.tokenService.createRefreshToken(user);

    await this.refreshTokenRepository.save(refreshToken);

    return {
      accessToken,
      refreshToken: refreshToken.token,
    };
  }
}
