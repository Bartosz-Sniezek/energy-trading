import { Module, Provider } from '@nestjs/common';
import {
  COMMODITIES_CONFIG,
  CommodityConfig,
  ENERGY_COMMODITIES,
  PriceEngine,
} from './price-engine';
import { DatetimeModule } from '@technical/datetime/datetime.module';
import { PriceTickProducer } from './price-tick-producer';
import { AppConfigModule } from '@technical/app-config/app-config.module';
import { KafkaModule } from '@modules/kafka/kafka.module';

@Module({
  imports: [
    AppConfigModule,
    KafkaModule.forRoot({
      clientId: 'price-engine-simulator',
    }),
    DatetimeModule,
  ],
  providers: [
    {
      provide: COMMODITIES_CONFIG,
      useValue: ENERGY_COMMODITIES,
    } satisfies Provider<CommodityConfig[]>,
    PriceEngine,
    PriceTickProducer,
  ],
})
export class PriceEngineModule {}
