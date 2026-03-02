import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshTokenEntity } from '../../../domain/auth/entities/refresh-token.entity';
import { AuthenticatedUser } from '@domain/auth/types';
import { DatetimeService } from '@technical/datetime/datetime.service';

@Injectable()
export class LogoutUseCase {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
    private readonly datetimeService: DatetimeService,
  ) {}

  async execute(user: AuthenticatedUser): Promise<void> {
    await this.refreshTokenRepository.update(
      {
        userId: user.userId,
        family: user.sessionId,
      },
      {
        revokedAt: this.datetimeService.new(),
      },
    );

    return;
  }
}
