import { ArgsType, Field } from '@nestjs/graphql';
import { IsArray } from 'class-validator';
import { ValidRoles } from '../../../auth/enums/valid-roles.enum';

// @ArgsType agrupa los argumentos de filtrado como campos planos en el esquema.
// El cliente puede llamar la query así:
//   query { users(roles: [admin, superUser]) { ... } }
// Si no manda roles, el default [] retorna todos los usuarios sin filtrar.
@ArgsType()
export class ValidRolesArgs {

    // () => [ValidRoles] le dice a GraphQL que este campo es un array del enum ValidRoles.
    // GraphQL validará que los valores enviados existan en el enum —
    // si el cliente manda un rol que no existe, el error ocurre antes de llegar al resolver.
    @Field(() => [ValidRoles], { nullable: true })
    @IsArray()
    roles: ValidRoles[] = []
}