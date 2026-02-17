import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { DataSource } from 'typeorm';
import { UserOutboxEntity } from '../entities/users-outbox.entity';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { UserEvents } from '@domain/users/events.enum';
import { EmailVerificationTokenExpiredError } from '../errors/email-verification-token-expired.error';
import { UserAccountAlreadyActivatedError } from '../errors/user-account-already-activated.error';
import { InvalidVerificationTokenError } from '../errors/invalid-verification-token.error';

export interface ActivateUserAccountParams {
  token: string;
}

@Injectable()
export class ActivateUserAccountCommand {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly datetimeService: DatetimeService,
  ) {}

  async execute(params: ActivateUserAccountParams): Promise<void> {
    await this.dataSource.transaction(async (entityManager) => {
      const usersRepository = entityManager.getRepository(UserEntity);
      const usersOutboxRepository =
        entityManager.getRepository(UserOutboxEntity);

      const now = this.datetimeService.new();
      const user = await usersRepository.findOne({
        where: {
          activationToken: params.token,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (user == null) throw new InvalidVerificationTokenError();
      if (user.isActive) throw new UserAccountAlreadyActivatedError();
      if (user.activationTokenExpiresAt < now)
        throw new EmailVerificationTokenExpiredError();

      user.isActive = true;
      await usersRepository.save(user);
      await usersOutboxRepository.save({
        aggregateId: user.id,
        eventType: UserEvents.USER_ACCOUNT_ACTIVATED,
        payload: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    });
  }
}
