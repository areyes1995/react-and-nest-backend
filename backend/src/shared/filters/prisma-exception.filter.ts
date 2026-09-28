import {
  Catch,
  ConflictException,
  ExceptionFilter,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2002': {
        const indexName = (exception.meta as any)?.driverAdapterError?.cause
          ?.constraint?.index;

        let field: string | undefined;

        if (indexName) {
          const match = indexName.match(/_(.*?)_key/);
          field = match ? match[1] : undefined;
        }

        throw new ConflictException({
          message: 'Unique constraint violation',
          field,
        });
      }
      default: {
        // Log the unhandled Prisma error for debugging purposes
        console.error('Unhandled Prisma error:', exception);

        throw new InternalServerErrorException({
          message: 'Database error',
        });
      }
    }
  }
}
