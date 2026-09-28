import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { HttpExceptionFilter } from 'src/shared/filters/http-exception.filter';

function makeHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response: any = { status };
  const request: any = { url: '/api/v1/test' };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
  return { host, response, request, json, status };
}

describe('HttpExceptionFilter', () => {
  it('BadRequest con message array → mismo array', () => {
    const { host, json, status } = makeHost();
    const ex = new BadRequestException(['a', 'b']);
    new HttpExceptionFilter().catch(ex, host);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: ['a', 'b'],
        error: 'Bad Request',
        statusCode: 400,
        path: '/api/v1/test',
      }),
    );
  });

  it('BadRequest con message string → array de uno', () => {
    const { host, json } = makeHost();
    const ex = new BadRequestException('solo uno');
    new HttpExceptionFilter().catch(ex, host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: ['solo uno'] }),
    );
  });

  it('BadRequest sin message → ["Bad Request"]', () => {
    const { host, json } = makeHost();
    const ex = new BadRequestException({});
    new HttpExceptionFilter().catch(ex, host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: ['Bad Request'] }),
    );
  });

  it('excepción no BadRequest → 400 genérico', () => {
    const { host, json, status } = makeHost();
    new HttpExceptionFilter().catch(new Error('x'), host);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Bad Request', statusCode: 400 }),
    );
  });
});
