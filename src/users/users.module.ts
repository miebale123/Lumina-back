import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { HousesModule } from 'src/houses/houses.module';
import { User } from './entities/user.entity';
import { RolesService } from 'src/users/roles.service';
import { UserSession } from './entities/user-session.entity';
import { PasswordResetService } from './password-reset.service';
import { PasswordReset } from './entities/password-reset.entity';
import { UserProfile } from './entities/user-profile.entity';
import { Role } from './entities/roles.entity';
import { UserRole } from './entities/user-roles.entity';
import { Broker } from 'src/brokers/broker.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      Role,
      UserRole,
      UserSession,
      PasswordReset,
      Broker,
    ]),
    forwardRef(() => HousesModule),
    // forwardRef(() => BookmarkModule),
  ],
  providers: [UsersService, RolesService, PasswordResetService],
  exports: [UsersService, RolesService, PasswordResetService],
})
export class UsersModule {}
