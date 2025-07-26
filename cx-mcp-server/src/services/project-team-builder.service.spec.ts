import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ProjectTeamBuilderService } from './project-team-builder.service';
import { AppConfigService } from '../configs/app-config.service';
import {
  AccountLicensesSuccessResponse,
  AccountLicensesErrorResponse,
  RawAccountLicensesResponse,
  AuthenticationErrorResponse,
} from '../interfaces/account-license.interface';

// Mock fetch globally
global.fetch = jest.fn();

// Helper function to create mock Response objects
const createMockResponse = (options: {
  ok: boolean;
  status?: number;
  statusText?: string;
  json: jest.Mock;
}): Response => {
  return {
    ok: options.ok,
    status: options.status || 200,
    statusText: options.statusText || 'OK',
    json: options.json,
    headers: new Headers(),
    redirected: false,
    type: 'default',
    url: '',
    body: null,
    bodyUsed: false,
    clone: jest.fn(),
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
    text: jest.fn(),
  } as unknown as Response;
};

describe('ProjectTeamBuilderService', () => {
  let service: ProjectTeamBuilderService;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  const mockAccountLicenses: RawAccountLicensesResponse = [
    {
      accountUuid: '6daa218b-cce4-4495-ae74-877692a6fd63',
      accountName: 'PE 5',
      identificationNumber: 'S7018005E',
      professionalLicenses: [
        {
          uuid: 'e04d0090-ec9a-47d4-9eef-9184bf6f1522',
          registrar: 'PEB',
          regNumber: '8003',
          valid: '2028-07-23T16:00:00.000Z',
          specialty: 'Mechanical',
        },
      ],
      availableRolesForAccountLicenses: [
        {
          roleKey: 'developer',
          regNumber: null,
        },
        {
          roleKey: 'professionalEngineerMechanical',
          regNumber: '8003',
        },
      ],
    },
  ];

  const mockAuthError: AuthenticationErrorResponse = {
    timestamp: '2025-01-27T10:00:00.000Z',
    success: false,
    status: 403,
    message: 'NOT_LOGGED_IN',
    errorCode: 'NOT_LOGGED_IN',
    stack: 'Error stack trace...',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectTeamBuilderService,
        {
          provide: AppConfigService,
          useValue: {
            getAccountLicensesUrl: jest
              .fn()
              .mockReturnValue(
                'http://localhost:8000/services/uat/project-team-builder/account-licenses',
              ),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectTeamBuilderService>(ProjectTeamBuilderService);
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

  describe('getAccountLicenses', () => {
    it('should successfully retrieve account licenses', async () => {
      // Arrange
      const mockResponse = createMockResponse({
        ok: true,
        json: jest.fn().mockResolvedValue(mockAccountLicenses),
      });
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.getAccountLicenses();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/services/uat/project-team-builder/account-licenses',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          signal: expect.any(AbortSignal) as unknown,
        },
      );

      expect(result).toEqual({
        success: true,
        data: mockAccountLicenses,
      } as AccountLicensesSuccessResponse);
    });

    it('should handle 403 authentication errors', async () => {
      // Arrange
      const mockResponse = createMockResponse({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: jest.fn().mockResolvedValue(mockAuthError),
      });
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.getAccountLicenses();

      // Assert
      expect(result).toEqual({
        success: false,
        error: {
          type: 'CLIENT_ERROR',
          statusCode: 403,
          message:
            'Authentication required. Please log in to access this resource.',
          details: {
            errorCode: 'NOT_LOGGED_IN',
            timestamp: '2025-01-27T10:00:00.000Z',
          },
        },
      } as AccountLicensesErrorResponse);
    });

    it('should handle 404 client errors', async () => {
      // Arrange
      const mockResponse = createMockResponse({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValue({
          message: 'Resource not found',
        }),
      });
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.getAccountLicenses();

      // Assert
      expect(result).toEqual({
        success: false,
        error: {
          type: 'CLIENT_ERROR',
          statusCode: 404,
          message: 'Resource not found',
          details: {
            message: 'Resource not found',
          } as unknown,
        },
      } as AccountLicensesErrorResponse);
    });

    it('should handle 500 server errors', async () => {
      // Arrange
      const mockResponse = createMockResponse({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValue({
          message: 'Internal server error',
        }),
      });
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.getAccountLicenses();

      // Assert
      expect(result).toEqual({
        success: false,
        error: {
          type: 'SERVER_ERROR',
          statusCode: 500,
          message: 'Internal server error',
          details: {
            message: 'Internal server error',
          } as unknown,
        },
      } as AccountLicensesErrorResponse);
    });

    it('should handle network errors', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Act
      const result = await service.getAccountLicenses();

      // Assert
      expect(result).toEqual({
        success: false,
        error: {
          type: 'NETWORK_ERROR',
          statusCode: 0,
          message: 'Unexpected error: Network error',
          details: {
            originalError: 'Network error',
          },
        },
      } as AccountLicensesErrorResponse);
    });

    it('should handle timeout errors', async () => {
      // Arrange
      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      // Act
      const result = await service.getAccountLicenses();

      // Assert
      expect(result).toEqual({
        success: false,
        error: {
          type: 'NETWORK_ERROR',
          statusCode: 0,
          message:
            'Request timeout: The request took longer than 5 seconds to complete',
          details: null,
        },
      } as AccountLicensesErrorResponse);
    });

    it('should handle unparseable error responses', async () => {
      // Arrange
      const mockResponse = createMockResponse({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      });
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.getAccountLicenses();

      // Assert
      expect(result).toEqual({
        success: false,
        error: {
          type: 'CLIENT_ERROR',
          statusCode: 400,
          message: 'Client error: Bad Request (400)',
          details: null,
        },
      } as AccountLicensesErrorResponse);
    });

    it('should handle unknown errors', async () => {
      // Arrange
      mockFetch.mockRejectedValue('Unknown error string');

      // Act
      const result = await service.getAccountLicenses();

      // Assert
      expect(result).toEqual({
        success: false,
        error: {
          type: 'NETWORK_ERROR',
          statusCode: 0,
          message: 'Unknown error occurred',
          details: {
            originalError: 'Unknown error string',
          },
        },
      } as AccountLicensesErrorResponse);
    });

    it('should use correct timeout configuration', async () => {
      // Arrange
      const mockResponse = createMockResponse({
        ok: true,
        json: jest.fn().mockResolvedValue(mockAccountLicenses),
      });
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      await service.getAccountLicenses();

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal) as unknown,
        }),
      );
    });

    it('should log successful responses', async () => {
      // Arrange
      const mockResponse = createMockResponse({
        ok: true,
        json: jest.fn().mockResolvedValue(mockAccountLicenses),
      });
      mockFetch.mockResolvedValue(mockResponse);
      const loggerSpy = jest.spyOn(Logger.prototype, 'log');

      // Act
      await service.getAccountLicenses();

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        'Fetching account licenses from: http://localhost:8000/services/uat/project-team-builder/account-licenses',
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        'Successfully retrieved 1 account licenses',
      );
    });

    it('should log error responses', async () => {
      // Arrange
      const mockResponse = createMockResponse({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValue({
          message: 'Internal server error',
        }),
      });
      mockFetch.mockResolvedValue(mockResponse);
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');

      // Act
      await service.getAccountLicenses();

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        'HTTP 500 error: Internal server error',
        { message: 'Internal server error' },
      );
    });
  });
});
