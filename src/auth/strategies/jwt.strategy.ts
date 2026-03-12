import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../../users/entities/user.entity';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

// JwtStrategy es la pieza que Passport ejecuta automáticamente
// cada vez que llega un request con un token JWT.
// Hereda de PassportStrategy(Strategy) donde Strategy es la implementación
// JWT de passport-jwt. El nombre 'jwt' queda registrado como estrategia disponible.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    ConfigService: ConfigService,
  ) {
    // super() configura cómo Passport debe extraer y verificar el token.
    super({
      // La misma clave secreta usada para firmar — si no coincide, el token es inválido.
      secretOrKey: ConfigService.get('JWT_SECRET')!,
      // Le dice a Passport dónde buscar el token en el request:
      // en el header Authorization como "Bearer <token>".
      // Esta es la forma estándar en APIs.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  // validate() se ejecuta automáticamente después de que Passport
  // verifica la firma y expiración del token.
  // El payload es lo que se guardó dentro del token al momento de firmarlo.
  // Lo que retorne este método se adjunta al request como req.user —
  // así está disponible en el Resolver a través del decorador @CurrentUser.
  async validate(payload: JwtPayload): Promise<User> {
    const { id } = payload;
    // Se consulta la BD para verificar que el usuario sigue existiendo
    // y que su cuenta está activa. El token puede ser válido pero el
    // usuario pudo haber sido desactivado después de que se emitió.
    const user = await this.authService.validateUser(id);
    return user;
  }
}