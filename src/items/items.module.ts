import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsResolver } from './items.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';

@Module({
  providers: [ItemsResolver, ItemsService],
  imports: [
    // forFeature() registra la entidad Item en el scope de este módulo.
    // Esto le dice a TypeORM qué tabla(s) puede manejar este módulo
    // e inyecta el Repository<Item> disponible para el Service.
    // Es el equivalente modular de forRoot() — uno configura la conexión,
    // el otro registra qué entidades usa cada módulo.
    TypeOrmModule.forFeature([Item])
  ], 
  exports: [ItemsService, TypeOrmModule]
})
export class ItemsModule {}