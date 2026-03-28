import { Module } from '@nestjs/common';
import { DatetimeModule } from '@technical/datetime/datetime.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerEntryEntity } from '@domain/ledger/entities/ledger.entity';
import { LedgerOutboxEntity } from '@domain/ledger/entities/ledger-outbox.entity';
import { LedgerUsersOutboxConsumer } from './ledger-users-outbox.consumer';
import { KafkaModule } from '@modules/kafka/kafka.module';
import { AppConfigModule } from '@technical/app-config/app-config.module';
import { LedgerUserLocksService } from './ledger-user-locks.service';
import { LedgerUserLockEntity } from '@domain/ledger/entities/ledger-user-lock.entity';
import { LedgerUsersOutboxMessageHandler } from './ledger-users-outbox-message.handler';
import { UserAccountCreatedEventMapper } from './event-mappers/user-account-created.event-mapper';
import { DebeziumConnectorMessageParser } from '@common/kafka/debezium-connector-message.parser';

@Module({
  imports: [
    AppConfigModule,
    KafkaModule.forRoot({
      clientId: 'ledger',
    }),
    DatetimeModule,
    TypeOrmModule.forFeature([
      LedgerEntryEntity,
      LedgerOutboxEntity,
      LedgerUserLockEntity,
    ]),
  ],
  providers: [
    LedgerUsersOutboxConsumer,
    LedgerUserLocksService,
    LedgerUsersOutboxMessageHandler,
    UserAccountCreatedEventMapper,
    DebeziumConnectorMessageParser,
  ],
})
export class LedgerUsersOutboxConsumerModule {}
