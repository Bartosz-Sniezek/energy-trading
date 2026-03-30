import { Injectable } from '@nestjs/common';
import { EventMapper } from './interfaces/event-mapper';
import { UserAccountCreatedEvent } from '@domain/users/events/user-account-created.event';
import { BaseUserAccountCreatedEventMapper } from '@domain/users/events/mappers/base-user-account-created.event-mapper';
import { LedgerUserStateInitializerService } from '../ledger-user-state-initializer.service';

@Injectable()
export class UserAccountCreatedEventMapper
  extends BaseUserAccountCreatedEventMapper
  implements EventMapper<UserAccountCreatedEvent>
{
  constructor(
    private readonly ledgerUserLocksService: LedgerUserStateInitializerService,
  ) {
    super();
  }

  async execute(event: UserAccountCreatedEvent): Promise<void> {
    await this.ledgerUserLocksService.initializeLedgerUserState(event.userId);
  }
}
