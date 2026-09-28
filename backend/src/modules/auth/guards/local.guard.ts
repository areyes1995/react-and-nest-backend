import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class LocalGuard extends AuthGuard('local') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    console.log('Executing local Auth Guards');

    return super.canActivate(context); //esto ejecuta el contexto de la estrategia local, dicha estrategia se provee en el module file, y el mismo authGuard se encarga de buscar la estrategia que ha sido proveida.
  }
}
