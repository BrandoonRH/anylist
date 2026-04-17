import { Module } from '@nestjs/common';
import { ListService } from './list.service';
import { ListResolver } from './list.resolver';
import { Type } from 'class-transformer';
import { List } from './entities/list.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  providers: [ListResolver, ListService],
  imports: [TypeOrmModule.forFeature([List])],
  exports: [ListService, TypeOrmModule],
})
export class ListModule {}
