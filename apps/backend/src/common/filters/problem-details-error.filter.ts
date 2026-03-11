import { DomainError } from '@domain/errors/domain.error';
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ProblemDetails } from '@energy-trading/shared/types';
import { resolveProblemDetailsUrn } from '@energy-trading/shared/errors';

const toKebabCase = (str: string): string => {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
};

const contentType = 'application/problem+json';

@Catch()
export class ProblemDetailsErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const instance = ctx.getRequest<Request>().url;

    if (exception instanceof DomainError) {
      response
        .status(exception.statusCode)
        .contentType(contentType)
        .json(<ProblemDetails>{
          type: resolveProblemDetailsUrn(exception.errorCode),
          title: exception.message,
          status: exception.statusCode,
          instance,
        });

      return;
    }

    if (exception instanceof HttpException) {
      response
        .status(exception.getStatus())
        .contentType(contentType)
        .json(<ProblemDetails>{
          type: `urn:problem:${toKebabCase(exception.name)}`,
          title: exception.message,
          status: exception.getStatus(),
          instance,
        });

      return;
    }

    response
      .status(500)
      .contentType(contentType)
      .json(<ProblemDetails>{
        type: 'urn:problem:internal-exception',
        title: 'Internal Server Error',
        status: 500,
        instance,
      });
  }
}
