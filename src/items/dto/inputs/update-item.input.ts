import { CreateItemInput } from './create-item.input';
import { InputType, Field, PartialType, ID } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

// PartialType(CreateItemInput) genera automáticamente una versión
// donde todos los campos de CreateItemInput son opcionales (nullable: true).
// Es una utilidad de @nestjs/graphql — evita repetir cada campo con ? manualmente.
// En REST existe el mismo patrón con PartialType de @nestjs/mapped-types.
@InputType()
export class UpdateItemInput extends PartialType(CreateItemInput) {

  // El id es el único campo obligatorio — necesitas saber qué ítem actualizar.
  // Usa el tipo ID de GraphQL en lugar de String para indicar que es un identificador.
  // @IsUUID valida el formato antes de que llegue al Service.
  @Field(() => ID)
  @IsUUID()
  id: string;
}