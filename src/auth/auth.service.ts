import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthResponse } from './types/auth-response.types';
import { LoginInput, SignupInput } from './dto/inputs';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    // JwtService es inyectado por JwtModule — provee el método .sign()
    // para generar tokens y .verify() para verificarlos.
    private readonly jwtService: JwtService,
  ) {}

  // Método privado reutilizable — genera un JWT con el id del usuario como payload.
  // Solo el id viaja en el token, no datos sensibles como email o roles.
  // En cada request, JwtStrategy recupera el usuario completo de la BD con ese id.
  private getJwtToken(userId: string) {
    return this.jwtService.sign({ id: userId });
  }

  async signup(signupInput: SignupInput): Promise<AuthResponse> {
    // La creación del usuario y el hash de la contraseña ocurren en UsersService.
    // AuthService solo orquesta: crea el usuario y genera su token inicial.
    const user = await this.usersService.create(signupInput);
    return {
      token: this.getJwtToken(user.id),
      user,
    };
  }

  async login(loginInput: LoginInput): Promise<AuthResponse> {
    const { email, password } = loginInput;
    const user = await this.usersService.findOneByEmail(email);

    // bcrypt.compareSync compara la contraseña en texto plano con el hash en BD.
    // Nunca se desencripta el hash — bcrypt rehashea el texto plano y compara resultados.
    if (!bcrypt.compareSync(password, user.password)) {
      throw new BadRequestException('Email / Password do not match');
    }

    const token = this.getJwtToken(user.id);
    return { token, user };
  }

  // validateUser es llamado por JwtStrategy.validate() en cada request autenticado.
  // Su responsabilidad: verificar que el usuario del token sigue activo en el sistema.
  // Un token puede ser criptográficamente válido pero el usuario puede estar bloqueado.
  async validateUser(id: string): Promise<User> {
    const user = await this.usersService.findOneById(id);

    if (!user.isActive) {
      throw new UnauthorizedException(`User is inactive, talk with an admin`);
    }
    // Se elimina la contraseña del objeto antes de adjuntarlo al request.
    // Así user.password nunca viaja en el contexto de un request autenticado.
    //@ts-ignore
    delete user.password;
    return user;
  }

  // Revalidar es simplemente generar un token nuevo para un usuario que ya está autenticado.
  // No consulta la BD — el usuario ya viene validado del Guard y del decorador @CurrentUser.
  revalidateToken(user: User): AuthResponse {
    const token = this.getJwtToken(user.id);
    return { token, user };
  }
}