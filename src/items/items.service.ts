import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateItemInput } from './dto/inputs/create-item.input';
import { UpdateItemInput } from './dto/inputs/update-item.input';
import { Item } from './entities/item.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

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

  async create(createItemInput: CreateItemInput, user: User): Promise<Item> {
    // .create() genera una instancia de Item con los datos del input.
    // No persiste nada aún — solo prepara el objeto.
    const newItem = this.itemsRepository.create({...createItemInput, user});
    // .save() ejecuta el INSERT en Postgres y retorna la entidad con id generado.
    return await this.itemsRepository.save(newItem);
  }

  async findAll(user: User): Promise<Item[]> {
    'SELECT * FROM items WHERE userId = "uuid-user" '
    return this.itemsRepository.find({
      where: {
        user: {
          id: user.id
        }
      }
    });
  }

  async findOne(id: string, user: User): Promise<Item> {
    // .findOneBy() equivale a SELECT * FROM items WHERE id = $1.
    /* const itenm = await this.itemsRepository.findOneBy({
      user: {
        id: user.id
      }
    }) */
    const item = await this.itemsRepository.findOneBy({ id }); 
    if (!item) throw new NotFoundException(`Item with id: ${id} not found`);
    if(item.user.id !== user.id) throw new ConflictException('No tienes permisos para ver este Item')
    return item;
  }

  async update(id: string, updateItemInput: UpdateItemInput, user: User ): Promise<Item> {

    await this.findOne( id, user );
    //? const item = await this.itemsRepository.preload({ ...updateItemInput, user });
    const item = await this.itemsRepository.preload( updateItemInput );

    if ( !item ) throw new NotFoundException(`Item with id: ${ id } not found`);

    return this.itemsRepository.save( item );

  }

  async remove(id: string, user: User): Promise<Item> {
    const item = await this.findOne(id, user);
    // .remove() ejecuta el DELETE en Postgres.
    // Después del remove, el objeto pierde su id — por eso se retorna
    // un spread con el id original para no devolver un objeto sin él.
    await this.itemsRepository.remove(item);
    return { ...item, id };
  }

  async itemCountByUser( user: User ): Promise<number> {
    
    return this.itemsRepository.count({
      where: {
        user: {
          id: user.id
        }
      }
    })

  }
}