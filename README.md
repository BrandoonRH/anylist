# Anylist API — NestJS + GraphQL + PostgreSQL

> Segundo proyecto del curso **Nest + GraphQL: Evoluciona tus APIs** impartido por **Fernando Herrera**.

CRUD de ítems conectado a una base de datos real con PostgreSQL y TypeORM, como continuación de los fundamentos de GraphQL vistos en la sección introductoria.

---

## Requisitos

- Node.js v18+
- npm
- PostgreSQL corriendo localmente o en Docker

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto basándote en `.env.template`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_NAME=anylistdb
```

---

## Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Levantar en modo desarrollo (watch)
npm run start:dev
```

El servidor estará disponible en `http://localhost:3000/graphql` con Apollo Sandbox.

---

## Stack utilizado

- **NestJS** — framework principal
- **GraphQL** con Apollo Server — capa de comunicación con el cliente
- **TypeORM** — ORM para interactuar con la base de datos
- **PostgreSQL** — base de datos relacional
- **class-validator** — validación de inputs

---

## Lo que se aprendió en esta sección

### GraphQL no se conecta a la base de datos

El aprendizaje más importante: GraphQL es únicamente la capa de comunicación con el cliente. No sabe que Postgres existe. Las consultas a BD se hacen exactamente igual que en una API REST — GraphQL solo define el contrato de qué se puede pedir y cómo.

```
Cliente  →  Resolver (GraphQL)  →  Service  →  TypeORM  →  PostgreSQL
```

### forRoot vs forFeature

`TypeOrmModule.forRoot()` configura la conexión global en `AppModule`. `TypeOrmModule.forFeature([Entidad])` registra qué entidades maneja cada módulo y habilita la inyección del `Repository` en el Service correspondiente.

### La entidad como punto de fusión

Una sola clase cumple dos roles simultáneamente:

```typescript
@Entity({ name: 'items' }) // TypeORM → tabla en Postgres
@ObjectType() // GraphQL → tipo de respuesta en el esquema
export class Item {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field(() => String)
  name: string;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  quantityUnits?: string;
}
```

Regla: `nullable` debe coincidir en ambas capas. Si la columna acepta NULL en Postgres, el campo debe ser nullable en GraphQL también.

### PartialType para el UpdateInput

Genera automáticamente todos los campos de un InputType como opcionales, sin repetirlos manualmente:

```typescript
@InputType()
export class UpdateItemInput extends PartialType(CreateItemInput) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}
```

### El tipo ID de GraphQL

Para claves primarias y UUIDs se usa `() => ID` en lugar de `() => String`. Semánticamente indica que es un identificador único — Apollo Client lo usa para normalización de caché automática.

### Pipes en el Resolver

Los Pipes de NestJS funcionan igual en GraphQL que en REST:

```typescript
@Query(() => Item)
findOne(
  @Args('id', { type: () => ID }, ParseUUIDPipe) id: string
): Promise<Item> {
  return this.itemsService.findOne(id);
}
```

---

## Estructura del proyecto

```
src/
├── items/
│   ├── dto/
│   │   ├── args/
│   │   └── inputs/
│   │       ├── create-item.input.ts
│   │       ├── update-item.input.ts
│   │       └── index.ts
│   ├── entities/
│   │   └── item.entity.ts
│   ├── items.module.ts
│   ├── items.resolver.ts
│   └── items.service.ts
├── app.module.ts
├── main.ts
└── schema.gql
```
