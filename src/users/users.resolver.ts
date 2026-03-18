import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { ValidRolesArgs } from './dto/args/roles.arg';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateUserInput } from './dto/update-user.input';

// @UseGuards a nivel de clase protege TODAS las queries y mutations de este resolver.
// Es más limpio que decorar método por método cuando todos requieren autenticación.
// Equivalente en REST: aplicar un guard global a todo el controller.
@Resolver(() => User)
@UseGuards(JwtAuthGuard)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  // @CurrentUser([ValidRoles.admin, ValidRoles.superUser]) hace dos cosas:
  // 1. Extrae el usuario autenticado del contexto del request.
  // 2. Verifica que tenga al menos uno de los roles requeridos.
  //    Si no los tiene, lanza ForbiddenException antes de ejecutar el método.
  // ValidRolesArgs permite filtrar usuarios por rol desde el cliente:
  //   query { users(roles: [admin]) { ... } }
  @Query(() => [User], { name: 'users' })
  async findAll(
    @Args() validRoles: ValidRolesArgs,
    @CurrentUser([ValidRoles.admin, ValidRoles.superUser]) user: User,
  ): Promise<User[]> {
    return this.usersService.findAll(validRoles.roles);
  }

  @Query(() => User, { name: 'user' })
  findOne(
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
    @CurrentUser([ValidRoles.admin, ValidRoles.superUser]) user: User,
  ): Promise<User> {
    return this.usersService.findOneById(id);
  }

  // Solo admins pueden actualizar usuarios.
  // El usuario autenticado (user) se pasa al service para registrar
  // quién hizo el cambio en el campo lastUpdateBy.
  @Mutation(() => User, { name: 'updateUser' })
  async updateUser(
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
    @CurrentUser([ValidRoles.admin]) user: User,
  ): Promise<User> {
    return this.usersService.update(updateUserInput.id, updateUserInput, user);
  }

  // Soft delete — no elimina el registro de la BD.
  // Solo marca isActive = false y registra quién lo bloqueó en lastUpdateBy.
  // Preserva la integridad referencial: otros registros pueden seguir apuntando al usuario.
  @Mutation(() => User, { name: 'blockUser' })
  blockUser(
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
    @CurrentUser([ValidRoles.admin]) user: User,
  ): Promise<User> {
    return this.usersService.block(id, user);
  }
}