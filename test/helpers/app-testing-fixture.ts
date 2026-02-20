import { KAFKA_SERVICE } from '@modules/kafka/kafka.module';
import { HASHING_SERVICE_SALT_ROUNDS } from '@modules/users/constants';
import { INestApplication, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from 'src/app.module';
import { App } from 'supertest/types';
import { UsersFixture } from 'test/fixtures/users-fixture';
import { DataSource, ObjectLiteral, Repository } from 'typeorm';

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
      moduleFixture.overrideProvider(KAFKA_SERVICE).useValue({});

    const app = (await moduleFixture.compile()).createNestApplication<
      INestApplication<App>
    >();

    return new AppTestingFixture(app);
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
