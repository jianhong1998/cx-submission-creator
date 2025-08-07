/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from './app-config.service';

describe('AppConfigService', () => {
  let service: AppConfigService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppConfigService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn() as jest.MockedFunction<ConfigService['get']>,
          },
        },
      ],
    }).compile();

    service = module.get<AppConfigService>(AppConfigService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBackendHostname', () => {
    it('should return the configured backend hostname', () => {
      const mockHostname = 'http://localhost:8000';
      jest.spyOn(configService, 'get').mockReturnValue(mockHostname);

      const result = service.getBackendHostname();
      expect(result).toBe(mockHostname);
      expect(configService.get).toHaveBeenCalledWith('BACKEND_HOSTNAME');
    });

    it('should throw error when BACKEND_HOSTNAME is not configured', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      expect(() => {
        service.getBackendHostname();
      }).toThrow('BACKEND_HOSTNAME environment variable is required');
    });
  });

  describe('getAccountLicensesUrl', () => {
    it('should return the complete account licenses URL', () => {
      const mockHostname = 'http://localhost:8000';
      jest.spyOn(configService, 'get').mockReturnValue(mockHostname);

      const result = service.getAccountLicensesUrl();
      expect(result).toBe(
        'http://localhost:8000/services/uat/project-team-builder/account-licenses',
      );
    });
  });

  describe('getLoginUrl', () => {
    it('should return the complete login URL with account UUID', () => {
      const mockHostname = 'http://localhost:8000';
      const mockAccountUuid = '6daa218b-cce4-4495-ae74-877692a6fd63';
      jest.spyOn(configService, 'get').mockReturnValue(mockHostname);

      const result = service.getLoginUrl(mockAccountUuid);
      expect(result).toBe(
        `http://localhost:8000/services/uat/login?uuid=${mockAccountUuid}`,
      );
    });
  });

  describe('getNodeEnv', () => {
    it('should return the configured NODE_ENV', () => {
      jest.spyOn(configService, 'get').mockReturnValue('production');

      const result = service.getNodeEnv();
      expect(result).toBe('production');
      expect(configService.get).toHaveBeenCalledWith('NODE_ENV');
    });

    it('should return default value when NODE_ENV is not configured', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      const result = service.getNodeEnv();
      expect(result).toBe('development');
      expect(configService.get).toHaveBeenCalledWith('NODE_ENV');
    });
  });

  describe('getAppPort', () => {
    it('should return the configured APP_PORT as number', () => {
      jest.spyOn(configService, 'get').mockReturnValue('3003');

      const result = service.getAppPort();
      expect(result).toBe(3003);
      expect(configService.get).toHaveBeenCalledWith('APP_PORT');
    });

    it('should return default value when APP_PORT is not configured', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      const result = service.getAppPort();
      expect(result).toBe(3002);
      expect(configService.get).toHaveBeenCalledWith('APP_PORT');
    });
  });

  describe('isDevelopment', () => {
    it('should return true when NODE_ENV is development', () => {
      jest.spyOn(configService, 'get').mockReturnValue('development');

      const result = service.isDevelopment();
      expect(result).toBe(true);
    });

    it('should return false when NODE_ENV is not development', () => {
      jest.spyOn(configService, 'get').mockReturnValue('production');

      const result = service.isDevelopment();
      expect(result).toBe(false);
    });
  });
});
