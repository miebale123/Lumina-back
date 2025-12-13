import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { AdminSeederService } from './admin-seeder.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/users/entities/user-roles.entity';
import { Role } from 'src/users/entities/roles.entity';
import { Broker } from 'src/brokers/broker.entity';

@Module({
  controllers: [AdminController],
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([User, UserRole, Role, Broker]),
  ],
  exports: [AdminSeederService],
  providers: [AdminSeederService],
})
export class AdminModule {}
