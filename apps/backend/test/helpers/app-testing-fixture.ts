import { KafkaJS } from '@confluentinc/kafka-javascript';
import { HASHING_SERVICE_SALT_ROUNDS } from '@modules/hashing/constants';
import { KAFKA_SERVICE } from '@modules/kafka/constants';
import { UsersOutboxConsumer } from '@modules/users-outbox-email-consumer/users-outbox.consumer';
import { INestApplication, Logger, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from 'src/app.module';
import { configureApp } from 'src/configure-app';
import { App } from 'supertest/types';
import { UsersFixture } from 'test/fixtures/users-fixture';
import { DataSource, ObjectLiteral, Repository } from 'typeorm';
import { mock } from 'vitest-mock-extended';
import { AuthenticatedClient } from './authenticated-client';
import { RefreshTokenFixture } from 'test/fixtures/refresh-token.fixture';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { MAIL_SERVICE } from '@technical/mailing/constants';
import { PROBLEM_DETAILS_LOGGER } from '@common/filters/problem-details-error.filter';
import { PriceEngineRedisConsumer } from '@modules/price-engine-redis-consumer/price-engine-redis-consumer';
import { PriceEngineGateway } from '@modules/price-engine-gateway/price-engine-gateway';
import { MailService } from '@technical/mailing/interfaces/mail-service';
import { createKafkaMock } from 'test/mocks/kafka/kafka.mock';

export interface CreateOptions {
  mockKafka?: true;
  mockWs?: true;
  useLoggers?: true;
  mailerMock?: MailService;
}

export class AppTestingFixture {
  private readonly dataSource: DataSource;
  private readonly _usersFixture: UsersFixture;

  private constructor(private readonly app: INestApplication<App>) {
    this.dataSource = app.get(DataSource);
    this._usersFixture = new UsersFixture(app);
  }

  getRepository<T extends ObjectLiteral>(entity: Type<T>): Repository<T> {
    return this.app.get(getRepositoryToken(entity));
  }

  static async create(options?: CreateOptions): Promise<AppTestingFixture> {
    const moduleFixture = Test.createTestingModule({
      imports: [AppModule],
    });

    // Minimal hashing rounds to speed up tests
    // Intention: Validate flows, not the hashing algorithm itself
    moduleFixture.overrideProvider(HASHING_SERVICE_SALT_ROUNDS).useValue(4);

    if (options?.mockKafka) {
      const kafkaMock = createKafkaMock();

      moduleFixture
        .overrideProvider(KAFKA_SERVICE)
        .useValue(kafkaMock.kafkaMock)
        // .overrideProvider(UsersOutboxConsumer)
        // .useValue(mock<UsersOutboxConsumer>())
        // .overrideProvider(PriceEngineRedisConsumer)
        // .useValue(mock<PriceEngineRedisConsumer>());
    }

    if (options?.mockWs) {
      moduleFixture.overrideProvider(PriceEngineGateway).useValue(mock<PriceEngineGateway>());
    }

    if (options?.mailerMock) {
      moduleFixture.overrideProvider(MAIL_SERVICE).useValue(options.mailerMock);
    }

    if (!!options?.useLoggers === false) {
      moduleFixture
        .overrideProvider(PROBLEM_DETAILS_LOGGER)
        .useValue(mock<Logger>());
    }

    const app = (await moduleFixture.compile()).createNestApplication<
      INestApplication<App>
    >();
    configureApp(app);

    return new AppTestingFixture(app);
  }

  static async createWithMocks(): Promise<AppTestingFixture> {
    return AppTestingFixture.create({
      mailerMock: mock<MailService>(),
      mockKafka: true,
      mockWs: true,
    });
  }

  async init(): Promise<INestApplication<App>> {
    return this.app.init();
  }

  getApp(): INestApplication<App> {
    return this.app;
  }

  async close(): Promise<void> {
    await this.app.close();
  }

  async truncateDatabase() {
    const entities = this.dataSource.entityMetadatas;

    for (const entity of entities) {
      const repository = this.dataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
    }
  }

  async clearCache() {
    await this.app.get<Cache>(CACHE_MANAGER).clear();
  }

  async createAuthenticatedClient(): Promise<AuthenticatedClient> {
    return AuthenticatedClient.create(
      this.app.getHttpServer(),
      this._usersFixture,
    );
  }

  getUsersFixture(): UsersFixture {
    return this._usersFixture;
  }

  getRefreshTokenFixture(): RefreshTokenFixture {
    return new RefreshTokenFixture(this.app);
  }
}
