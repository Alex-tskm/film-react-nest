import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { ScheduleEntity } from './schedule.entity';

@Entity('films')
export class FilmEntity {
  @PrimaryColumn({
    name: 'id',
    type: 'uuid',
    default: () => 'uuid_generate_v4()',
  })
  id: string;

  @Column({ name: 'rating', type: 'double precision' })
  rating: number;

  @Column({ name: 'director', type: 'varchar' })
  director: string;

  @Column({ name: 'tags', type: 'simple-array' })
  tags: string[];

  @Column({ name: 'image', type: 'varchar' })
  image: string;

  @Column({ name: 'cover', type: 'varchar' })
  cover: string;

  @Column({ name: 'title', type: 'varchar' })
  title: string;

  @Column({ name: 'about', type: 'varchar' })
  about: string;

  @Column({ name: 'description', type: 'varchar' })
  description: string;

  @OneToMany(() => ScheduleEntity, (schedule) => schedule.film)
  schedule: ScheduleEntity[];
}
