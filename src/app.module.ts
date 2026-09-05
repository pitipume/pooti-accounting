import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhookModule } from './webhook/webhook.module';
import { SubmissionsModule } from './submissions/submissions.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), WebhookModule, SubmissionsModule],
})
export class AppModule {}
