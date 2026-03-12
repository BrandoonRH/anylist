import { createParamDecorator, ExecutionContext, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ValidRoles } from '../enums/valid-roles.enum';
import { User } from '../../users/entities/user.entity';

// Decorador personalizado de parámetro — equivalente a @Param(), @Body() etc.
// pero creado por nosotros para extraer el usuario autenticado del request.
// Se usará en los resolvers como: @CurrentUser() user: User
//                            o:   @CurrentUser([ValidRoles.admin]) user: User
export const CurrentUser = createParamDecorator(
  (roles: ValidRoles[] = [], context: ExecutionContext) => {

    // ⚠️ Diferencia clave con REST:
    // En REST el contexto HTTP se accede directo con context.switchToHttp().getRequest()
    // En GraphQL el contexto es distinto — hay que convertirlo primero con
    // GqlExecutionContext.create(context) para poder acceder al request correctamente.
    const ctx = GqlExecutionContext.create(context);
    const user: User = ctx.getContext().req.user;

    // Si no hay user en el request, significa que el Guard no se aplicó
    // en el resolver que usa este decorador — error del desarrollador, no del cliente.
    if (!user) {
      throw new InternalServerErrorException(
        `No user inside the request - make sure that we used the AuthGuard`
      );
    }

    // Si no se piden roles específicos, retorna el usuario sin verificar roles.
    if (roles.length === 0) return user;

    // Verifica que el usuario tenga al menos uno de los roles requeridos.
    // Si ningún rol del usuario está en la lista requerida, acceso denegado.
    for (const role of user.roles) {
      if (roles.includes(role as ValidRoles)) {
        return user;
      }
    }

    throw new ForbiddenException(
      `User ${user.fullName} need a valid role [${roles}]`
    );
  }
);