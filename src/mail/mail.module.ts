import { Module } from '@nestjs/common';

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      secure: true,
    });
  }

  private async send(options: nodemailer.SendMailOptions) {
    try {
      return await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        ...options,
      });
    } catch (error) {
      throw new InternalServerErrorException('Email failed to send');
    }
  }

  async sendVerifyCode(email: string, token: string) {
    return this.send({
      to: email,
      subject: 'Verify your email',
      html: `<p>Hello,</p><p>Your code is <strong>${token}</strong></p>`,
    });
  }

  async sendPasswordReset(email: string, resetToken: string) {
    const url = `http://localhost:4200/auth/reset-password/${resetToken}`;

    return this.send({
      to: email,
      subject: 'Password Reset Request',
      text: `Hello,\n\nClick the link below to reset your password:\n${url}`,
    });
  }

  async sendHouseUploaded(email: string, house) {
    return this.send({
      to: email,
      subject: 'A House You Saved Has Been Updated',
      text: `Good news!\n\nA these listings just got better!  `,
      html: `
        <div>
            ${house}
        </div>
      `,
    });
  }
}

@Module({
  providers: [MailService],
  exports: [MailService], // export so Auth can use it
})
export class MailModule {}
