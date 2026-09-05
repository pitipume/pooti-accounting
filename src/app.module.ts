import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhookModule } from './webhook/webhook.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { BranchesModule } from './branches/branches.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WebhookModule,
    SubmissionsModule,
    BranchesModule,
    FeatureFlagsModule,
  ],
})
export class AppModule {}
