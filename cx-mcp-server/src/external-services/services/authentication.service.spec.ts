import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AppConfigService } from '../../configs/app-config.service';
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
  let mockFetch: jest.MockedFunction<typeof fetch>;

  const mockAccountUuid = '6daa218b-cce4-4495-ae74-877692a6fd63';
  const mockLoginUrl = `http://localhost:8000/services/uat/login?uuid=${mockAccountUuid}`;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
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
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
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
});
