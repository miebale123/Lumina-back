import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';

export interface AuthUser {
  email?: string;
  provider: string;
  providerId: string;
  accessToken?: string;
}

//remember that the startegy is from google-oauth20
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL;

    if (!clientID || !clientSecret) {
      throw new Error('Google client ID and secret not found');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  validate(accessToken: string, refreshToken: string, profile: any): AuthUser {
    const email =
      profile?.emails && profile.emails.length > 0
        ? profile.emails[0].value
        : null;

    return {
      email: email ?? undefined,
      provider: 'google',
      providerId: profile?.id ?? 'unknown',
      accessToken,
    };
  }
}
