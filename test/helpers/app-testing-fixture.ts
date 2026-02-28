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

export interface CreateOptions {
  mockKafka: true;
}

export class AppTestingFixture {
  private readonly dataSource: DataSource;

  private constructor(private readonly _app: INestApplication<App>) {
    this.dataSource = _app.get(DataSource);
  }

  getRepository<T extends ObjectLiteral>(entity: Type<T>): Repository<T> {
    return this._app.get(getRepositoryToken(entity));
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
    return this._app.init();
  }

  getApp(): INestApplication<App> {
    return this._app;
  }

  async close(): Promise<void> {
    await this._app.close();
  }

  async truncateDatabase() {
    const entities = this.dataSource.entityMetadatas;

    for (const entity of entities) {
      const repository = this.dataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
    }
  }

  getUsersFixture(): UsersFixture {
    return new UsersFixture(this._app);
  }
}
