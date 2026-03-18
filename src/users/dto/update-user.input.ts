import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { IsArray, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { CreateUserInput } from './create-user.input';
import { ValidRoles } from './../../auth/enums/valid-roles.enum';

// PartialType(CreateUserInput) hereda todos los campos de CreateUserInput
// como opcionales (nullable: true en GraphQL + @IsOptional en class-validator).
// Esto evita repetir cada campo manualmente en el input de actualización.
@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {

  // Único campo obligatorio — identifica qué usuario se va a actualizar.
  @Field(() => ID)
  @IsUUID()
  id: string;

  // Permite que un admin cambie los roles de un usuario.
  // Es un array del enum ValidRoles — solo valores permitidos pueden enviarse.
  // En GraphQL el cliente mandaría: roles: [admin, superUser]
  @Field(() => [ValidRoles], { nullable: true })
  @IsArray()
  @IsOptional()
  roles?: ValidRoles[];

  // Permite activar o desactivar un usuario manualmente.
  // Complementa al blockUser — block solo desactiva,
  // este campo permite reactivar también desde updateUser.
  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}