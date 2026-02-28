import { Module } from '@nestjs/common';
import { HASHING_SERVICE_SALT_ROUNDS } from './constants';
import { HashingService } from './hashing.service';

@Module({
  providers: [
    {
      provide: HASHING_SERVICE_SALT_ROUNDS,
      useValue: 15,
    },
    HashingService,
  ],
  exports: [HashingService],
})
export class HashingModule {}
