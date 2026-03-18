import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { UsersModule } from 'src/users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  providers: [AuthResolver, AuthService, JwtStrategy],
  exports: [ JwtStrategy, PassportModule, JwtModule ],
  imports: [
    ConfigModule,

    // Registra Passport con JWT como estrategia por defecto.
    // Passport es el middleware de autenticación más popular en Node.js —
    // NestJS lo integra con @nestjs/passport como una capa encima.
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // registerAsync permite configurar el módulo de forma asíncrona,
    // inyectando ConfigService para leer variables de entorno.
    // No se puede usar process.env directamente aquí porque el módulo
    // se inicializa antes de que ConfigModule termine de cargar.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // La clave secreta con la que se firman y verifican los tokens.
        // Si esta clave se compromete, todos los tokens existentes son inválidos.
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          // El token expira en 4 horas — después el cliente debe revalidar o loguearse de nuevo.
          expiresIn: '4h',
        },
      }),
    }),

    // Se importa UsersModule para poder usar UsersService dentro de AuthService.
    // UsersModule debe exportar UsersService para que sea accesible aquí.
    UsersModule,
  ],
})
export class AuthModule {}