import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { UserSession } from './user-session.entity';
import { PasswordReset } from './password-reset.entity';
import { House } from 'src/houses/houses.entity';
import { UserProfile } from './user-profile.entity';
import { UserRole } from './user-roles.entity';
import { Broker } from 'src/brokers/broker.entity';
import { Bookmark } from 'src/bookmarks/bookmark.entity';
import { Notification } from 'src/notifications/notification.entity';

export type UserStatus = 'active' | 'blocked' | 'deleted' | 'pending';

@Unique(['email'])
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: false })
  email: string;

  @OneToOne(() => Broker, (broker) => broker.user)
  broker?: Broker;

  @Column({ type: 'text', nullable: true })
  hashedPassword?: string | null;

  @Column({ type: 'boolean', nullable: false, default: false })
  isVerified: boolean;

  @Column({ type: 'varchar', nullable: true })
  hashedOTP?: string | null;

  @Column({ type: 'varchar', nullable: true })
  provider?: string | null;

  @Column({ type: 'varchar', nullable: true })
  providerId?: string | null;

  @Column({
    type: 'enum',
    enum: ['active', 'blocked', 'deleted', 'pending'],
    default: 'active',
  })
  status: UserStatus;

  // Relations
  @OneToMany(() => UserSession, (session) => session.user)
  sessions: Relation<UserSession[]>;

  @OneToMany(() => PasswordReset, (reset) => reset.user)
  passwordResets: Relation<PasswordReset[]>;

  @OneToOne(() => UserProfile, (profile) => profile.user, {
    cascade: true,
    nullable: true,
    eager: true,
  })
  profile?: Relation<UserProfile> | null;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: Relation<UserRole[]>;

  @OneToMany(() => House, (house) => house.user, { eager: true })
  houses: Relation<House>;

  @OneToMany(() => Bookmark, (bookmark) => bookmark.user, { eager: true })
  bookmarks: Relation<Bookmark[]>;

  @OneToMany(() => Notification, (notification) => notification.user, {
    eager: true,
  })
  notifications?: Relation<Notification[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
