import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { UserEntity } from '../../../domain/users/entities/user.entity';
import { DataSource } from 'typeorm';
import { UserOutboxEntity } from '../../../domain/users/entities/users-outbox.entity';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { UserAccountAlreadyActivatedError } from '@domain/auth/errors/user-account-already-activated.error';
import { InvalidVerificationTokenError } from '@domain/auth/errors/invalid-verification-token.error';
import { EmailVerificationTokenExpiredError } from '@domain/auth/errors/email-verification-token-expired.error';
import { ClsService } from 'nestjs-cls';

export interface ActivateUserAccountParams {
  token: string;
}

@Injectable()
export class ActivateUserAccountUseCase {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly datetimeService: DatetimeService,
    private readonly cls: ClsService,
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
      await usersOutboxRepository.save(
        UserOutboxEntity.userAccountActivated(user.id, this.cls.getId(), {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }),
      );
    });
  }
}
