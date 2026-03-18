import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { ValidRolesArgs } from './dto/args/roles.arg';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  // Por ahora retorna array vacío — pendiente de implementar filtros por usuario.
  /*  @Query(() => [User], { name: 'users' })
  findAll(
    @Args() roles: ValidRolesArgs
  ): Promise<User[]> {

    console.log({roles})
    return this.usersService.findAll();
  } */

  @Query(() => [User], { name: 'users' })
  async findAll(
    @Args() validRoles: ValidRolesArgs,
    /* @CurrentUser([ValidRoles.admin, ValidRoles.superUser]) user: User, */
  ): Promise<User[]> {
    const users = await this.usersService.findAll(validRoles.roles);
    console.log(users);
    return this.usersService.findAll(validRoles.roles);
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => ID }) id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  // updateUser comentado — pendiente de implementar.
  // blockUser es un soft-delete: no elimina el usuario de la BD,
  // solo marca isActive = false. Patrón común para preservar integridad referencial.
  @Mutation(() => User)
  blockUser(@Args('id', { type: () => ID }) id: string): Promise<User> {
    return this.usersService.block(id);
  }
}
