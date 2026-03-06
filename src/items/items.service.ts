import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateItemInput } from './dto/inputs/create-item.input';
import { UpdateItemInput } from './dto/inputs/update-item.input';
import { Item } from './entities/item.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ItemsService {

  // @InjectRepository inyecta el repositorio de TypeORM para la entidad Item.
  // Repository<Item> es la interfaz que provee TypeORM con todos los métodos
  // de acceso a BD: find, findOneBy, save, remove, preload, etc.
  // Es el reemplazo del array privado que usábamos en la sección anterior.
  constructor(
    @InjectRepository(Item)
    private readonly itemsRepository: Repository<Item>,
  ) {}

  async create(createItemInput: CreateItemInput): Promise<Item> {
    // .create() genera una instancia de Item con los datos del input.
    // No persiste nada aún — solo prepara el objeto.
    const newItem = this.itemsRepository.create(createItemInput);
    // .save() ejecuta el INSERT en Postgres y retorna la entidad con id generado.
    return await this.itemsRepository.save(newItem);
  }

  async findAll(): Promise<Item[]> {
    // .find() sin argumentos equivale a SELECT * FROM items.
    return this.itemsRepository.find();
  }

  async findOne(id: string): Promise<Item> {
    // .findOneBy() equivale a SELECT * FROM items WHERE id = $1.
    const item = await this.itemsRepository.findOneBy({ id })
    if (!item) throw new NotFoundException(`Item with id: ${id} not found`);
    return item;
  }

  async update(id: string, updateItemInput: UpdateItemInput): Promise<Item> {
    // .preload() busca la entidad en BD por id y la fusiona con los nuevos datos.
    // Si el id no existe, retorna undefined — de ahí el check siguiente.
    // Es el equivalente elegante de: findOne() + Object.assign() + save().
    const item = await this.itemsRepository.preload(updateItemInput);
    if (!item) throw new NotFoundException(`Item with id: ${id} not found`);
    return this.itemsRepository.save(item);
  }

  async remove(id: string): Promise<Item> {
    const item = await this.findOne(id);
    // .remove() ejecuta el DELETE en Postgres.
    // Después del remove, el objeto pierde su id — por eso se retorna
    // un spread con el id original para no devolver un objeto sin él.
    await this.itemsRepository.remove(item);
    return { ...item, id };
  }
}