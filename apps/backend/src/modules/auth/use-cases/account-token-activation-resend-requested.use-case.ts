import { AccountActivationResendRequestChallengeExpiredError } from '@domain/auth/errors/account-activation-resend-request-challenge-expired.error';
import { InvalidAccountActivationResendChallengeError } from '@domain/auth/errors/invalid-account-activation-resend-challenge.error';
import { TokenService } from '@domain/auth/services/token.service';
import { UserEntity } from '@modules/users/entities/user.entity';
import { UserOutboxEntity } from '@modules/users/entities/users-outbox.entity';
import { UserAccountAlreadyActivatedError } from '@modules/users/errors/user-account-already-activated.error';
import { TokensService } from '@modules/users/token.service';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { DataSource } from 'typeorm';

@Injectable()
export class AccountTokenActivationResendRequestedUseCase {
  constructor(
    private readonly tokenService: TokenService,
    @InjectDataSource()
    private readonly datasource: DataSource,
    private readonly activationTokenService: TokensService,
    private readonly datetimeService: DatetimeService,
  ) {}

  async execute(token: string): Promise<void> {
    const data =
      await this.tokenService.getAccountActivationChallengeByToken(token);

    if (data == null) throw new InvalidAccountActivationResendChallengeError();
    if (data.expiresAt < this.datetimeService.new())
      throw new AccountActivationResendRequestChallengeExpiredError();

    await this.datasource.transaction(async (entityManager) => {
      const repo = entityManager.getRepository(UserEntity);
      const outboxRepo = entityManager.getRepository(UserOutboxEntity);

      const user = await repo.findOne({
        where: { email: data.email.getValue() },
        lock: {
          mode: 'pessimistic_read',
          onLocked: 'nowait',
        },
      });

      if (user == null)
        throw new InvalidAccountActivationResendChallengeError();

      if (user.isActive) throw new UserAccountAlreadyActivatedError();

      const newActivationToken = this.activationTokenService.generateToken();
      const now = this.datetimeService.new();
      const activationTokenExpiresAt =
        this.datetimeService.getDateIn24Hours(now);

      await repo.update(
        {
          email: data.email.getValue(),
        },
        {
          activationToken: newActivationToken,
          activationTokenExpiresAt,
        },
      );

      await outboxRepo.save(
        UserOutboxEntity.activationTokenResendRequested(user.id, {
          email: data.email.getValue(),
          activationToken: newActivationToken,
          activationTokenExpirationDate: activationTokenExpiresAt.toISOString(),
          firstName: user.firstName,
          lastName: user.lastName,
        }),
      );
    });
  }
}
