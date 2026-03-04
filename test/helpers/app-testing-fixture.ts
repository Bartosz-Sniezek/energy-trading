import { KafkaJS } from '@confluentinc/kafka-javascript';
import { HASHING_SERVICE_SALT_ROUNDS } from '@modules/hashing/constants';
import { KAFKA_SERVICE } from '@modules/kafka/constants';
import { UsersOutboxConsumer } from '@modules/users-outbox-email-consumer/users-outbox.consumer';
import { INestApplication, Type } from '@nestjs/common';
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

export interface CreateOptions {
  mockKafka: true;
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

    if (options?.mockKafka)
      moduleFixture
        .overrideProvider(KAFKA_SERVICE)
        .useValue(mock<KafkaJS.Kafka>())
        .overrideProvider(UsersOutboxConsumer)
        .useValue(mock<UsersOutboxConsumer>());

    const app = (await moduleFixture.compile()).createNestApplication<
      INestApplication<App>
    >();
    configureApp(app);

    return new AppTestingFixture(app);
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
