import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { hash } from 'src/auth/bcrypt.util';
import { Role } from 'src/users/entities/roles.entity';
import { UserRole } from 'src/users/entities/user-roles.entity';

@Injectable()
export class AdminSeederService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
  ) {}

  async createDefaultAdmin() {
    const email = process.env.ADMIN_EMAIL!;
    const password = process.env.ADMIN_PASS!;

    console.log(password)

    // Check if admin user already exists
    let user = await this.userRepo.findOne({
      where: { email },
      relations: ['userRoles', 'userRoles.role'],
    });

    // If user already exists, just show roles and return
    if (user) {
      console.log(
        'Existing admin roles:',
        user.userRoles.map((r) => r.role.name),
      );
      return user;
    }

    // Create new admin user
    const hashedPassword = await hash(password);

    const newUser = this.userRepo.create({
      email,
      hashedPassword,
      status: 'active',
      isVerified: true,
    });

    user = await this.userRepo.save(newUser);

    // Ensure ADMIN role exists
    let adminRole = await this.roleRepo.findOne({ where: { name: 'admin' } });

    if (!adminRole) {
      adminRole = await this.roleRepo.save(
        this.roleRepo.create({
          name: 'admin',
          description: 'admin role',
        }),
      );
    }

    // Create the UserRole relation (using full entities!)
    const userRole = this.userRoleRepo.create({
      user,
      role: adminRole,
    });

    const savedUserRole = await this.userRoleRepo.save(userRole);

    console.log('Admin user created with role', savedUserRole);

    return user;
  }
}
