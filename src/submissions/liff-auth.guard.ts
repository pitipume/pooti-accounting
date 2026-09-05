import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export interface LiffProfile {
  userId: string;
  displayName: string;
}

export interface RequestWithLiffProfile extends Request {
  liffProfile?: LiffProfile;
}

/**
 * Verifies the LIFF ID token against LINE's own verify endpoint rather than
 * decoding the JWT locally — simplest correct option, no JWK/signature
 * handling needed on our side. client_id must be the LINE Login channel
 * (not the Messaging API channel) that the LIFF app was registered under.
 */
@Injectable()
export class LiffAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithLiffProfile>();
    const idToken = req.body?.idToken;

    if (typeof idToken !== 'string' || !idToken) {
      throw new UnauthorizedException('Missing idToken');
    }

    const clientId = this.config.getOrThrow<string>('LINE_LOGIN_CHANNEL_ID');
    const params = new URLSearchParams({ id_token: idToken, client_id: clientId });

    const res = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!res.ok) {
      throw new UnauthorizedException('Invalid or expired LIFF session — please reopen from the menu');
    }

    const payload = (await res.json()) as { sub: string; name?: string };
    req.liffProfile = { userId: payload.sub, displayName: payload.name ?? '' };
    return true;
  }
}
