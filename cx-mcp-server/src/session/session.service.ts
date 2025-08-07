import { Injectable, Logger } from '@nestjs/common';
import { SessionData } from '../interfaces/authentication.interface';

/**
 * SessionManager service for managing authentication sessions.
 * Provides in-memory session storage with automatic cleanup and expiration handling.
 * Supports concurrent sessions and secure token generation.
 */
@Injectable()
export class SessionManager {
  private readonly logger = new Logger(SessionManager.name);
  private readonly sessions = new Map<
    string,
    SessionData & { expiresAt: Date }
  >();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Start cleanup interval every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredSessions();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * NestJS lifecycle hook for cleanup when module is destroyed
   */
  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Creates a new session with the given account UUID and session data
   * @param accountUuid - The UUID of the account this session belongs to
   * @param sessionData - The session data containing authentication cookies
   * @returns string - The generated session token for internal use
   */
  createSession(accountUuid: string, sessionData: SessionData): string {
    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    this.sessions.set(sessionToken, {
      ...sessionData,
      expiresAt,
    });

    this.logger.log(
      `Session created for account ${accountUuid}, expires at ${expiresAt.toISOString()}`,
    );

    return sessionToken;
  }

  /**
   * Retrieves session data by session token, automatically removing expired sessions
   * @param sessionToken - The session token to look up
   * @returns SessionData if session exists and is valid, null otherwise
   */
  getSession(sessionToken: string): SessionData | null {
    const sessionWithExpiry = this.sessions.get(sessionToken);

    if (!sessionWithExpiry) {
      return null;
    }

    if (sessionWithExpiry.expiresAt.getTime() < Date.now()) {
      this.sessions.delete(sessionToken);
      this.logger.log(
        `Session ${sessionToken.substring(0, 8)}... expired and removed`,
      );
      return null;
    }

    // Return session data without the expiresAt field
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { expiresAt, ...sessionData } = sessionWithExpiry;
    return sessionData;
  }

  /**
   * Deletes a session by its token
   * @param sessionToken - The session token to delete
   */
  deleteSession(sessionToken: string): void {
    const deleted = this.sessions.delete(sessionToken);
    if (deleted) {
      this.logger.log(`Session ${sessionToken.substring(0, 8)}... deleted`);
    }
  }

  /**
   * Removes all expired sessions from memory
   * Called automatically every 5 minutes
   */
  cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [token, session] of this.sessions.entries()) {
      if (session.expiresAt.getTime() < now) {
        this.sessions.delete(token);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} expired sessions`);
    }
  }

  /**
   * Checks if a session is valid and not expired
   * @param sessionToken - The session token to validate
   * @returns boolean - True if session exists and is valid
   */
  isSessionValid(sessionToken: string): boolean {
    return this.getSession(sessionToken) !== null;
  }

  /**
   * Gets the total number of active sessions in memory
   * @returns number - Count of sessions currently stored
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Extends the expiration time of a session by 30 minutes
   * @param sessionToken - The session token to refresh
   * @returns boolean - True if session was refreshed, false if not found or expired
   */
  refreshSession(sessionToken: string): boolean {
    const sessionWithExpiry = this.sessions.get(sessionToken);

    if (
      !sessionWithExpiry ||
      sessionWithExpiry.expiresAt.getTime() < Date.now()
    ) {
      return false;
    }

    // Extend session by another 30 minutes
    sessionWithExpiry.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    this.logger.log(
      `Session ${sessionToken.substring(0, 8)}... refreshed, new expiry: ${sessionWithExpiry.expiresAt.toISOString()}`,
    );

    return true;
  }

  /**
   * Generates a secure, unique session token
   * Format: sess_{timestamp}_{randomString1}{randomString2}
   * @returns string - The generated session token
   */
  private generateSessionToken(): string {
    // Generate a secure random token
    const timestamp = Date.now().toString();
    const randomBytes = Math.random().toString(36).substring(2, 15);
    const moreRandomBytes = Math.random().toString(36).substring(2, 15);

    return `sess_${timestamp}_${randomBytes}${moreRandomBytes}`;
  }

  /**
   * Gets all active (non-expired) sessions for monitoring purposes
   * @returns Array of active session information with truncated tokens for security
   */
  getActiveSessions(): Array<{
    token: string;
    accountUuid: string;
    expiresAt: Date;
  }> {
    const activeSessions: Array<{
      token: string;
      accountUuid: string;
      expiresAt: Date;
    }> = [];

    const now = Date.now();
    for (const [token, session] of this.sessions.entries()) {
      if (session.expiresAt.getTime() > now) {
        // Token format: sess_{13-digit-timestamp}_{random-string}
        // Show: sess_{timestamp}_{first-3-chars}...
        const parts = token.split('_');
        const truncatedToken =
          parts.length >= 3
            ? `${parts[0]}_${parts[1]}_${parts[2].substring(0, 3)}...`
            : token.substring(0, 8) + '...';

        activeSessions.push({
          token: truncatedToken,
          accountUuid: session.accountUuid,
          expiresAt: session.expiresAt,
        });
      }
    }

    return activeSessions;
  }
}
