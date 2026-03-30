import { JwtAuthGuard } from '@modules/jwt-auth/jwt-auth.guard';
import {
  Body,
  Controller,
  Get,
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
import { BalanceResponseDto } from './dtos/balance-reponse.dto';
import { LedgerUsersBalancesService } from '@domain/ledger/ledger-users-balances.service';
import { MissingLedgerUserBalanceError } from '@domain/ledger/errors/missing-ledger-user-balance.error';

@UseGuards(JwtAuthGuard)
@UsePipes(ZodValidationPipe)
@Controller('ledger')
export class LedgerController {
  constructor(
    private readonly depositUseCase: DepositUseCase,
    private readonly withdrawalUseCase: WithdrawalUseCase,
    private readonly balanceService: LedgerUsersBalancesService,
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

  @Get('balance')
  async getBalance(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BalanceResponseDto> {
    const balanceEntry = await this.balanceService.getBalance(user.userId);

    if (balanceEntry === null) throw new MissingLedgerUserBalanceError();

    return {
      available: balanceEntry.available,
      locked: balanceEntry.locked,
    };
  }
}
