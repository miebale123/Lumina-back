import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/roles.entity';
import { User } from './entities/user.entity';
import { Broker } from 'src/brokers/broker.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Broker) // optional
    private readonly brokerRepo: Repository<Broker>,
  ) {}

  async findRole(roleName: string): Promise<Role | null> {
    return this.roleRepo.findOne({ where: { name: roleName } });
  }

  async createRole(roleName: string): Promise<Role> {
    const role = this.roleRepo.create({
      name: roleName,
      description: `${roleName} role`,
    });
    return this.roleRepo.save(role);
  }

  // Optional: assign broker entity if user i                                           s given broker role
  async assignBrokerRole(user: User, location: string) {
    const existing = await this.brokerRepo.findOne({
      where: { user: { id: user.id } },
    });
    if (existing) return existing;

    const broker = this.brokerRepo.create({
      user,
      location,
    });

    return this.brokerRepo.save(broker);
  }
}
