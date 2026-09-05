import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { LiffProfile, RequestWithLiffProfile } from './liff-auth.guard';

/** Reads the profile LiffAuthGuard attached to the request. Guard must run first. */
export const CurrentLiffProfile = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): LiffProfile => {
    const req = ctx.switchToHttp().getRequest<RequestWithLiffProfile>();
    return req.liffProfile as LiffProfile;
  },
);
