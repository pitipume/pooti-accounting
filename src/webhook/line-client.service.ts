import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { messagingApi } from '@line/bot-sdk';

@Injectable()
export class LineClientService {
  private readonly client: messagingApi.MessagingApiClient;

  constructor(config: ConfigService) {
    this.client = new messagingApi.MessagingApiClient({
      channelAccessToken: config.getOrThrow<string>('LINE_CHANNEL_ACCESS_TOKEN'),
    });
  }

  replyText(replyToken: string, text: string): Promise<unknown> {
    return this.client.replyMessage({
      replyToken,
      messages: [{ type: 'text', text }],
    });
  }
}
