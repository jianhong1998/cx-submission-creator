import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { McpService } from './mcp.service';
import { ProjectTeamBuilderService } from '../../project-team-builder/project-team-builder.service';
import { getAllTools } from './tools/http.tools';

// Mock the ProjectTeamBuilderService
const mockProjectTeamBuilderService = {
  getAccountLicenses: jest.fn(),
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
          provide: ProjectTeamBuilderService,
          useValue: mockProjectTeamBuilderService,
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
  });

  describe('handleListUsers', () => {
    it('should call ProjectTeamBuilderService.getAccountLicenses', async () => {
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

      mockProjectTeamBuilderService.getAccountLicenses.mockResolvedValue(
        mockResult,
      );

      const result = await (
        service as unknown as { handleListUsers: () => Promise<unknown> }
      ).handleListUsers();

      expect(
        mockProjectTeamBuilderService.getAccountLicenses,
      ).toHaveBeenCalled();
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
      mockProjectTeamBuilderService.getAccountLicenses.mockRejectedValue(
        mockError,
      );

      await expect(
        (
          service as unknown as { handleListUsers: () => Promise<unknown> }
        ).handleListUsers(),
      ).rejects.toThrow('Failed to list users: Service unavailable');
    });
  });
});
