import {
  CanActivate,
  ExecutionContext,
  Injectable,
  RawBodyRequest,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { Request } from 'express';

/**
 * Validates LINE's x-line-signature header against the raw request body,
 * per https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/
 */
@Injectable()
export class SignatureGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RawBodyRequest<Request>>();
    const signature = req.headers['x-line-signature'];
    const rawBody = req.rawBody;

    if (typeof signature !== 'string' || !rawBody) {
      throw new UnauthorizedException('Missing signature or body');
    }

    const channelSecret = this.config.getOrThrow<string>('LINE_CHANNEL_SECRET');
    const expected = createHmac('sha256', channelSecret).update(rawBody).digest();
    const provided = Buffer.from(signature, 'base64');

    if (
      expected.length !== provided.length ||
      !timingSafeEqual(expected, provided)
    ) {
      throw new UnauthorizedException('Invalid signature');
    }

    return true;
  }
}
