import { Injectable } from '@nestjs/common';
import { EventMapper } from './interfaces/event-mapper';
import { UserAccountCreatedEvent } from '@domain/users/events/user-account-created.event';
import { BaseUserAccountCreatedEventMapper } from '@domain/users/events/mappers/base-user-account-created.event-mapper';
import { LedgerUserLocksService } from '../ledger-user-locks.service';

@Injectable()
export class UserAccountCreatedEventMapper
  extends BaseUserAccountCreatedEventMapper
  implements EventMapper<UserAccountCreatedEvent>
{
  constructor(private readonly ledgerUserLocksService: LedgerUserLocksService) {
    super();
  }

  async execute(event: UserAccountCreatedEvent): Promise<void> {
    await this.ledgerUserLocksService.initializeLedgerUserLock(event.userId);
  }
}
