import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ItemsService } from './items.service';
import { Item } from './entities/item.entity';
import { CreateItemInput, UpdateItemInput } from './dto/inputs';
import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { User } from 'src/users/entities/user.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

// @Resolver recibe el ObjectType que este resolver maneja.
// Es opcional pero buena práctica — le da contexto a NestJS
// y es necesario cuando se usen @ResolveField() más adelante.
@Resolver(() => Item)
@UseGuards(JwtAuthGuard)
export class ItemsResolver {
  constructor(private readonly itemsService: ItemsService) {}

  @Mutation(() => Item, { name: 'createItem' })
  async createItem(
    @Args('createItemInput') createItemInput: CreateItemInput,
    @CurrentUser() user: User,
  ): Promise<Item> {
    return this.itemsService.create(createItemInput, user);
  }

  @Query(() => [Item], { name: 'items' })
  async findAll(@CurrentUser() user: User): Promise<Item[]> {
    return this.itemsService.findAll(user);
  }

  @Query(() => Item, { name: 'item' })
  async findOne(
    // ID es el tipo escalar de GraphQL para identificadores únicos.
    // Se renderiza como String en el esquema pero semánticamente
    // indica que es un identificador, no texto arbitrario.
    // ParseUUIDPipe valida que el string sea un UUID válido
    // antes de que llegue al Service — igual que en REST.
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<Item> {
    return this.itemsService.findOne(id, user);
  }

  @Mutation(() => Item)
  updateItem(
    @Args('updateItemInput') updateItemInput: UpdateItemInput,
    @CurrentUser() user: User,
  ): Promise<Item> {
    return this.itemsService.update(updateItemInput.id, updateItemInput, user);
  }

  @Mutation(() => Item)
  removeItem(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: User,
  ): Promise<Item> {
    return this.itemsService.remove(id, user);
  }
}

/*
 * ============================================================
 * ITEMS RESOLVER — EXPLICACIÓN DETALLADA
 * ============================================================
 *
 * LA CONCLUSIÓN MÁS IMPORTANTE DE ESTA SECCIÓN
 * ----------------------------------------------
 * GraphQL no se conecta a la base de datos.
 * GraphQL no sabe que Postgres existe.
 * GraphQL es únicamente la capa de comunicación entre el cliente
 * y el backend — define el contrato de qué se puede pedir y cómo.
 *
 * El flujo real es:
 *
 *   Cliente GraphQL
 *       ↓  query / mutation
 *   Resolver  ← aquí vive GraphQL
 *       ↓  llama al método del service
 *   Service   ← aquí vive la lógica
 *       ↓  usa el repositorio
 *   TypeORM   ← aquí se genera el SQL
 *       ↓
 *   PostgreSQL ← aquí viven los datos
 *
 * GraphQL solo ocupa el primer escalón. Todo lo demás es
 * exactamente igual a como lo harías en una API REST.
 *
 *
 * COMPARATIVA CON REST
 * ---------------------
 *
 *  REST                          GraphQL
 *  ──────────────────────────────────────────────────────
 *  @Controller('items')          @Resolver(() => Item)
 *  @Get()                        @Query(() => [Item])
 *  @Get(':id')                   @Query(() => Item)
 *  @Post()                       @Mutation(() => Item)
 *  @Patch(':id')                 @Mutation(() => Item)
 *  @Delete(':id')                @Mutation(() => Item)
 *  @Param('id', ParseUUIDPipe)   @Args('id', {type:()=>ID}, ParseUUIDPipe)
 *  @Body() dto: CreateItemDto    @Args('createItemInput') input: CreateItemInput
 *
 *
 * EL TIPO ID EN GRAPHQL
 * ----------------------
 * GraphQL tiene cuatro tipos escalares base: String, Int, Float, Boolean.
 * ID es un quinto escalar especial que indica "esto es un identificador".
 * En el esquema generado se ve como String, pero semánticamente
 * le dice al cliente (y a herramientas como Apollo Client) que
 * este campo es una clave única — útil para caché y normalización.
 *
 *
 * PIPES EN GRAPHQL
 * -----------------
 * Los Pipes de NestJS (ParseUUIDPipe, ParseIntPipe, ValidationPipe...)
 * funcionan igual en GraphQL que en REST. Se pueden pasar como
 * tercer argumento de @Args() y se ejecutan antes de que el valor
 * llegue al método. Si el UUID no es válido, NestJS lanza el error
 * automáticamente sin que el código del resolver lo maneje.
 * ============================================================
 */