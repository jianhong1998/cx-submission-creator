import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AppConfigService } from '../../configs/app-config.service';
import { SessionManager } from '../../session/session.service';
import {
  AuthenticationSuccessResponse,
  AuthenticationErrorResponse,
} from '../../interfaces/authentication.interface';

// Mock fetch globally
global.fetch = jest.fn();

// Helper function to create mock Response objects
const createMockResponse = (options: {
  status: number;
  statusText?: string;
  headers?: Record<string, string>;
  text?: () => Promise<string>;
}): Response => {
  const headers = new Headers();
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }

  return {
    status: options.status,
    statusText: options.statusText || 'OK',
    headers,
    text:
      options.text || jest.fn().mockResolvedValue('Found. Redirecting to /'),
  } as unknown as Response;
};

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let sessionManager: SessionManager;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  const mockAccountUuid = '6daa218b-cce4-4495-ae74-877692a6fd63';
  const mockLoginUrl = `http://localhost:8000/services/uat/login?uuid=${mockAccountUuid}`;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        SessionManager,
        {
          provide: AppConfigService,
          useValue: {
            getLoginUrl: jest.fn().mockReturnValue(mockLoginUrl),
            getBackendHostname: jest
              .fn()
              .mockReturnValue('http://localhost:8000'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
    sessionManager = module.get<SessionManager>(SessionManager);
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clean up session manager intervals
    sessionManager.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('authenticateAsUser', () => {
    it('should successfully authenticate with valid session cookies', async () => {
      // Arrange
      const mockResponse = createMockResponse({
        status: 302,
        statusText: 'Found',
        headers: {
          'set-cookie':
            'cnx=s%3Asession-token.signature; Path=/; Expires=Wed, 01 Jan 2025 12:00:00 GMT; HttpOnly; SameSite=Strict, cnx-expires=1640952000000; Path=/; Expires=0',
          location: '/dashboard',
        },
      });
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.authenticateAsUser(mockAccountUuid);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(mockLoginUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        signal: expect.any(AbortSignal) as AbortSignal,
        redirect: 'manual',
      });

      const expectedResult: AuthenticationSuccessResponse = {
        success: true,
        data: {
          accountUuid: mockAccountUuid,
          sessionToken: expect.any(String) as string,
          sessionCookies: {
            cnx: 's%3Asession-token.signature',
            cnxExpires: '1640952000000',
          },
          redirectLocation: '/dashboard',
          message: 'Authentication successful',
        },
        operation: 'login_as_user',
        timestamp: expect.any(String) as string,
      };
      expect(result).toEqual(expectedResult);

      // Verify session was created in session manager
      const sessionData = sessionManager.getSession(
        (result as AuthenticationSuccessResponse).data.sessionToken,
      );
      expect(sessionData).toBeDefined();
      expect(sessionData?.accountUuid).toBe(mockAccountUuid);
      expect(sessionData?.cnx).toBe('s%3Asession-token.signature');
    });

    it('should handle authentication failure when no cookies are present', async () => {
      // Arrange
      const mockResponse = createMockResponse({
        status: 302,
        statusText: 'Found',
      });
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.authenticateAsUser(mockAccountUuid);

      // Assert
      const expectedResult: AuthenticationErrorResponse = {
        success: false,
        error: {
          type: 'CLIENT_ERROR',
          statusCode: 302,
          message: `Authentication failed for account ${mockAccountUuid}`,
          details: {
            accountUuid: mockAccountUuid,
            responseStatus: 302,
            responseText: 'Found',
          },
        },
        operation: 'login_as_user',
        timestamp: expect.any(String) as string,
      };
      expect(result).toEqual(expectedResult);
    });

    it('should handle 4xx client errors', async () => {
      // Arrange
      const mockResponse = createMockResponse({
        status: 404,
        statusText: 'Not Found',
      });
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.authenticateAsUser(mockAccountUuid);

      // Assert
      const expectedResult: AuthenticationErrorResponse = {
        success: false,
        error: {
          type: 'CLIENT_ERROR',
          statusCode: 404,
          message: `Authentication failed for account ${mockAccountUuid}`,
          details: {
            accountUuid: mockAccountUuid,
            responseStatus: 404,
            responseText: 'Not Found',
          },
        },
        operation: 'login_as_user',
        timestamp: expect.any(String) as string,
      };
      expect(result).toEqual(expectedResult);
    });

    it('should handle 5xx server errors', async () => {
      // Arrange
      const mockResponse = createMockResponse({
        status: 500,
        statusText: 'Internal Server Error',
      });
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.authenticateAsUser(mockAccountUuid);

      // Assert
      const expectedResult: AuthenticationErrorResponse = {
        success: false,
        error: {
          type: 'SERVER_ERROR',
          statusCode: 500,
          message: `Authentication failed for account ${mockAccountUuid}`,
          details: {
            accountUuid: mockAccountUuid,
            responseStatus: 500,
            responseText: 'Internal Server Error',
          },
        },
        operation: 'login_as_user',
        timestamp: expect.any(String) as string,
      };
      expect(result).toEqual(expectedResult);
    });

    it('should handle network errors', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Act
      const result = await service.authenticateAsUser(mockAccountUuid);

      // Assert
      const expectedResult: AuthenticationErrorResponse = {
        success: false,
        error: {
          type: 'NETWORK_ERROR',
          statusCode: 0,
          message: 'Unexpected authentication error: Network error',
          details: {
            originalError: 'Network error',
          },
        },
        operation: 'login_as_user',
        timestamp: expect.any(String) as string,
      };
      expect(result).toEqual(expectedResult);
    });

    it('should handle timeout errors', async () => {
      // Arrange
      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      // Act
      const result = await service.authenticateAsUser(mockAccountUuid);

      // Assert
      const expectedResult: AuthenticationErrorResponse = {
        success: false,
        error: {
          type: 'NETWORK_ERROR',
          statusCode: 0,
          message:
            'Authentication request timeout: The request took longer than 5 seconds to complete',
          details: null,
        },
        operation: 'login_as_user',
        timestamp: expect.any(String) as string,
      };
      expect(result).toEqual(expectedResult);
    });

    it('should handle unknown errors', async () => {
      // Arrange
      mockFetch.mockRejectedValue('Unknown error string');

      // Act
      const result = await service.authenticateAsUser(mockAccountUuid);

      // Assert
      const expectedResult: AuthenticationErrorResponse = {
        success: false,
        error: {
          type: 'NETWORK_ERROR',
          statusCode: 0,
          message: 'Unknown authentication error occurred',
          details: {
            originalError: 'Unknown error string',
          },
        },
        operation: 'login_as_user',
        timestamp: expect.any(String) as string,
      };
      expect(result).toEqual(expectedResult);
    });

    it('should use correct timeout configuration', async () => {
      // Arrange
      const mockResponse = createMockResponse({
        status: 302,
        headers: {
          'set-cookie': 'cnx=session-token; Path=/; HttpOnly',
        },
      });
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      await service.authenticateAsUser(mockAccountUuid);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        mockLoginUrl,
        expect.objectContaining({
          signal: expect.any(AbortSignal) as AbortSignal,
        }),
      );
    });

    it('should log authentication attempts and success', async () => {
      // Arrange
      const mockResponse = createMockResponse({
        status: 302,
        headers: {
          'set-cookie': 'cnx=session-token; Path=/; HttpOnly',
        },
      });
      mockFetch.mockResolvedValue(mockResponse);
      const loggerSpy = jest.spyOn(Logger.prototype, 'log');

      // Act
      await service.authenticateAsUser(mockAccountUuid);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        `Attempting authentication for account: ${mockAccountUuid}`,
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        `Successfully authenticated account: ${mockAccountUuid}`,
      );
    });

    it('should log authentication failures', async () => {
      // Arrange
      const mockResponse = createMockResponse({
        status: 404,
        statusText: 'Not Found',
      });
      mockFetch.mockResolvedValue(mockResponse);
      const loggerSpy = jest.spyOn(Logger.prototype, 'warn');

      // Act
      await service.authenticateAsUser(mockAccountUuid);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        `Authentication failed for account ${mockAccountUuid}: HTTP 404`,
      );
    });

    it('should parse complex cookie headers correctly', async () => {
      // Arrange
      const mockResponse = createMockResponse({
        status: 302,
        headers: {
          'set-cookie':
            'cnx=s%3Acomplex-session.signature; Path=/; Expires=Wed, 01 Jan 2025 12:00:00 GMT; HttpOnly; SameSite=Strict, cnx-expires=1640952000000; Path=/; Expires=0, other-cookie=value; Path=/',
        },
      });
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.authenticateAsUser(mockAccountUuid);

      // Assert
      const expectedResult: AuthenticationSuccessResponse = {
        success: true,
        data: {
          accountUuid: mockAccountUuid,
          sessionToken: expect.any(String) as string,
          sessionCookies: {
            cnx: 's%3Acomplex-session.signature',
            cnxExpires: '1640952000000',
          },
          redirectLocation: '',
          message: 'Authentication successful',
        },
        operation: 'login_as_user',
        timestamp: expect.any(String) as string,
      };
      expect(result).toEqual(expectedResult);
    });
  });

  describe('validateSession', () => {
    const mockCnxToken = 's%3Asession-token.signature';
    const mockValidationUrl =
      'http://localhost:8000/services/uat/project-team-builder/account-licenses';

    it('should return true for valid session token', async () => {
      // Arrange
      const mockResponse = createMockResponse({
        status: 200,
        statusText: 'OK',
      });
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.validateSession(mockCnxToken);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(mockValidationUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Cookie: `cnx=${mockCnxToken}`,
        },
        signal: expect.any(AbortSignal) as AbortSignal,
      });
      expect(result).toBe(true);
    });

    it('should return false for invalid session token', async () => {
      // Arrange
      const mockResponse = createMockResponse({
        status: 403,
        statusText: 'Forbidden',
      });
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.validateSession(mockCnxToken);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for empty session token', async () => {
      // Act
      const result = await service.validateSession('');

      // Assert
      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return false for null session token', async () => {
      // Act
      const result = await service.validateSession(null as unknown as string);

      // Assert
      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle network errors during validation', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Act
      const result = await service.validateSession(mockCnxToken);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle timeout errors during validation', async () => {
      // Arrange
      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      // Act
      const result = await service.validateSession(mockCnxToken);

      // Assert
      expect(result).toBe(false);
    });

    it('should log successful session validation', async () => {
      // Arrange
      const mockResponse = createMockResponse({
        status: 200,
        statusText: 'OK',
      });
      mockFetch.mockResolvedValue(mockResponse);
      const loggerSpy = jest.spyOn(Logger.prototype, 'log');

      // Act
      await service.validateSession(mockCnxToken);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith('Session validation successful');
    });

    it('should log failed session validation', async () => {
      // Arrange
      const mockResponse = createMockResponse({
        status: 401,
        statusText: 'Unauthorized',
      });
      mockFetch.mockResolvedValue(mockResponse);
      const loggerSpy = jest.spyOn(Logger.prototype, 'warn');

      // Act
      await service.validateSession(mockCnxToken);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        'Session validation failed: HTTP 401',
      );
    });

    it('should log warning for empty session token', async () => {
      // Arrange
      const loggerSpy = jest.spyOn(Logger.prototype, 'warn');

      // Act
      await service.validateSession('');

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        'Session validation failed: No session token provided',
      );
    });

    it('should log error for network issues', async () => {
      // Arrange
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');

      // Act
      await service.validateSession(mockCnxToken);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        'Session validation error',
        networkError,
      );
    });
  });

  describe('session management integration', () => {
    it('should validate session using internal token', () => {
      // Arrange - Create a session first
      const sessionData = {
        cnx: 'session-token-value',
        cnxExpires: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        accountUuid: mockAccountUuid,
      };
      const sessionToken = sessionManager.createSession(
        mockAccountUuid,
        sessionData,
      );

      // Act
      const isValid = service.validateSessionByToken(sessionToken);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should return false for invalid session token', () => {
      // Act
      const isValid = service.validateSessionByToken('invalid-token');

      // Assert
      expect(isValid).toBe(false);
    });

    it('should get session data by token', () => {
      // Arrange
      const sessionData = {
        cnx: 'session-token-value',
        cnxExpires: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        accountUuid: mockAccountUuid,
      };
      const sessionToken = sessionManager.createSession(
        mockAccountUuid,
        sessionData,
      );

      // Act
      const retrievedData = service.getSessionData(sessionToken);

      // Assert
      expect(retrievedData).toEqual(sessionData);
    });

    it('should refresh session successfully', () => {
      // Arrange
      const sessionData = {
        cnx: 'session-token-value',
        cnxExpires: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        accountUuid: mockAccountUuid,
      };
      const sessionToken = sessionManager.createSession(
        mockAccountUuid,
        sessionData,
      );

      // Act
      const refreshed = service.refreshSession(sessionToken);

      // Assert
      expect(refreshed).toBe(true);
      expect(service.validateSessionByToken(sessionToken)).toBe(true);
    });

    it('should delete session successfully', () => {
      // Arrange
      const sessionData = {
        cnx: 'session-token-value',
        cnxExpires: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        accountUuid: mockAccountUuid,
      };
      const sessionToken = sessionManager.createSession(
        mockAccountUuid,
        sessionData,
      );

      // Act
      service.deleteSession(sessionToken);

      // Assert
      expect(service.validateSessionByToken(sessionToken)).toBe(false);
    });

    it('should get active sessions', () => {
      // Arrange - Create multiple sessions
      const sessionData1 = {
        cnx: 'session-token-1',
        cnxExpires: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        accountUuid: 'user1',
      };
      const sessionData2 = {
        cnx: 'session-token-2',
        cnxExpires: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        accountUuid: 'user2',
      };

      sessionManager.createSession('user1', sessionData1);
      sessionManager.createSession('user2', sessionData2);

      // Act
      const activeSessions = service.getActiveSessions();

      // Assert
      expect(activeSessions).toHaveLength(2);
      expect(activeSessions.some((s) => s.accountUuid === 'user1')).toBe(true);
      expect(activeSessions.some((s) => s.accountUuid === 'user2')).toBe(true);
    });

    it('should handle session creation during authentication', async () => {
      // Arrange
      const mockResponse = createMockResponse({
        status: 302,
        statusText: 'Found',
        headers: {
          'set-cookie':
            'cnx=s%3Anew-session.signature; Path=/; Expires=Wed, 01 Jan 2025 12:00:00 GMT; HttpOnly; SameSite=Strict',
          location: '/',
        },
      });
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.authenticateAsUser(mockAccountUuid);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        const sessionData = service.getSessionData(result.data.sessionToken);
        expect(sessionData).toBeDefined();
        expect(sessionData?.accountUuid).toBe(mockAccountUuid);
        expect(sessionData?.cnx).toBe('s%3Anew-session.signature');
      }
    });

    it('should support concurrent sessions for different users', async () => {
      // Arrange - Mock multiple authentication responses
      const mockResponse1 = createMockResponse({
        status: 302,
        headers: {
          'set-cookie': 'cnx=session1; Path=/',
          location: '/',
        },
      });
      const mockResponse2 = createMockResponse({
        status: 302,
        headers: {
          'set-cookie': 'cnx=session2; Path=/',
          location: '/',
        },
      });

      // Act - Authenticate two different users
      mockFetch.mockResolvedValueOnce(mockResponse1);
      const result1 = await service.authenticateAsUser('user1');

      mockFetch.mockResolvedValueOnce(mockResponse2);
      const result2 = await service.authenticateAsUser('user2');

      // Assert
      expect(result1.success && result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.data.sessionToken).not.toBe(result2.data.sessionToken);

        const activeSessions = service.getActiveSessions();
        expect(activeSessions).toHaveLength(2);
        expect(activeSessions.some((s) => s.accountUuid === 'user1')).toBe(
          true,
        );
        expect(activeSessions.some((s) => s.accountUuid === 'user2')).toBe(
          true,
        );
      }
    });
  });
});
