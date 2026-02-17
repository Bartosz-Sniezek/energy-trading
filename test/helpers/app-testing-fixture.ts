import { INestApplication, Type } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '@src/app.module';
import { App } from 'supertest/types';
import { DataSource, ObjectLiteral, Repository } from 'typeorm';

export class AppTestingFixture {
  private readonly dataSource: DataSource;

  constructor(private readonly _app: INestApplication<App>) {
    this.dataSource = _app.get(DataSource);
  }

  getRepository<T extends ObjectLiteral>(entity: Type<T>): Repository<T> {
    return this._app.get(getRepositoryToken(entity));
  }

  static async create(): Promise<AppTestingFixture> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();

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
}
