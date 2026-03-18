import { registerEnumType } from "@nestjs/graphql";

export enum ValidRoles {
    admin = 'admin',
    user = 'user',
    superUser = 'superUser'
}

// registerEnumType registra el enum de TypeScript en el sistema de tipos de GraphQL.
registerEnumType(ValidRoles, { name: 'ValidRoles' })

/*
 * ¿POR QUÉ ES NECESARIO registerEnumType?
 * =========================================
 *
 * TypeScript y GraphQL son dos sistemas de tipos completamente independientes.
 *
 * Un enum de TypeScript existe solo en tiempo de compilación — es una
 * construcción del lenguaje que desaparece cuando el código se transpila a JS.
 * GraphQL tiene su propio sistema de tipos en runtime, y no sabe nada de
 * los enums de TypeScript por defecto.
 *
 * Cuando usas () => [ValidRoles] en un @Field() o @Args(), NestJS necesita
 * poder traducir ese enum a una definición GraphQL válida para incluirla
 * en el schema.gql generado. Sin registerEnumType, NestJS no tiene forma
 * de hacer esa traducción y lanza un error porque el tipo es desconocido
 * para el sistema GraphQL.
 *
 * registerEnumType hace exactamente ese puente:
 *
 *   TypeScript enum ValidRoles   →   GraphQL enum ValidRoles
 *   ─────────────────────────────────────────────────────────
 *   admin = 'admin'              →   admin
 *   user = 'user'                →   user
 *   superUser = 'superUser'      →   superUser
 *
 * El resultado en el schema.gql generado es:
 *
 *   enum ValidRoles {
 *     admin
 *     user
 *     superUser
 *   }
 *
 * Esto es lo mismo que le pasa a las clases con @ObjectType() e @InputType() —
 * también necesitan ser registradas explícitamente para que GraphQL las conozca.
 * La diferencia es que los decoradores @ObjectType() e @InputType() hacen ese
 * registro automáticamente. Para enums no hay un decorador equivalente,
 * así que registerEnumType es la forma manual de hacer lo mismo.
 *
 * Regla: cualquier enum que uses en un @Field(), @Args() o @InputType()
 * necesita su registerEnumType correspondiente, o GraphQL no sabrá qué es.
 */