// import { Body, Controller, Patch } from '@nestjs/common';
// import { GetUser, Public } from 'src/common';
// import { User } from 'src/users/entities/user.entity';
// import { UpdatePasswordDto } from './dto/auth-credentials.dto';

// @Controller()
// export class PasswordController {
//     @Patch('update-password')
//     async updatePassword(
//       @GetUser() user: User,
//       @Body() dto: UpdatePasswordDto,
//     ): Promise<{ message: string }> {
//       await this.passwordService.updatePassword(user, dto);
//       return { message: 'password updated successfully' };
//     }
//     @Public()
//     @('forgot-password')
//     async forgotPassword(
//       @Body() dto: ForgotPasswordDto,
//     ): Promise<{ message: string }> {
//       await this.passwordService.forgotPassword(dto);
//       return { message: 'Password reset link sent to your email.' };
//     }
//     @Public()
//     @Post('reset-password/:resetToken')
//     async resetPassword(
//       @Body() dto: ResetPasswordDto,
//       @Param('resetToken') resetToken: string,
//     ): Promise<{ message: string }> {
//       await this.passwordService.resetPassword(dto, resetToken);
//       return { message: 'Password reset successfully' };
//   //   }
// }
