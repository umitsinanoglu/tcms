import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const userIdHeader = request.headers['x-user-id'] as string | undefined;
    const userRoleHeader = (request.headers['x-user-role'] as string | undefined)?.toUpperCase();

    let currentUser: any = null;

    if (userIdHeader) {
      currentUser = await this.prisma.user.findUnique({
        where: { id: userIdHeader },
      });
    }

    // Role resolution priority: DB user role -> header role -> default fallback ADMIN
    const effectiveRole = (currentUser?.role || userRoleHeader || Role.ADMIN) as Role;

    request.user = {
      id: currentUser?.id || userIdHeader || 'system-user',
      email: currentUser?.email || (request.headers['x-user-email'] as string) || 'admin@ttb.com.tr',
      name: currentUser?.name || (request.headers['x-user-name'] as string) || 'System Admin',
      role: effectiveRole,
      isActive: currentUser ? currentUser.isActive : true,
    };

    // If user is inactive, reject
    if (currentUser && !currentUser.isActive) {
      throw new ForbiddenException('Kullanıcı hesabı pasifleştirilmiştir.');
    }

    // If no roles specified on endpoint, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const hasRole = requiredRoles.includes(effectiveRole);
    if (!hasRole) {
      throw new ForbiddenException(
        `Bu işlem için '${requiredRoles.join(', ')}' rollerinden biri gerekmektedir. Mevcut rolünüz: '${effectiveRole}'.`,
      );
    }

    return true;
  }
}
