# Error CSRF en Apollo Sandbox — NestJS + GraphQL

## ¿Qué pasó?

Al visitar `http://localhost:3000/graphql` con el schema protegido por JWT, Apollo Sandbox lanza este error:

```
"This operation has been blocked as a potential Cross-Site Request Forgery (CSRF)"
```

Son dos problemas distintos que conviene entender por separado.

---

## 1. El error CSRF no es tu código — es Apollo Sandbox

Cuando visitas `http://localhost:3000/graphql` desde el navegador, Apollo Sandbox hace
una petición inicial de **introspección** para descubrir el esquema disponible.
Esa petición no lleva el header `content-type: application/json` correcto,
y Apollo Server la bloquea por protección CSRF.

**Esto es comportamiento esperado y normal. No significa que tu configuración esté mal.**

La diferencia con versiones anteriores del curso (hace ~3 años) es que versiones
más nuevas de Apollo Server tienen la protección CSRF más estricta por defecto.
La base del código del profesor sigue siendo válida — solo cambian estos detalles menores.

---

## 2. Cómo probarlo correctamente

Toda petición a GraphQL debe hacerse desde **Postman** u otro cliente HTTP con:

```
POST   http://localhost:3000/graphql
Content-Type: application/json
Authorization: Bearer <tu_token>
```

Body:
```json
{
  "query": "query { users { id email } }"
}
```

| Escenario | Resultado |
|---|---|
| Sin token | `Token needed` — bloqueado antes del resolver |
| Token inválido | `Token not valid` — bloqueado antes del resolver |
| Token válido | Acceso normal + Guards por rol encima |

---

## 3. Fix para que Apollo Sandbox funcione en el navegador

Agrega `csrfPrevention: false` en la configuración de `GraphQLModule`:

```typescript
GraphQLModule.forRootAsync({
  driver: ApolloDriver,
  imports: [AuthModule],
  inject: [JwtService],
  useFactory: async (jwtService: JwtService) => ({
    playground: false,
    autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    plugins: [ApolloServerPluginLandingPageLocalDefault],

    // Desactiva la protección CSRF para que Apollo Sandbox
    // pueda hacer la introspección inicial desde el navegador.
    // Solo relevante en desarrollo — en producción el Sandbox no se expone.
    csrfPrevention: false,

    context({ req }) {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) throw Error('Token needed');
      const payload = jwtService.decode(token);
      if (!payload) throw Error('Token not valid');
    },
  }),
}),
```

---

## 4. forRoot vs forRootAsync — cuándo usar cada uno

Este fue el cambio principal en `AppModule` para proteger el schema:

```typescript
// ❌ Antes — configuración síncrona, no puede inyectar servicios
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  plugins: [ApolloServerPluginLandingPageLocalDefault()],
})

// ✅ Ahora — configuración asíncrona, puede inyectar JwtService
GraphQLModule.forRootAsync({
  driver: ApolloDriver,
  imports: [AuthModule],   // hace disponible JwtService en este contexto
  inject: [JwtService],    // inyecta JwtService en la factory function
  useFactory: async (jwtService: JwtService) => ({
    // aquí ya puedes usar jwtService
  }),
})
```

`forRootAsync` fue necesario porque necesitamos `JwtService` dentro de la configuración
de GraphQL para validar el token en el `context()`. Un módulo no puede inyectar
servicios de forma síncrona — por eso existe el patrón `forRootAsync` + `useFactory`.

---

## 5. El export en AuthModule

Para que `JwtService` esté disponible fuera de `AuthModule` fue necesario exportarlo:

```typescript
// auth.module.ts
@Module({
  providers: [AuthResolver, AuthService, JwtStrategy],
  imports: [ConfigModule, PassportModule, JwtModule],
  exports: [JwtStrategy, PassportModule, JwtModule], // ← esto
})
export class AuthModule {}
```

Sin este export, `AppModule` no podría inyectar `JwtService` aunque importe `AuthModule`.
En NestJS los providers de un módulo son privados por defecto —
solo se comparten si se exportan explícitamente.

---

## Resumen

> El schema protegido funciona correctamente.
> El error en el navegador era Apollo Sandbox chocando con CSRF — no un bug en el código.
> La solución es `csrfPrevention: false` para desarrollo, o simplemente probar con Postman.