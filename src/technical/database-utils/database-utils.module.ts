import { Module } from '@nestjs/common';
import { RlsService } from './rls.service';

@Module({
  providers: [RlsService],
  exports: [RlsService],
})
export class DatabaseUtilsModule {}
