import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { FilmEntity } from './film.entity';

@Entity('schedules')
export class ScheduleEntity {
  @PrimaryColumn({
    name: 'id',
    type: 'uuid',
    default: () => 'uuid_generate_v4()',
  })
  id: string;

  @Column({ name: 'daytime', type: 'varchar' })
  daytime: string;

  @Column({ name: 'hall', type: 'integer' })
  hall: number;

  @Column({ name: 'rows', type: 'integer' })
  rows: number;

  @Column({ name: 'seats', type: 'integer' })
  seats: number;

  @Column({ name: 'price', type: 'double precision' })
  price: number;

  @Column({
    name: 'taken',
    type: 'text',
    nullable: false,
    default: "''",
  })
  taken: string;

  @ManyToOne(() => FilmEntity, (film) => film.schedule)
  @JoinColumn({ name: 'filmId' })
  film: FilmEntity;
}
