import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigModule } from '@technical/app-config/app-config.module';

@Module({
  imports: [AppConfigModule, JwtModule],
  exports: [AppConfigModule, JwtModule],
})
export class JwtAuthModule {}
