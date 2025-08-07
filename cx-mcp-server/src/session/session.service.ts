import { Injectable, Logger } from '@nestjs/common';
import { SessionData } from '../interfaces/authentication.interface';

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

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

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

  deleteSession(sessionToken: string): void {
    const deleted = this.sessions.delete(sessionToken);
    if (deleted) {
      this.logger.log(`Session ${sessionToken.substring(0, 8)}... deleted`);
    }
  }

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

  isSessionValid(sessionToken: string): boolean {
    return this.getSession(sessionToken) !== null;
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

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

  private generateSessionToken(): string {
    // Generate a secure random token
    const timestamp = Date.now().toString();
    const randomBytes = Math.random().toString(36).substring(2, 15);
    const moreRandomBytes = Math.random().toString(36).substring(2, 15);

    return `sess_${timestamp}_${randomBytes}${moreRandomBytes}`;
  }

  // Get all active sessions (for monitoring/debugging)
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
