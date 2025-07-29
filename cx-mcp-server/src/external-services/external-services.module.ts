import { Module } from '@nestjs/common';
import { UserAccountService } from './user-account.service';
import { AppConfigService } from '../configs/app-config.service';

/**
 * ExternalServicesModule encapsulates services for interacting with external APIs and systems.
 * This modularization allows for future scalability by grouping all external service integrations,
 * making it easy to add new external services while maintaining separation of concerns.
 */
@Module({
  providers: [UserAccountService, AppConfigService],
  exports: [UserAccountService],
})
export class ExternalServicesModule {}
