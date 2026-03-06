import { InputType, Int, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

@InputType()
export class CreateItemInput {

  @Field(() => String)
  @IsNotEmpty()
  @IsString()
  name: string;

  // Float es el tipo GraphQL para números decimales.
  // En la sección anterior usamos Int (enteros).
  // La cantidad de un ítem puede ser 1.5 kg, 0.75 l, etc — Float es el correcto.
  @Field(() => Float)
  @IsPositive()
  quantity: number;

  // nullable: true → opcional en el esquema GraphQL.
  // @IsOptional() → opcional en la validación del pipe.
  // Siempre van juntos.
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  quantityUnits?: string;
}