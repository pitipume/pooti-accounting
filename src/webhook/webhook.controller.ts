import { Controller, HttpCode, Logger, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { WebhookEvent } from '@line/bot-sdk';
import { SignatureGuard } from './signature.guard';
import { LineClientService } from './line-client.service';

const MENU_NUDGE_TEXT =
  'กรุณาใช้ปุ่มเมนูด้านล่างเพื่อส่งรายงานประจำวัน / Please use the menu button below to submit your daily report.';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly lineClient: LineClientService) {}

  @Post()
  @HttpCode(200)
  @UseGuards(SignatureGuard)
  async handleWebhook(@Req() req: Request): Promise<{ ok: true }> {
    const events = (req.body?.events ?? []) as WebhookEvent[];

    for (const event of events) {
      await this.handleEvent(event);
    }

    return { ok: true };
  }

  private async handleEvent(event: WebhookEvent): Promise<void> {
    this.logger.log(`Received event: ${event.type} from ${event.source.userId ?? 'unknown'}`);

    if (event.type === 'message' && event.message.type === 'text' && event.replyToken) {
      await this.lineClient.replyText(event.replyToken, MENU_NUDGE_TEXT);
    }
  }
}
