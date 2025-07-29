import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../configs/app-config.service';
import {
  AccountLicensesResponse,
  AccountLicensesSuccessResponse,
  AccountLicensesErrorResponse,
  RawAccountLicensesResponse,
  AuthenticationErrorResponse,
} from '../interfaces/account-license.interface';

/**
 * Service for managing user account data from external services.
 * Provides methods to retrieve user account information, licenses, and related data
 * from various external APIs. Designed to be extensible for multiple external services.
 */
@Injectable()
export class UserAccountService {
  private readonly logger = new Logger(UserAccountService.name);
  private readonly timeout = 5000; // 5 seconds timeout as per requirements

  constructor(private readonly appConfigService: AppConfigService) {}

  /**
   * Retrieves user account licenses and professional credentials from the external service.
   * This method fetches comprehensive user data including professional licenses,
   * available roles, and account information.
   * @returns Promise<AccountLicensesResponse> - Standardized response with user account data or error details
   */
  async getUserAccountLicenses(): Promise<AccountLicensesResponse> {
    const url = this.appConfigService.getAccountLicensesUrl();

    this.logger.log(`Fetching user account licenses from: ${url}`);

    try {
      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return this.handleErrorResponse(response);
      }

      const data = (await response.json()) as RawAccountLicensesResponse;

      this.logger.log(
        `Successfully retrieved ${data.length} user accounts with licenses`,
      );

      const successResponse: AccountLicensesSuccessResponse = {
        success: true,
        data,
      };

      return successResponse;
    } catch (error) {
      return this.handleNetworkError(error);
    }
  }

  /**
   * Handles HTTP error responses from the service
   * @param response - The fetch Response object
   * @returns AccountLicensesErrorResponse - Standardized error response
   */
  private async handleErrorResponse(
    response: Response,
  ): Promise<AccountLicensesErrorResponse> {
    const statusCode = response.status;
    let errorType: 'CLIENT_ERROR' | 'SERVER_ERROR';
    let message: string;
    let details: unknown = null;

    try {
      const errorData = (await response.json()) as unknown;

      // Handle authentication errors (403 Forbidden)
      if (
        statusCode === 403 &&
        typeof errorData === 'object' &&
        errorData !== null &&
        'errorCode' in errorData &&
        errorData.errorCode === 'NOT_LOGGED_IN'
      ) {
        const authError = errorData as AuthenticationErrorResponse;
        this.logger.warn(`Authentication error: ${authError.message}`);

        return {
          success: false,
          error: {
            type: 'CLIENT_ERROR',
            statusCode,
            message:
              'Authentication required. Please log in to access this resource.',
            details: {
              errorCode: authError.errorCode,
              timestamp: authError.timestamp,
            },
          },
        };
      }

      // Handle other client errors (4XX)
      if (statusCode >= 400 && statusCode < 500) {
        errorType = 'CLIENT_ERROR';
        message =
          typeof errorData === 'object' &&
          errorData !== null &&
          'message' in errorData &&
          typeof errorData.message === 'string'
            ? errorData.message
            : `Client error: ${response.statusText}`;
        details = errorData;
      } else {
        // Handle server errors (5XX)
        errorType = 'SERVER_ERROR';
        message =
          typeof errorData === 'object' &&
          errorData !== null &&
          'message' in errorData &&
          typeof errorData.message === 'string'
            ? errorData.message
            : `Server error: ${response.statusText}`;
        details = errorData;
      }
    } catch {
      // If we can't parse the error response, create a generic error
      if (statusCode >= 400 && statusCode < 500) {
        errorType = 'CLIENT_ERROR';
        message = `Client error: ${response.statusText} (${statusCode})`;
      } else {
        errorType = 'SERVER_ERROR';
        message = `Server error: ${response.statusText} (${statusCode})`;
      }
    }

    this.logger.error(`HTTP ${statusCode} error: ${message}`, details);

    return {
      success: false,
      error: {
        type: errorType,
        statusCode,
        message,
        details,
      },
    };
  }

  /**
   * Handles network errors and timeouts
   * @param error - The caught error
   * @returns AccountLicensesErrorResponse - Standardized error response
   */
  private handleNetworkError(error: unknown): AccountLicensesErrorResponse {
    let message: string;
    let details: unknown = null;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        message =
          'Request timeout: The request took longer than 5 seconds to complete';
        this.logger.error('Request timeout occurred');
      } else if (error.message.includes('fetch')) {
        message = 'Network error: Unable to connect to the service';
        details = { originalError: error.message };
        this.logger.error('Network error occurred', error);
      } else {
        message = `Unexpected error: ${error.message}`;
        details = { originalError: error.message };
        this.logger.error('Unexpected error occurred', error);
      }
    } else {
      message = 'Unknown error occurred';
      details = { originalError: String(error) };
      this.logger.error('Unknown error occurred', error);
    }

    return {
      success: false,
      error: {
        type: 'NETWORK_ERROR',
        statusCode: 0,
        message,
        details,
      },
    };
  }
}
