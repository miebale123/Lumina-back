import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import type { User } from 'src/users/entities/user.entity';
import type { JwtPayload } from '../interfaces';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async getAccessToken(user: User) {
    const roles = user.userRoles?.map((ur) => ur.role.name) || [];

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles,
    };

    const accessToken = this.jwtService.sign(payload);

    return accessToken;
  }

  async getRefreshToken() {
    const refreshToken = crypto.randomBytes(64).toString('hex');
    return refreshToken;
  }

  async getVerificationToken() {}

  async verifyToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token);
  }

  async decodeToken(token: string): Promise<JwtPayload> {
    return this.jwtService.decode(token);
  }
}
