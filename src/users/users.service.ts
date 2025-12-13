import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RolesService } from 'src/users/roles.service';
import { compare, hash } from 'src/auth/bcrypt.util';
import { UserRole } from './entities/user-roles.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly roleService: RolesService,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
  ) {}

  async getUsers() {
    return this.userRepo.find({ relations: ['userRoles', 'userRoles.role'] });
  }

  // promise<User>
  async createUser(
    email: string,
    password?: string | null,
    verifytoken?: string | null,
    providerId?: string | null,
    provider?: string | null,
  ) {
    const hashedPassword = password ? await hash(password) : null;
    const hashedOTP = verifytoken ? await hash(verifytoken) : null;

    const user = this.userRepo.create({
      email,
      status: 'pending',
      hashedPassword,
      hashedOTP,
      provider,
      providerId,
    });

    // Find or create default "user" role
    let role = await this.roleService.findRole('user');
    if (!role) {
      role = await this.roleService.createRole('user');
    }

    try {
      // Save user first
      const savedUser = await this.userRepo.save(user);

      // Create UserRole linking user → role
      const userRole = this.userRoleRepo.create({
        user: savedUser,
        role,
      });

      await this.userRoleRepo.save(userRole);

      return {
        ...savedUser,
        role: role.name,
      };
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictException('Email already exists');
      }

      throw new InternalServerErrorException(
        'Failed to create user, please try again',
      );
    }
  }

  async findById(id: number) {
    return await this.userRepo.findOne({
      where: { id },
      relations: ['userRoles', 'userRoles.role'], // load roles through UserRole
    });
  }

  async findByEmail(email: string) {
    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['userRoles', 'userRoles.role'],
    });

    if (!user) return null;

    console.log(
      'User roles are:',
      user.userRoles.map((r) => r.role.name),
    );

    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<void> {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    await this.userRepo.update(id, data);
  }

  async findByOTP(OTP: string): Promise<User | null> {
    const users = await this.userRepo.find();
    for (const user of users) {
      if (user.hashedOTP) {
        const isMatch = await compare(OTP, user.hashedOTP);

        if (isMatch) {
          return user;
        }
      }
    }
    return null;
  }
}
