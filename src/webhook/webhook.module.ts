import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { LineClientService } from './line-client.service';
import { SignatureGuard } from './signature.guard';

@Module({
  controllers: [WebhookController],
  providers: [LineClientService, SignatureGuard],
})
export class WebhookModule {}
