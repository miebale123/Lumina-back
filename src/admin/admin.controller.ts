import {
  Controller,
  Body,
  UseGuards,
  Patch,
  Param,
  Get,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UsersService } from 'src/users/users.service';
import { RolesService } from 'src/users/roles.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Broker } from 'src/brokers/broker.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/users/entities/user-roles.entity';
import { Public } from 'src/common';

class BrokerDto {
  roleName: string;
  brokerCompanyName: string;
  location: string;
}

@UseGuards(RolesGuard)
@Roles('admin')
@Controller('admin-page')
export class AdminController {
  constructor(
    private readonly rolesService: RolesService,

    @InjectRepository(Broker)
    private readonly brokerRepo: Repository<Broker>,

    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
  ) {}

  @Get('pendingBrokers')
  async getpendingBrokers() {
    return this.brokerRepo.find({
      where: { status: 'pending',  },
      relations: ['user'],
    });
  }

  @Patch('pendingBrokers/:id/approve')
  async approveBroker(@Param('id') brokerId: string) {
    const broker = await this.brokerRepo.findOne({
      where: { id: brokerId },
      relations: ['user'],
    });

    if (!broker) throw new NotFoundException('Broker not found');

    broker.status = 'active';

    const roleName = 'expert';
    let role = await this.rolesService.findRole(roleName);
    if (!role) {
      role = await this.rolesService.createRole(roleName);
    }

    const userRole = this.userRoleRepo.create({
      user: broker.user,
      role,
    });

    await this.userRoleRepo.save(userRole);

    return await this.brokerRepo.save(broker);
  }
}
