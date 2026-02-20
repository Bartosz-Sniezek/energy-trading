import { Injectable } from '@nestjs/common';
import { addHours } from 'date-fns';

@Injectable()
export class DatetimeService {
  new(): Date {
    return new Date();
  }

  now(): number {
    return Date.now();
  }

  getDateIn24Hours(date: Date): Date {
    return addHours(date, 24);
  }
}
