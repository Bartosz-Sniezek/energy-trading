import { JwtAuthGuard } from '@modules/jwt-auth/jwt-auth.guard';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { DepositDto } from './dtos/deposit.dto';
import { WithdrawalDto } from './dtos/withdrawal.dto';
import { CurrentUser } from '@modules/jwt-auth/current-user.decorator';
import type { AuthenticatedUser } from '@domain/auth/types';
import { DepositUseCase } from '../use-cases/deposit.use-case';
import { WithdrawalUseCase } from '../use-cases/withdrawal.use-case';
import { MinorUnitValue } from '@domain/ledger/value-objects/minor-unit-value';
import { ZodValidationPipe } from 'nestjs-zod';

@UseGuards(JwtAuthGuard)
@UsePipes(ZodValidationPipe)
@Controller('ledger')
export class LedgerController {
  constructor(
    private readonly depositUseCase: DepositUseCase,
    private readonly withdrawalUseCase: WithdrawalUseCase,
  ) {}

  @Post('deposit')
  @HttpCode(HttpStatus.OK)
  async deposit(
    @Body() deposit: DepositDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.depositUseCase.execute(
      user.userId,
      new MinorUnitValue(deposit.amount),
    );
  }

  @Post('withdrawal')
  @HttpCode(HttpStatus.OK)
  async withdrawal(
    @Body() withdrawal: WithdrawalDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    await this.withdrawalUseCase.execute(
      user.userId,
      new MinorUnitValue(withdrawal.amount),
    );
  }
}
