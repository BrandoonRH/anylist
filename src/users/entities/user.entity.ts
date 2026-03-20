import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Item } from 'src/items/entities/item.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'users' })
@ObjectType()
export class User {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id: string;

  @Column()
  @Field(() => String)
  fullName: string;

  @Column({ unique: true })
  @Field(() => String)
  email: string;

  @Column()
  // @Field(() => String)
  password: string;

  @Column({
    type: 'text',
    array: true,
    default: ['user'],
  })
  @Field(() => [String])
  roles: string[];

  @Column({
    type: 'boolean',
    default: true,
  })
  @Field(() => Boolean)
  isActive: boolean;

  //? https://orkhan.gitbook.io/typeorm/docs/docs/relations/5-eager-and-lazy-relations 🔗🌐
  // Relación ManyToOne a la MISMA tabla (auto-referencia):
  // Muchos usuarios pueden haber sido modificados por un mismo admin.
  // El primer argumento () => User apunta a la misma entidad.
  // El segundo (user) => user.lastUpdateBy define la propiedad inversa de la relación.
  @ManyToOne(() => User, (user) => user.lastUpdateBy, {
    nullable: true, // La columna acepta NULL — usuarios nuevos no tienen lastUpdateBy todavía.
    lazy: true, // La relación NO se carga automáticamente con cada consulta.
    // Solo se resuelve cuando se accede a la propiedad explícitamente.
    // Evita cargar el usuario admin en cada query donde no se necesita.
  })
  @JoinColumn({ name: 'lastUpdateBy' }) // Nombre exacto de la columna FK en Postgres.
  @Field(() => User, { nullable: true }) // Expone la relación en el esquema GraphQL como nullable.
  lastUpdateBy?: User;

  @OneToMany( () => Item, (item) => item.user, { lazy: true })
  @Field( () => [Item] )
  items: Item[];

  /*
   * ¿QUÉ ES lazy: true?
   * --------------------
   * Por defecto TypeORM carga las relaciones de forma eager (inmediata) o
   * hay que pedirlas con { relations: { lastUpdateBy: true } } en cada query.
   *
   * Con lazy: true la relación retorna una Promise — TypeORM solo ejecuta
   * el SELECT adicional cuando el código accede a la propiedad y la resuelve.
   * En GraphQL esto encaja perfectamente: el campo solo se consulta en BD
   * si el cliente lo pide en su query. Si no lo pide, la Promise nunca se resuelve
   * y no hay consulta extra a la BD.
   *
   * SIN lazy (eager):
   *   SELECT * FROM users             ← consulta principal
   *   SELECT * FROM users WHERE id=X  ← siempre, aunque el cliente no pidiera lastUpdateBy
   *
   * CON lazy: true:
   *   SELECT * FROM users             ← consulta principal
   *   SELECT * FROM users WHERE id=X  ← solo si el cliente pidió el campo lastUpdateBy
   */
}
