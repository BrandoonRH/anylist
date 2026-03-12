import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

// JwtAuthGuard extiende el guard de Passport para JWT.
// En REST esto funcionaría sin ningún cambio — Passport sabe
// cómo leer el request HTTP directamente.
// El problema: en GraphQL el contexto no es un HttpContext estándar,
// por lo que Passport no encuentra el request por su cuenta.
// Esta clase existe únicamente para solucionar eso.
export class JwtAuthGuard extends AuthGuard('jwt') {

  // getRequest() es el método que Passport llama internamente
  // para obtener el objeto request y extraer el token de él.
  // Se hace override para enseñarle a Passport cómo navegar
  // el contexto de GraphQL en lugar del HTTP estándar.
  getRequest(context: ExecutionContext) {

    // Igual que en el decorador @CurrentUser:
    // hay que convertir el contexto a GqlExecutionContext
    // antes de poder acceder al request real.
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    // Una vez extraído el request, Passport continúa su flujo normal:
    // busca el header Authorization, extrae el Bearer token,
    // verifica la firma y llama a JwtStrategy.validate().
    return request;
  }
}