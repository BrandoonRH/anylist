import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput, SignupInput } from './dto/inputs';
import { AuthResponse } from './types/auth-response.types';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from 'src/users/entities/user.entity';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  // Mutation pública — no lleva @UseGuards porque cualquiera puede registrarse.
  // Retorna AuthResponse: el usuario creado + su token JWT listo para usar.
  @Mutation(() => AuthResponse, { name: 'signup' })
  async signup(
    @Args('signupInput') signupInput: SignupInput,
  ): Promise<AuthResponse> {
    return this.authService.signup(signupInput);
  }

  // Mutation pública — tampoco requiere token, es el punto de entrada al sistema.
  // Retorna el mismo AuthResponse: usuario + token.
  @Mutation(() => AuthResponse, { name: 'login' })
  async login(
    @Args('loginInput') loginInput: LoginInput,
  ): Promise<AuthResponse> {
    return this.authService.login(loginInput);
  }

  // @UseGuards(JwtAuthGuard) protege esta query — solo usuarios autenticados pueden ejecutarla.
  // El guard intercepta el request, extrae el token del header Authorization,
  // verifica la firma y llama a JwtStrategy.validate() antes de llegar aquí.
  @Query(() => AuthResponse, { name: 'revalidate' })
  @UseGuards(JwtAuthGuard)
  revalidateToken(
    // @CurrentUser extrae el usuario que JwtStrategy.validate() adjuntó al request.
    // No hay consulta a BD aquí — el usuario ya viene en el contexto del request.
    // Los roles comentados muestran cómo se extendería para autorización por rol.
    @CurrentUser(/**[ ValidRoles.admin ]*/) user: User,
  ): AuthResponse {
    return this.authService.revalidateToken(user);
  }
}