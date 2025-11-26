import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { LoggerService } from '../src/common/logger.service';
import * as fs from 'fs';

vi.mock('fs');

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggerService],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
    
    // Mock fs methods
    (fs.existsSync as any).mockReturnValue(true);
    (fs.mkdirSync as any).mockImplementation();
    (fs.appendFileSync as any).mockImplementation();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should log info message', () => {
      service.log('Test message', 'TestContext');
      expect(fs.appendFileSync).toHaveBeenCalled();
    });

    it('should log with additional data', () => {
      service.log('Test message', 'TestContext', { key: 'value' });
      expect(fs.appendFileSync).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      service.error('Error message', 'Stack trace', 'TestContext');
      expect(fs.appendFileSync).toHaveBeenCalled();
    });

    it('should log error with data', () => {
      service.error('Error message', 'Stack trace', 'TestContext', { error: 'details' });
      expect(fs.appendFileSync).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      service.warn('Warning message', 'TestContext');
      expect(fs.appendFileSync).toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('should log debug message in non-production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      service.debug('Debug message', 'TestContext');
      expect(fs.appendFileSync).toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('verbose', () => {
    it('should log verbose message', () => {
      service.verbose('Verbose message', 'TestContext');
      expect(fs.appendFileSync).toHaveBeenCalled();
    });
  });
});
