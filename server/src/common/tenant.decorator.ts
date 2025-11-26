import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * Tenant ID decorator for GraphQL resolvers
 * Extracts tenantId from JWT token in the request context
 * 
 * Usage:
 * @Query(() => [Product])
 * @UseGuards(JwtAuthGuard)
 * products(@TenantId() tenantId: string) {
 *   return this.service.findAllProducts(tenantId);
 * }
 */
export const TenantId = createParamDecorator(
  (data: unknown, context: ExecutionContext): string => {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    
    // Extract tenantId from JWT payload (set by JwtStrategy)
    const tenantId = request.user?.tenantId;
    
    if (!tenantId) {
      throw new UnauthorizedException(
        'No tenant context found. User must be associated with a tenant.'
      );
    }
    
    return tenantId;
  },
);

/**
 * Current User decorator for GraphQL resolvers
 * Extracts full user object from JWT token
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    return request.user;
  },
);
