import { CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Broker } from 'src/brokers/broker.entity';
import { Notification } from '../notifications/notification.entity';
import { Bookmark } from 'src/bookmarks/bookmark.entity';

@Entity('houses')
export class House {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  secure_url: string;

  @Column()
  location: string;

  @Column({ type: 'decimal', nullable: true })
  previousPrice: number | null;

  @Column({ type: 'decimal' })
  price: number;

  @Column({ default: false })
  priceReduced: boolean;

  @Column()
  bedroom: number;

  @Column()
  bathroom: number;

  @Column()
  area: string;

  @ManyToOne(() => Broker, (broker) => broker.houses, { nullable: true })
  assignedBroker?: Relation<Broker> | null;

  @Column({
    type: 'enum',
    enum: [
      'pending',
      'approved',
      'rejected',
      'pending_edit',
      'pending_initial',
    ],
    default: 'pending',
  })
  status: 'pending_initial' | 'pending_edit' | 'approved' | 'rejected';

  @OneToMany(() => Bookmark, (bookmark) => bookmark.house)
  bookmarks: Bookmark[];

  @OneToMany(() => Notification, (notification) => notification.house)
  notifications: Notification[];

  @ManyToOne(() => User, (user) => user.houses, { nullable: false })
  user!: Relation<User>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
