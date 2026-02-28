import { Injectable } from '@nestjs/common';
import { addDays, addHours, addMinutes, addSeconds } from 'date-fns';

@Injectable()
export class DatetimeService {
  new(): Date {
    return new Date();
  }

  now(): number {
    return Date.now();
  }

  nowInSeconds(): number {
    return Math.floor(Date.now() / 1000);
  }

  getDateIn24Hours(date: Date): Date {
    return addHours(date, 24);
  }

  addMinutes(date: Date, minutes: number): Date {
    return addMinutes(date, minutes);
  }

  addDays(date: Date, days: number): Date {
    return addDays(date, days);
  }

  addSeconds(date: Date, seconds: number): Date {
    return addSeconds(date, seconds);
  }
}
