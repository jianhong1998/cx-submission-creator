import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../configs/app-config.service';
import { SessionManager } from '../../session/session.service';
import {
  AuthenticationResponse,
  AuthenticationSuccessResponse,
  AuthenticationErrorResponse,
  SessionData,
} from '../../interfaces/authentication.interface';

/**
 * Service for managing user authentication with external services.
 * Provides methods to authenticate users and manage session data
 * using cookie-based session management from backend authentication endpoints.
 */
@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);
  private readonly timeout = 5000; // 5 seconds timeout as per requirements

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly sessionManager: SessionManager,
  ) {}

  /**
   * Authenticates a user by their account UUID using the external authentication service.
   * This method performs a GET request to the authentication endpoint and handles
   * the cookie-based session response.
   * @param accountUuid - The UUID of the account to authenticate as
   * @returns Promise<AuthenticationResponse> - Standardized response with authentication result
   */
  async authenticateAsUser(
    accountUuid: string,
  ): Promise<AuthenticationResponse> {
    const url = this.appConfigService.getLoginUrl(accountUuid);

    this.logger.log(`Attempting authentication for account: ${accountUuid}`);

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
        redirect: 'manual', // Handle redirects manually to capture cookies
      });

      clearTimeout(timeoutId);

      // Extract session data from response
      const sessionData = this.extractSessionFromResponse(
        response,
        accountUuid,
      );

      if (sessionData) {
        this.logger.log(`Successfully authenticated account: ${accountUuid}`);

        // Store session in SessionManager
        const sessionToken = this.sessionManager.createSession(
          accountUuid,
          sessionData,
        );

        // Extract redirect location from Location header
        const redirectLocation = response.headers.get('location') || '';

        const successResponse: AuthenticationSuccessResponse = {
          success: true,
          data: {
            accountUuid,
            sessionToken, // Include the internal session token
            sessionCookies: {
              cnx: sessionData.cnx,
              cnxExpires: sessionData.cnxExpires,
            },
            redirectLocation,
            message: 'Authentication successful',
          },
          operation: 'login_as_user',
          timestamp: new Date().toISOString(),
        };

        return successResponse;
      } else {
        return this.handleAuthenticationFailure(response, accountUuid);
      }
    } catch (error) {
      return this.handleNetworkError(error);
    }
  }

  /**
   * Validates if a session is still active and valid using session token
   * @param sessionToken - The internal session token to validate
   * @returns boolean - True if session is valid, false otherwise
   */
  validateSessionByToken(sessionToken: string): boolean {
    return this.sessionManager.isSessionValid(sessionToken);
  }

  /**
   * Gets session data by session token
   * @param sessionToken - The internal session token
   * @returns SessionData | null - Session data if valid, null otherwise
   */
  getSessionData(sessionToken: string): SessionData | null {
    return this.sessionManager.getSession(sessionToken);
  }

  /**
   * Refreshes a session extending its expiration time
   * @param sessionToken - The internal session token to refresh
   * @returns boolean - True if refresh successful, false otherwise
   */
  refreshSession(sessionToken: string): boolean {
    return this.sessionManager.refreshSession(sessionToken);
  }

  /**
   * Deletes a session from the session manager
   * @param sessionToken - The internal session token to delete
   */
  deleteSession(sessionToken: string): void {
    this.sessionManager.deleteSession(sessionToken);
  }

  /**
   * Gets all active sessions for monitoring
   * @returns Array of active session information
   */
  getActiveSessions(): Array<{
    token: string;
    accountUuid: string;
    expiresAt: Date;
  }> {
    return this.sessionManager.getActiveSessions();
  }

  /**
   * Validates if a session is still active and valid using cnx cookie
   * @param cnxToken - The cnx session token to validate
   * @returns Promise<boolean> - True if session is valid, false otherwise
   */
  async validateSession(cnxToken: string): Promise<boolean> {
    if (!cnxToken) {
      this.logger.warn('Session validation failed: No session token provided');
      return false;
    }

    try {
      // Test session validity by making a request to a protected endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const testUrl = `${this.appConfigService.getBackendHostname()}/services/uat/project-team-builder/account-licenses`;

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Cookie: `cnx=${cnxToken}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const isValid = response.status === 200;

      if (isValid) {
        this.logger.log('Session validation successful');
      } else {
        this.logger.warn(`Session validation failed: HTTP ${response.status}`);
      }

      return isValid;
    } catch (error) {
      this.logger.error('Session validation error', error);
      return false;
    }
  }

  /**
   * Extracts session data from authentication response cookies
   * @param response - The fetch Response object
   * @param accountUuid - The account UUID for session association
   * @returns SessionData if cookies found, null otherwise
   */
  private extractSessionFromResponse(
    response: Response,
    accountUuid: string,
  ): SessionData | null {
    const setCookieHeaders = response.headers.get('set-cookie');

    if (!setCookieHeaders) {
      this.logger.warn(
        'No Set-Cookie headers found in authentication response',
      );
      return null;
    }

    // Parse cookies to extract session information
    const cookies = setCookieHeaders.split(',');
    let cnx: string | null = null;
    let cnxExpires: string | null = null;

    cookies.forEach((cookie) => {
      const trimmedCookie = cookie.trim();

      if (trimmedCookie.startsWith('cnx=')) {
        // Extract session token from cnx cookie
        const sessionMatch = trimmedCookie.match(/cnx=([^;]+)/);
        if (sessionMatch) {
          cnx = sessionMatch[1];
        }
      } else if (trimmedCookie.startsWith('cnx-expires=')) {
        // Extract expiration from cnx-expires cookie
        const expiresMatch = trimmedCookie.match(/cnx-expires=([^;]+)/);
        if (expiresMatch) {
          cnxExpires = expiresMatch[1];
        }
      }
    });

    if (cnx) {
      return {
        cnx,
        cnxExpires:
          cnxExpires || new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Default 30 minutes
        accountUuid,
      };
    }

    return null;
  }

  /**
   * Handles authentication failure scenarios
   * @param response - The fetch Response object
   * @param accountUuid - The account UUID that failed authentication
   * @returns AuthenticationErrorResponse - Standardized error response
   */
  private handleAuthenticationFailure(
    response: Response,
    accountUuid: string,
  ): AuthenticationErrorResponse {
    const statusCode = response.status;

    this.logger.warn(
      `Authentication failed for account ${accountUuid}: HTTP ${statusCode}`,
    );

    return {
      success: false,
      error: {
        type: statusCode >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR',
        statusCode,
        message: `Authentication failed for account ${accountUuid}`,
        details: {
          accountUuid,
          responseStatus: statusCode,
          responseText: response.statusText,
        },
      },
      operation: 'login_as_user',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handles network errors and timeouts
   * @param error - The caught error
   * @returns AuthenticationErrorResponse - Standardized error response
   */
  private handleNetworkError(error: unknown): AuthenticationErrorResponse {
    let message: string;
    let details: unknown = null;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        message =
          'Authentication request timeout: The request took longer than 5 seconds to complete';
        this.logger.error('Authentication request timeout occurred');
      } else if (error.message.includes('fetch')) {
        message = 'Network error: Unable to connect to authentication service';
        details = { originalError: error.message };
        this.logger.error('Authentication network error occurred', error);
      } else {
        message = `Unexpected authentication error: ${error.message}`;
        details = { originalError: error.message };
        this.logger.error('Unexpected authentication error occurred', error);
      }
    } else {
      message = 'Unknown authentication error occurred';
      details = { originalError: String(error) };
      this.logger.error('Unknown authentication error occurred', error);
    }

    return {
      success: false,
      error: {
        type: 'NETWORK_ERROR',
        statusCode: 0,
        message,
        details,
      },
      operation: 'login_as_user',
      timestamp: new Date().toISOString(),
    };
  }
}
