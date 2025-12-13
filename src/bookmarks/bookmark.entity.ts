import { CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import {  Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { House } from 'src/houses/houses.entity';

@Entity('bookmarks')
export class Bookmark {
  @PrimaryGeneratedColumn()
  id: string;

  @ManyToOne(() => House, (house) => house.bookmarks, { onDelete: 'CASCADE' })
  house: House;

  @ManyToOne(() => User, (user) => user.bookmarks, { nullable: false })
  user: Relation<User>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
