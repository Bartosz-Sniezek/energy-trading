import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class RlsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async withRLS<T>(
    userId: string,
    callback: (manager: EntityManager) => Promise<T>,
    existingManager?: EntityManager,
  ): Promise<T> {
    const run = async (manager: EntityManager) => {
      await manager.query(`SET LOCAL ROLE app_user`);
      await manager.query(`SET LOCAL app.user_id = $1`, [userId]);
      return callback(manager);
    };

    if (existingManager) {
      return run(existingManager);
    }

    return this.dataSource.transaction(run);
  }
}
