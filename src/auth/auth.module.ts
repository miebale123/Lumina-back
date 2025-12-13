import express_1 from 'express';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Module,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GetRefreshToken } from './decorators';
import { Public } from 'src/common/decorators';
import { AuditExclude } from 'src/audit/audit-exclude.decorator';
import { PassportModule } from '@nestjs/passport';
import express from 'express';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { UserSession } from 'src/users/entities/user-session.entity';
import { Repository } from 'typeorm';
import { compare, hash } from './bcrypt.util';
import { TokenService } from './services/token.service';
import {
  SigninDto,
  SignupDto,
  VerificationDto,
} from './dto/auth-credentials.dto';
import { randomInt } from 'crypto';
import { AuthResponseInterceptor } from './interceptors';
import { AuthInternal } from './interfaces';
import { MailModule, MailService } from 'src/mail/mail.module';
import { User } from 'src/users/entities/user.entity';
import { PasswordReset } from 'src/users/entities/password-reset.entity';
import { configuration } from 'src/config/app.config';
import { ConfigType } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';
import { GoogleStrategy, JwtStrategy } from './strategies';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PasswordResetService } from 'src/users/password-reset.service';
import { UserRole } from 'src/users/entities/user-roles.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UsersService,
    private readonly tokenService: TokenService,
    @InjectRepository(UserSession)
    private readonly sessionRepo: Repository<UserSession>,
    private readonly mailService: MailService,
  ) {}

  @Public()
  @AuditExclude()
  @Post('sign-up')
  async signup(@Body() dto: SignupDto) {
    const { email, password } = dto;
    const existing = await this.userService.findByEmail(email);

    if (existing) throw new ConflictException('Email already exists');

    const verifytoken = String(randomInt(100000, 999999));

    const roles = await this.userService.createUser(
      email,
      password,
      verifytoken,
    );

    console.log('user roles are: ', roles);

    await this.mailService.sendVerifyCode(email, verifytoken);

    return { message: 'verification code has been sent to your email' };
  }

  @Post('verify')
  @UseInterceptors(AuthResponseInterceptor)
  @Public()
  async verifyEmail(
    @Body() dto: VerificationDto,
    @Res({ passthrough: true }) res: express.Response,
  ): Promise<AuthInternal> {
    const user = await this.userService.findByOTP(dto.otp);
    if (!user) throw new BadRequestException('User not found');

    const isMatch = await compare(dto.otp, user.hashedOTP!);

    if (!isMatch) throw new UnauthorizedException('Invalid verification token');

    await this.userService.updateUser(user.id, {
      isVerified: true,
      status: 'active',
      hashedOTP: null,
    });

    const accessToken = await this.tokenService.getAccessToken(user);
    const refreshToken = await this.tokenService.getRefreshToken();

    const hashed = await hash(refreshToken);
    await this.sessionRepo.save({
      userId: user.id,
      hashedRefreshToken: hashed,
      revoked: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: isProd ? 'none' : 'lax', // <— change this

      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      message: 'signed up successfully',
      email: user.email,
      accessToken,
      refreshToken,
    };
  }

  //  Promise<AuthInternal>
  @Public()
  @AuditExclude()
  // @UseInterceptors(AuthResponseInterceptor)
  @Post('sign-in')
  async signin(
    @Body() dto: SigninDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) throw new UnauthorizedException('User not found');

    const roles = user.userRoles;

    const isMatch = await compare(dto.password, user.hashedPassword!);

    if (!isMatch) throw new BadRequestException('Incorrect password');

    const accessToken = await this.tokenService.getAccessToken(user);
    const refreshToken = await this.tokenService.getRefreshToken();

    const hashed = await hash(refreshToken);

    await this.sessionRepo.save({
      userId: user.id,
      hashedRefreshToken: hashed,
      revoked: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('refresh-token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax', // <— change this

      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      message: 'signed in successfully right',
      email: user.email,
      accessToken,
      refreshToken,
      roles,
    };
  }

  @Public()
  @Post('refresh')
  async refresh(
    @GetRefreshToken() currentRefreshToken: string,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    // Find the session with this specific refresh token
    // Find session by refresh token and revoke it
    const sessions = await this.sessionRepo.find({
      where: { revoked: false },
    });

    let session: UserSession | null = null;

    for (const s of sessions) {
      const isMatch = await compare(currentRefreshToken, s.hashedRefreshToken!);
      if (isMatch) {
        session = s;
        break;
      }
    }

    if (!session) throw new UnauthorizedException('Invalid refresh token');

    const isMatch = await compare(
      currentRefreshToken,
      session.hashedRefreshToken!,
    );
    if (!isMatch) throw new UnauthorizedException('Invalid refresh token');

    const user = await this.userService.findById(session.userId);
    if (!user) throw new UnauthorizedException('User not found');

    // Revoke old session
    await this.sessionRepo.update({ id: session.id }, { revoked: true });

    const accessToken = await this.tokenService.getAccessToken(user);
    const newRefreshToken = await this.tokenService.getRefreshToken();
    const hashedNew = await hash(newRefreshToken);

    const newSession = this.sessionRepo.create({
      userId: user.id,
      hashedRefreshToken: hashedNew,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked: false,
    });
    await this.sessionRepo.save(newSession);

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('refresh-token', newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax', // <— change this

      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return { email: user.email, accessToken, message: 'refreshed' };
  }

  @Public()
  @Post('log-out')
  async logOut(
    // @GetUser() user: User,
    @GetRefreshToken() currentRefreshToken: string,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    if (!currentRefreshToken) {
      return { message: 'No refresh token provided' };
    }

    // Find session by refresh token and revoke it
    const sessions = await this.sessionRepo.find({ where: { revoked: false } });
    for (const s of sessions) {
      const match = await compare(currentRefreshToken, s.hashedRefreshToken!);
      if (match) {
        await this.sessionRepo.update({ id: s.id }, { revoked: true });
        break;
      }
    }

    const isProd = process.env.NODE_ENV === 'production';

    res.clearCookie('refresh-token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    });

    return { message: 'logged out successfully' };
  }
}

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([User, UserSession, UserRole, PasswordReset]),
    JwtModule.registerAsync({
      inject: [configuration.KEY],
      useFactory: (config: ConfigType<typeof configuration>) => ({
        secret: config.jwt_secret,
        signOptions: { expiresIn: '15m' },
        // parseInt(config.jwt_expiry)
      }),
    }),
    UsersModule,
    MailModule,
  ],

  controllers: [AuthController],
  providers: [
    JwtStrategy,
    GoogleStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    MailService,
    UsersService,
    PasswordResetService,
    TokenService,
  ],
  exports: [PassportModule],
})
export class AuthModule {}
