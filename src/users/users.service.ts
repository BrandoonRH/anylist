import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './entities/user.entity';
import { SignupInput } from 'src/auth/dto/inputs';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'node_modules/bcryptjs';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';

@Injectable()
export class UsersService {
  // Logger de NestJS — registra errores con contexto ('UsersService').
  // Mejor que console.log porque incluye timestamp, nivel de log y se puede desactivar por entorno.
  private logger = new Logger('UsersService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(signupInput: SignupInput): Promise<User> {
    try {
      const newUser = this.userRepository.create({
        ...signupInput,
        // La contraseña se hashea aquí antes de persistir.
        // bcrypt.hashSync(password, 10): el 10 es el salt rounds —
        // cuántas veces se procesa el hash. A mayor número, más seguro pero más lento.
        // 10 es el estándar recomendado para producción.
        password: bcrypt.hashSync(signupInput.password, 10),
      });
      return await this.userRepository.save(newUser);
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async findAll(roles: ValidRoles[]): Promise<User[]> {
    if (roles.length === 0)
      return this.userRepository.find({
        // TODO: No es necesario porque tenemos lazy la propiedad lastUpdateBy
        // relations: {
        //   lastUpdateBy: true
        // }
      });

    // ??? tenemos roles ['admin','superUser']
    return this.userRepository
      .createQueryBuilder()
      .andWhere('ARRAY[roles] && ARRAY[:...roles]')
      .setParameter('roles', roles)
      .getMany();
  }

  async findOneByEmail(email: string): Promise<User> {
    try {
      // findOneByOrFail lanza automáticamente si no encuentra el registro,
      // sin necesidad de verificar manualmente si el resultado es null.
      return await this.userRepository.findOneByOrFail({ email });
    } catch (error) {
      throw new NotFoundException(`${email} not found`);
    }
  }

  async findOneById(id: string): Promise<User> {
    try {
      return await this.userRepository.findOneByOrFail({ id });
    } catch (error) {
      throw new NotFoundException(`${id} not found`);
    }
  }

  async findOne(id: string): Promise<User> {
    throw new Error('Method not implemented');
  }

  async update(
    id: string,
    updateUserInput: UpdateUserInput,
    updateBy: User,
  ): Promise<User> {
    try {
      // preload() es el método más elegante de TypeORM para updates.
      // Hace dos cosas en una sola llamada:
      //   1. Busca la entidad en BD por el id que encuentre en el objeto.
      //   2. Fusiona los nuevos valores sobre la entidad encontrada.
      // Si el id no existe en BD, retorna undefined.
      // Si existe, retorna la entidad con los campos actualizados listos para guardar.
      //
      // Sin preload harías:
      //   const user = await this.userRepository.findOneBy({ id });
      //   Object.assign(user, updateUserInput);
      //   return this.userRepository.save(user);
      //
      // Con preload todo eso es una línea.
      const user = await this.userRepository.preload({
        ...updateUserInput,
        id,
      });

      if (!user) throw new BadRequestException('Error en update User');

      // Se registra quién realizó la modificación.
      // Este campo se persiste como FK en la columna lastUpdateBy de la tabla users.
      user.lastUpdateBy = updateBy;

      return await this.userRepository.save(user);
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async block(id: string, adminUser: User): Promise<User> {
    const userToBlock = await this.findOneById(id);

    // Soft delete: solo se cambia el flag isActive.
    // El registro permanece en BD con todos sus datos intactos.
    userToBlock.isActive = false;
    // Se registra qué admin realizó el bloqueo.
    userToBlock.lastUpdateBy = adminUser;

    return await this.userRepository.save(userToBlock);
  }

  // Centraliza el manejo de errores de BD en un solo lugar.
  // Retorna never — significa que este método siempre lanza una excepción, nunca retorna.
  // El código 23505 es el código de Postgres para violación de unique constraint
  // (ej: email duplicado).
  private handleDBErrors(error: any): never {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail.replace('Key', ''));
    }
    if (error.code == 'error-001') {
      throw new BadRequestException(error.detail.replace('Key', ''));
    }
    this.logger.error(error);
    throw new InternalServerErrorException('Please check server logs');
  }
}
