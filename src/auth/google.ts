

//   @Public()
//   // @Throttle({ default: { limit: 60000, ttl: 5 } })
//   @AuditExclude()
//   @UseInterceptors(AuthResponseInterceptor)
//   @Post('sign-in')
//   async signin(@Body() dto: SigninDto): Promise<AuthInternal> {
//     return await this.authService.signin(dto);
//   }


    // @Public()
    // @Get('google')
    // @UseGuards(AuthGuard('google'))
    // async googleLogin() {}
  
    // @Public()
    // @Get('google/callback')
    // @UseGuards(AuthGuard('google'))
    // async googleCallback(
    //   @Req() req: express.Request & { user?: AuthUser },
    //   @Res() res: express.Response,
    // ) {
    //   const gUser = req.user;
    //   if (!gUser?.email) return res.status(400).send('Authentication failed');
  
    //   let appUser = await this.userService.findByEmail(gUser.email);
    //   if (!appUser) {
    //     appUser = await this.userService.createUser(
    //       gUser.email,
    //       null,
    //       null,
    //       gUser.providerId,
    //       gUser.provider,
    //     );
    //   }
  
    //   const refreshToken = await this.tokenService.getRefreshToken();
    //   const hashed = await hash(refreshToken);
  
    //   const session = this.sessionRepo.create({
    //     userId: appUser.id,
    //     hashedRefreshToken: hashed,
    //     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    //     revoked: false,
    //   });
    //   await this.sessionRepo.save(session);
  
    //   const accessToken = this.jwtService.sign({
    //     email: appUser.email,
    //     sub: appUser.id,
    //     roles: ['user'],
    //   });
  
    //   res.cookie('refresh-token', refreshToken, {
    //     httpOnly: true,
    //     secure: process.env.NODE_ENV === 'production',
    //     sameSite: 'strict',
    //     maxAge: 7 * 24 * 60 * 60 * 1000,
    //     path: '/',
    //   });
  
    //   return res.redirect(
    //     `http://localhost:4200/oauth-login?token=${accessToken}&email=${encodeURIComponent(
    //       appUser.email,
    //     )}`,
    //   );
    // }