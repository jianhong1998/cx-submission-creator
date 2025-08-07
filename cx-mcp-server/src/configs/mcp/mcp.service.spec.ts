import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { McpService } from './mcp.service';
import { UserAccountService } from '../../external-services/services/user-account.service';
import { AuthenticationService } from '../../external-services/services/authentication.service';
import { getAllTools } from './tools/http.tools';

// Mock the UserAccountService
const mockUserAccountService = {
  getUserAccountLicenses: jest.fn(),
};

// Mock the AuthenticationService
const mockAuthenticationService = {
  authenticateAsUser: jest.fn(),
  validateSession: jest.fn(),
};

describe('McpService', () => {
  let service: McpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        McpService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:8000'),
          },
        },
        {
          provide: UserAccountService,
          useValue: mockUserAccountService,
        },
        {
          provide: AuthenticationService,
          useValue: mockAuthenticationService,
        },
      ],
    }).compile();

    service = module.get<McpService>(McpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('tool registration', () => {
    it('should include list_users tool in available tools', () => {
      const tools = getAllTools();
      const listUsersTool = tools.find((tool) => tool.name === 'list_users');

      expect(listUsersTool).toBeDefined();
      expect(listUsersTool?.name).toBe('list_users');
      expect(listUsersTool?.description).toContain(
        'Retrieve a list of all users',
      );
    });

    it('should include login_as_user tool in available tools', () => {
      const tools = getAllTools();
      const loginAsUserTool = tools.find(
        (tool) => tool.name === 'login_as_user',
      );

      expect(loginAsUserTool).toBeDefined();
      expect(loginAsUserTool?.name).toBe('login_as_user');
      expect(loginAsUserTool?.description).toContain(
        'Authenticate as a specific user',
      );
    });
  });

  describe('handleListUsers', () => {
    it('should call ProjectTeamBuilderService.getUserAccountLicenses', async () => {
      const mockResult = {
        success: true,
        data: [
          {
            accountUuid: 'test-uuid',
            accountName: 'Test User',
            identificationNumber: 'S1234567A',
            professionalLicenses: [],
            availableRolesForAccountLicenses: [],
          },
        ],
      };

      mockUserAccountService.getUserAccountLicenses.mockResolvedValue(
        mockResult,
      );

      const result = await (
        service as unknown as { handleListUsers: () => Promise<unknown> }
      ).handleListUsers();

      expect(mockUserAccountService.getUserAccountLicenses).toHaveBeenCalled();
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockResult, null, 2),
          },
        ],
      });
    });

    it('should handle errors from ProjectTeamBuilderService', async () => {
      const mockError = new Error('Service unavailable');
      mockUserAccountService.getUserAccountLicenses.mockRejectedValue(
        mockError,
      );

      await expect(
        (
          service as unknown as { handleListUsers: () => Promise<unknown> }
        ).handleListUsers(),
      ).rejects.toThrow('Failed to list users: Service unavailable');
    });
  });

  describe('handleLoginAsUser', () => {
    const mockAccountUuid = '6daa218b-cce4-4495-ae74-877692a6fd63';

    it('should call AuthenticationService.authenticateAsUser with valid parameters', async () => {
      const mockResult = {
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
        timestamp: '2025-01-01T12:00:00.000Z',
      };

      mockAuthenticationService.authenticateAsUser.mockResolvedValue(
        mockResult,
      );

      const result = await (
        service as unknown as {
          handleLoginAsUser: (args: unknown) => Promise<unknown>;
        }
      ).handleLoginAsUser({ accountUuid: mockAccountUuid });

      expect(mockAuthenticationService.authenticateAsUser).toHaveBeenCalledWith(
        mockAccountUuid,
      );
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockResult, null, 2),
          },
        ],
      });
    });

    it('should handle validation errors for missing accountUuid', async () => {
      await expect(
        (
          service as unknown as {
            handleLoginAsUser: (args: unknown) => Promise<unknown>;
          }
        ).handleLoginAsUser({}),
      ).rejects.toThrow('Validation failed');
    });

    it('should handle validation errors for invalid accountUuid', async () => {
      await expect(
        (
          service as unknown as {
            handleLoginAsUser: (args: unknown) => Promise<unknown>;
          }
        ).handleLoginAsUser({ accountUuid: '' }),
      ).rejects.toThrow('Validation failed');
    });

    it('should handle authentication service errors', async () => {
      const mockError = new Error('Authentication service unavailable');
      mockAuthenticationService.authenticateAsUser.mockRejectedValue(mockError);

      await expect(
        (
          service as unknown as {
            handleLoginAsUser: (args: unknown) => Promise<unknown>;
          }
        ).handleLoginAsUser({ accountUuid: mockAccountUuid }),
      ).rejects.toThrow(
        'Failed to authenticate as user: Authentication service unavailable',
      );
    });

    it('should handle authentication failures gracefully', async () => {
      const mockErrorResult = {
        success: false,
        error: {
          type: 'CLIENT_ERROR',
          statusCode: 403,
          message: 'Authentication failed for account test-uuid',
          details: {
            accountUuid: 'test-uuid',
            responseStatus: 403,
            responseText: 'Forbidden',
          },
        },
        operation: 'login_as_user',
        timestamp: '2025-01-01T12:00:00.000Z',
      };

      mockAuthenticationService.authenticateAsUser.mockResolvedValue(
        mockErrorResult,
      );

      const result = await (
        service as unknown as {
          handleLoginAsUser: (args: unknown) => Promise<unknown>;
        }
      ).handleLoginAsUser({ accountUuid: mockAccountUuid });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockErrorResult, null, 2),
          },
        ],
      });
    });
  });
});
