import { Test, TestingModule } from '@nestjs/testing';
import { SessionManager } from './session.service';
import { SessionData } from '../interfaces/authentication.interface';

describe('SessionManager', () => {
  let service: SessionManager;
  let mockSessionData: SessionData;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionManager],
    }).compile();

    service = module.get<SessionManager>(SessionManager);

    mockSessionData = {
      accountUuid: '550e8400-e29b-41d4-a716-446655440000',
      cnx: 's%3Asession-token-123.signature',
      cnxExpires: '1723123456789',
    };
  });

  afterEach(() => {
    // Clean up any intervals
    service.onModuleDestroy();
  });

  describe('createSession', () => {
    it('should create a new session and return session token', () => {
      const sessionToken = service.createSession(
        mockSessionData.accountUuid,
        mockSessionData,
      );

      expect(sessionToken).toBeDefined();
      expect(sessionToken).toMatch(/^sess_\d+_[a-z0-9]+$/);
      expect(service.getSessionCount()).toBe(1);
    });

    it('should create sessions with unique tokens', () => {
      const token1 = service.createSession(
        mockSessionData.accountUuid,
        mockSessionData,
      );
      const token2 = service.createSession(
        mockSessionData.accountUuid,
        mockSessionData,
      );

      expect(token1).not.toBe(token2);
      expect(service.getSessionCount()).toBe(2);
    });

    it('should store session data correctly', () => {
      const sessionToken = service.createSession(
        mockSessionData.accountUuid,
        mockSessionData,
      );
      const retrievedSession = service.getSession(sessionToken);

      expect(retrievedSession).toEqual(mockSessionData);
    });
  });

  describe('getSession', () => {
    it('should retrieve existing valid session', () => {
      const sessionToken = service.createSession(
        mockSessionData.accountUuid,
        mockSessionData,
      );
      const retrievedSession = service.getSession(sessionToken);

      expect(retrievedSession).toEqual(mockSessionData);
    });

    it('should return null for non-existent session', () => {
      const result = service.getSession('non-existent-token');

      expect(result).toBeNull();
    });

    it('should return null and remove expired session', () => {
      // Mock Date.now to make session appear expired
      const originalNow = Date.now;
      const fixedTime = 1723123456789;
      Date.now = jest.fn(() => fixedTime);

      const sessionToken = service.createSession(
        mockSessionData.accountUuid,
        mockSessionData,
      );

      // Fast-forward time by 31 minutes (past expiration)
      Date.now = jest.fn(() => fixedTime + 31 * 60 * 1000);

      const result = service.getSession(sessionToken);

      expect(result).toBeNull();
      expect(service.getSessionCount()).toBe(0);

      // Restore original Date.now
      Date.now = originalNow;
    });
  });

  describe('deleteSession', () => {
    it('should delete existing session', () => {
      const sessionToken = service.createSession(
        mockSessionData.accountUuid,
        mockSessionData,
      );
      expect(service.getSessionCount()).toBe(1);

      service.deleteSession(sessionToken);

      expect(service.getSessionCount()).toBe(0);
      expect(service.getSession(sessionToken)).toBeNull();
    });

    it('should handle deletion of non-existent session gracefully', () => {
      expect(() => service.deleteSession('non-existent-token')).not.toThrow();
    });
  });

  describe('isSessionValid', () => {
    it('should return true for valid session', () => {
      const sessionToken = service.createSession(
        mockSessionData.accountUuid,
        mockSessionData,
      );

      expect(service.isSessionValid(sessionToken)).toBe(true);
    });

    it('should return false for non-existent session', () => {
      expect(service.isSessionValid('non-existent-token')).toBe(false);
    });

    it('should return false for expired session', () => {
      const originalNow = Date.now;
      const fixedTime = 1723123456789;
      Date.now = jest.fn(() => fixedTime);

      const sessionToken = service.createSession(
        mockSessionData.accountUuid,
        mockSessionData,
      );

      // Fast-forward time by 31 minutes
      Date.now = jest.fn(() => fixedTime + 31 * 60 * 1000);

      expect(service.isSessionValid(sessionToken)).toBe(false);

      Date.now = originalNow;
    });
  });

  describe('refreshSession', () => {
    it('should refresh valid session', () => {
      const sessionToken = service.createSession(
        mockSessionData.accountUuid,
        mockSessionData,
      );

      const result = service.refreshSession(sessionToken);

      expect(result).toBe(true);
      expect(service.isSessionValid(sessionToken)).toBe(true);
    });

    it('should return false for non-existent session', () => {
      const result = service.refreshSession('non-existent-token');

      expect(result).toBe(false);
    });

    it('should return false for expired session', () => {
      const originalNow = Date.now;
      const fixedTime = 1723123456789;
      Date.now = jest.fn(() => fixedTime);

      const sessionToken = service.createSession(
        mockSessionData.accountUuid,
        mockSessionData,
      );

      // Fast-forward time by 31 minutes
      Date.now = jest.fn(() => fixedTime + 31 * 60 * 1000);

      const result = service.refreshSession(sessionToken);

      expect(result).toBe(false);

      Date.now = originalNow;
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should remove expired sessions', () => {
      const originalNow = Date.now;
      const fixedTime = 1723123456789;
      Date.now = jest.fn(() => fixedTime);

      // Create multiple sessions
      service.createSession(mockSessionData.accountUuid, mockSessionData);
      service.createSession(mockSessionData.accountUuid, mockSessionData);
      service.createSession(mockSessionData.accountUuid, mockSessionData);

      expect(service.getSessionCount()).toBe(3);

      // Fast-forward time by 31 minutes
      Date.now = jest.fn(() => fixedTime + 31 * 60 * 1000);

      service.cleanupExpiredSessions();

      expect(service.getSessionCount()).toBe(0);

      Date.now = originalNow;
    });

    it('should preserve valid sessions during cleanup', () => {
      const originalNow = Date.now;
      const fixedTime = 1723123456789;
      Date.now = jest.fn(() => fixedTime);

      // Create sessions at different times
      const token1 = service.createSession(
        mockSessionData.accountUuid,
        mockSessionData,
      );

      // Fast-forward by 20 minutes and create another session
      Date.now = jest.fn(() => fixedTime + 20 * 60 * 1000);
      const token2 = service.createSession(
        mockSessionData.accountUuid,
        mockSessionData,
      );

      // Fast-forward by another 20 minutes (total 40 minutes)
      Date.now = jest.fn(() => fixedTime + 40 * 60 * 1000);

      service.cleanupExpiredSessions();

      // First session should be expired (created 40 minutes ago)
      // Second session should still be valid (created 20 minutes ago)
      expect(service.getSessionCount()).toBe(1);
      expect(service.isSessionValid(token1)).toBe(false);
      expect(service.isSessionValid(token2)).toBe(true);

      Date.now = originalNow;
    });
  });

  describe('getActiveSessions', () => {
    it('should return list of active sessions', () => {
      service.createSession(mockSessionData.accountUuid, mockSessionData);
      service.createSession('another-uuid', mockSessionData);

      const activeSessions = service.getActiveSessions();

      expect(activeSessions).toHaveLength(2);
      expect(activeSessions[0]).toHaveProperty('token');
      expect(activeSessions[0]).toHaveProperty('accountUuid');
      expect(activeSessions[0]).toHaveProperty('expiresAt');
      expect(activeSessions[0].token).toMatch(/^sess_\d+_.{3}\.\.\.$/);
    });

    it('should not return expired sessions', () => {
      const originalNow = Date.now;
      const fixedTime = 1723123456789;
      Date.now = jest.fn(() => fixedTime);

      service.createSession(mockSessionData.accountUuid, mockSessionData);

      // Fast-forward time by 31 minutes
      Date.now = jest.fn(() => fixedTime + 31 * 60 * 1000);

      const activeSessions = service.getActiveSessions();

      expect(activeSessions).toHaveLength(0);

      Date.now = originalNow;
    });
  });

  describe('concurrent session support', () => {
    it('should support multiple concurrent sessions for different users', () => {
      const user1SessionData = {
        ...mockSessionData,
        accountUuid: 'user1-uuid',
      };
      const user2SessionData = {
        ...mockSessionData,
        accountUuid: 'user2-uuid',
      };

      const token1 = service.createSession(
        user1SessionData.accountUuid,
        user1SessionData,
      );
      const token2 = service.createSession(
        user2SessionData.accountUuid,
        user2SessionData,
      );

      expect(service.getSessionCount()).toBe(2);
      expect(service.getSession(token1)?.accountUuid).toBe('user1-uuid');
      expect(service.getSession(token2)?.accountUuid).toBe('user2-uuid');
    });

    it('should support multiple sessions for the same user', () => {
      const token1 = service.createSession(
        mockSessionData.accountUuid,
        mockSessionData,
      );
      const token2 = service.createSession(
        mockSessionData.accountUuid,
        mockSessionData,
      );

      expect(service.getSessionCount()).toBe(2);
      expect(service.getSession(token1)?.accountUuid).toBe(
        mockSessionData.accountUuid,
      );
      expect(service.getSession(token2)?.accountUuid).toBe(
        mockSessionData.accountUuid,
      );
    });

    it('should handle minimum 50 concurrent sessions', () => {
      // Create 50 sessions
      const tokens: string[] = [];
      for (let i = 0; i < 50; i++) {
        const sessionData = {
          ...mockSessionData,
          accountUuid: `user-${i}-uuid`,
          cnx: `session-${i}`,
        };
        const token = service.createSession(
          sessionData.accountUuid,
          sessionData,
        );
        tokens.push(token);
      }

      expect(service.getSessionCount()).toBe(50);

      // Verify all sessions are accessible
      tokens.forEach((token, index) => {
        const session = service.getSession(token);
        expect(session).toBeDefined();
        expect(session?.accountUuid).toBe(`user-${index}-uuid`);
      });
    });
  });

  describe('session token security', () => {
    it('should generate unique session tokens', () => {
      const tokens = new Set<string>();

      // Generate 1000 tokens to test for uniqueness
      for (let i = 0; i < 1000; i++) {
        const token = service.createSession(`user-${i}`, mockSessionData);
        expect(tokens.has(token)).toBe(false);
        tokens.add(token);
      }

      expect(tokens.size).toBe(1000);
    });

    it('should use secure token format', () => {
      const token = service.createSession(
        mockSessionData.accountUuid,
        mockSessionData,
      );

      // Token should follow format: sess_{timestamp}_{randomString}
      expect(token).toMatch(/^sess_\d{13}_[a-z0-9]+$/);
      expect(token.length).toBeGreaterThan(20);
    });
  });
});
