import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { DataSource, EntityManager } from 'typeorm';
import { UserOutboxEntity } from '../entities/users-outbox.entity';
import { EmailVerificationTokenEntity } from '../entities/email-verification-token.entity';
import { DatetimeService } from '@technical/datetime/datetime.service';
import { HashingService } from '../hashing.service';
import { UserEvents } from '@domain/users/events.enum';
import { TokensService } from '../../token.service';
import { Email } from '@domain/users/value-objects/email';
import { Password } from '@domain/users/value-objects/password';
import { handleUniqueViolation } from '@technical/database/helpers/handle-unique-violation';
import { UniqueViolationError } from '@technical/database/errors/unique-violation.error';

export interface CreateUserAccountParams {
  email: Email;
  password: Password;
  firstName: string;
  lastName: string;
}

@Injectable()
export class CreateUserAccountCommand {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly datetimeService: DatetimeService,
    private readonly hashingService: HashingService,
    private readonly tokensService: TokensService,
  ) {}

  async execute(params: CreateUserAccountParams): Promise<void> {
    const passwordHash = await this.hashingService.hash(
      params.password.getValue(),
    );
    const token = this.tokensService.generateToken();

    await this.dataSource.transaction(async (entityManager) => {
      const usersRepository = entityManager.getRepository(UserEntity);
      const usersOutboxRepository =
        entityManager.getRepository(UserOutboxEntity);
      const emailVerificationTokenRepository = entityManager.getRepository(
        EmailVerificationTokenEntity,
      );

      try {
        await entityManager.query('SAVEPOINT user_creation_attempt');
        const userAccount = await usersRepository
          .save({
            email: params.email.getValue(),
            passwordHash,
            firstName: params.firstName,
            lastName: params.lastName,
          })
          .catch((error) => handleUniqueViolation(error));

        await entityManager.query('RELEASE SAVEPOINT user_creation_attempt');
        await usersOutboxRepository.save({
          aggregateId: userAccount.id,
          eventType: UserEvents.USER_ACCOUNT_REGISTERED,
          payload: {
            email: userAccount.email,
            firstName: userAccount.firstName,
            lastName: userAccount.lastName,
          },
        });

        await emailVerificationTokenRepository.save({
          userId: userAccount.id,
          token,
          expiresAt: this.datetimeService.getDateIn24Hours(
            userAccount.createdAt,
          ),
        });

        return;
      } catch (error) {
        await entityManager.query(
          'ROLLBACK TO SAVEPOINT user_creation_attempt',
        );

        if (error instanceof UniqueViolationError) {
          await this.handleUserCreationError(entityManager, error);

          return;
        }

        throw error;
      }
    });
  }

  private async handleUserCreationError(
    entityManager: EntityManager,
    error: UniqueViolationError,
  ): Promise<void> {
    switch (error.column) {
      case 'email':
        await this.registrationAttemptWithExistingAccountHandler(
          entityManager,
          error.value,
        );
        break;
      default:
        throw error;
    }
  }

  private async registrationAttemptWithExistingAccountHandler(
    entityManager: EntityManager,
    email: string,
  ): Promise<void> {
    const userAccount = await entityManager
      .getRepository(UserEntity)
      .findOneByOrFail({
        email,
      });

    await entityManager.getRepository(UserOutboxEntity).save({
      aggregateId: userAccount.id,
      eventType:
        UserEvents.USER_ACCOUNT_REGISTRATION_ATTEMPTED_WITH_EXISTING_ACCOUNT,
      payload: {
        email: userAccount.email,
      },
    });
  }
}
