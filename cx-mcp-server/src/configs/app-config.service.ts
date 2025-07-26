import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './app.config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService<AppConfig>) {}

  /**
   * Get the backend hostname for the project team builder service
   * @returns The configured backend hostname URL
   */
  getBackendHostname(): string {
    const hostname = this.configService.get<string>('BACKEND_HOSTNAME');
    if (!hostname) {
      throw new Error('BACKEND_HOSTNAME environment variable is required');
    }
    return hostname;
  }

  /**
   * Get the complete URL for the account licenses endpoint
   * @returns The full URL for the account licenses endpoint
   */
  getAccountLicensesUrl(): string {
    const hostname = this.getBackendHostname();
    return `${hostname}/services/uat/project-team-builder/account-licenses`;
  }

  /**
   * Get the current node environment
   * @returns The current environment (development, production, etc.)
   */
  getNodeEnv(): string {
    return this.configService.get<string>('NODE_ENV') || 'development';
  }

  /**
   * Get the application port
   * @returns The port number the application should run on
   */
  getAppPort(): number {
    const port = this.configService.get<string>('APP_PORT') || '3002';
    return parseInt(port, 10);
  }

  /**
   * Check if the application is running in development mode
   * @returns True if running in development mode
   */
  isDevelopment(): boolean {
    return this.getNodeEnv() === 'development';
  }
}
