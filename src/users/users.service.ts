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

  async findAll(): Promise<User[]> {
    return []; // TODO: implementar con filtros por usuario
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

  update(id: number, updateUserInput: UpdateUserInput) {
    return `This action updates a #${id} user`;
  }

  async block(id: string): Promise<User> {
    throw new Error('Method not implemented');
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