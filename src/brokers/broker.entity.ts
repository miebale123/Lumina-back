import { House } from 'src/houses/houses.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export type BrokerStatus = 'active' | 'blocked' | 'deleted' | 'pending';

@Entity('brokers')
export class Broker {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({
    type: 'enum',
    enum: ['active', 'blocked', 'deleted', 'pending'],
    default: 'active',
  })
  status?: BrokerStatus;

  @Column({ nullable: true })
  brokerCompanyName?: string;

  @Column({ nullable: true })
  secure_url?: string;

  @Column()
  location?: string; 

  @OneToMany(() => House, (house) => house.assignedBroker)
  houses: House[];

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
