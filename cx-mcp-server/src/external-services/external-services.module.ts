import { Module } from '@nestjs/common';
import { UserAccountService } from './services/user-account.service';
import { AuthenticationService } from './services/authentication.service';
import { AppConfigService } from '../configs/app-config.service';

/**
 * ExternalServicesModule encapsulates services for interacting with external APIs and systems.
 * This modularization allows for future scalability by grouping all external service integrations,
 * making it easy to add new external services while maintaining separation of concerns.
 */
@Module({
  providers: [UserAccountService, AuthenticationService, AppConfigService],
  exports: [UserAccountService, AuthenticationService],
})
export class ExternalServicesModule {}
