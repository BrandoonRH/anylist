import { join } from 'path';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ItemsModule } from './items/items.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    // Carga las variables de entorno desde el archivo .env
    // Equivalente a dotenv en proyectos Express sin NestJS
    ConfigModule.forRoot(),

    // Configuración global de la conexión a PostgreSQL.
    // forRoot() aplica para toda la app — solo se declara una vez aquí.
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT!,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [],
      // synchronize: TypeORM ajusta las tablas en BD automáticamente
      // según los cambios en las entidades. Solo para desarrollo —
      // en producción se usan migrations para no perder datos.
      synchronize: true,
      // autoLoadEntities: en lugar de listar cada entidad manualmente
      // en entities[], NestJS las registra solas cuando se usa
      // TypeOrmModule.forFeature() en cada módulo.
      autoLoadEntities: true,
    }),

    // Configuración de GraphQL — igual que en la sección anterior.
    // GraphQL no sabe nada de Postgres, solo expone el esquema al cliente.
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: false,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
    }),
    ItemsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}