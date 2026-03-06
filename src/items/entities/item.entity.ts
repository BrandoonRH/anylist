import { ObjectType, Field, Int, ID, Float } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Esta clase tiene DOS responsabilidades simultáneas gracias a dos decoradores:
//
// @Entity() → le habla a TypeORM: "esto es una tabla en Postgres"
//   { name: 'items' } define el nombre exacto de la tabla en BD.
//   Sin esto, TypeORM usaría el nombre de la clase en minúsculas.
//
// @ObjectType() → le habla a GraphQL: "esto es un tipo de respuesta en el esquema"
//
// En REST la entidad solo llevaría @Entity() — no necesita saber nada
// de cómo se expone al cliente. En GraphQL esta fusión es un patrón
// común cuando la estructura de la BD y la respuesta al cliente coinciden.
@Entity({ name: 'items' })
@ObjectType()
export class Item {

  // @PrimaryGeneratedColumn('uuid') → TypeORM genera el id automáticamente
  //   como UUID en Postgres. Equivale a: id UUID DEFAULT gen_random_uuid()
  // @Field(() => ID) → GraphQL expone este campo como tipo ID (identificador único)
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  // @Column() → columna estándar NOT NULL en la tabla de Postgres.
  // @Field(() => String) → campo visible y requerido en el esquema GraphQL.
  @Column()
  @Field(() => String)
  name: string;

  @Column()
  @Field(() => Float)
  quantity: number;

  // nullable: true en @Column() → la columna acepta NULL en Postgres.
  // nullable: true en @Field() → el campo es opcional en el esquema GraphQL.
  // Ambos deben coincidir — si uno permite null y el otro no, habrá inconsistencias.
  @Column({ nullable: true })
  @Field(() => Float, { nullable: true })
  quantityUnits?: string;

}

/*
 * ============================================================
 * ITEM ENTITY — EXPLICACIÓN DETALLADA
 * ============================================================
 *
 * LA ENTIDAD COMO PUNTO DE UNIÓN
 * --------------------------------
 * Esta clase es donde TypeORM y GraphQL se encuentran.
 * Cada propiedad tiene hasta dos decoradores: uno de cada mundo.
 *
 *   Decorador TypeORM     Qué hace en Postgres
 *   ──────────────────────────────────────────
 *   @Entity()             Define la tabla
 *   @PrimaryGeneratedColumn('uuid')  Columna PK con UUID autogenerado
 *   @Column()             Columna NOT NULL
 *   @Column({nullable:true})  Columna que acepta NULL
 *
 *   Decorador GraphQL     Qué hace en el esquema
 *   ──────────────────────────────────────────
 *   @ObjectType()         Define el tipo de respuesta
 *   @Field(() => ID)      Campo ID (identificador único)
 *   @Field(() => String)  Campo String requerido
 *   @Field({nullable:true})  Campo opcional en el esquema
 *
 *
 * ¿CUÁNDO SEPARAR ENTIDAD Y OBJECTTYPE?
 * ---------------------------------------
 * Fusionarlos en una sola clase es práctico y común en proyectos
 * medianos. Pero hay casos donde conviene separarlos:
 *
 * - Si la BD tiene campos que NUNCA deben exponerse al cliente
 *   (ej: password, tokens internos) — con @Field() accidentalmente
 *   los expondrías si no tienes cuidado.
 *
 * - Si la respuesta al cliente tiene una forma muy distinta
 *   a la estructura de la tabla.
 *
 * Para este proyecto y la mayoría de CRUDs simples,
 * tenerlos juntos es la opción más limpia.
 *
 *
 * EL NULLABLE DEBE SER CONSISTENTE EN AMBAS CAPAS
 * -------------------------------------------------
 *   @Column({ nullable: true })          ← Postgres acepta NULL
 *   @Field(() => String, { nullable: true }) ← GraphQL acepta null
 *
 * Si marcas nullable en TypeORM pero no en GraphQL, el esquema
 * exigirá el campo aunque la BD no lo requiera — error en runtime.
 * Si marcas nullable en GraphQL pero no en TypeORM, Postgres
 * rechazará el INSERT cuando el campo llegue vacío.
 * ============================================================
 */