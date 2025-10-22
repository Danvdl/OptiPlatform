import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LoggerService, LogLevel } from '../common/logger.service';

@Resolver()
@UseGuards(JwtAuthGuard)
export class LogsResolver {
  constructor(private logger: LoggerService) {}

  @Query(() => String, { description: 'Get recent error logs (admin only)' })
  async getRecentErrors(
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ) {
    const errors = this.logger.getRecentErrors(limit || 50);
    return JSON.stringify(errors);
  }

  @Query(() => String, { description: 'Search logs by criteria (admin only)' })
  async searchLogs(
    @Args('level', { nullable: true }) level?: string,
    @Args('context', { nullable: true }) context?: string,
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ) {
    const results = this.logger.searchLogs({
      level: level as LogLevel,
      context,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit || 100,
    });
    
    return JSON.stringify(results);
  }

  @Query(() => String, { description: 'Get application health status' })
  async getHealthStatus() {
    const errors = this.logger.getRecentErrors(10);
    const recentErrorCount = errors.filter(
      e => new Date(e.timestamp) > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    ).length;

    return JSON.stringify({
      status: recentErrorCount > 10 ? 'unhealthy' : 'healthy',
      timestamp: new Date().toISOString(),
      recentErrors: recentErrorCount,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '0.1.0',
    });
  }
}
