import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  /**
   * 检查用户是否有权限访问指定菜单
   */
  hasPermission(userPermissions: any[], menuId: string, action: string): boolean {
    if (!userPermissions) return false;
    // 超级管理员
    const hasWildcard = userPermissions.some((p) => p.menuId === '*');
    if (hasWildcard) return true;

    const perm = userPermissions.find((p) => p.menuId === menuId);
    if (!perm) return false;
    if (perm.actions.includes('*')) return true;
    return perm.actions.includes(action);
  }

  findAllRoles(): Promise<any[]> {
    return this.prisma.role.findMany();
  }

  findRoleById(id: string): Promise<any> {
    return this.prisma.role.findUnique({ where: { id } });
  }

  createRole(dto: CreateRoleDto): Promise<any> {
    return this.prisma.role.create({ data: dto as any });
  }

  updateRole(id: string, dto: UpdateRoleDto): Promise<any> {
    return this.prisma.role.update({ where: { id }, data: dto as any });
  }

  deleteRole(id: string): Promise<any> {
    return this.prisma.role.delete({ where: { id } });
  }

  assignRoleToUser(userId: string, roleId: string): Promise<any> {
    return this.prisma.user.update({ where: { id: userId }, data: { roleId } });
  }

  getUserRoles(userId: string): Promise<any> {
    return this.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
  }

  findAllPermissions(): Promise<any[]> {
    const permissions = [
      { menuId: 'dashboard', actions: ['view', 'manage'] },
      { menuId: 'customers', actions: ['view', 'create', 'update', 'delete', 'export'] },
      { menuId: 'projects', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { menuId: 'ops', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { menuId: 'biz', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { menuId: 'knowledge', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { menuId: 'users', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { menuId: 'rbac', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { menuId: 'notifications', actions: ['view', 'manage'] },
      { menuId: 'data-quality', actions: ['view', 'manage'] },
      { menuId: 'changes', actions: ['view', 'manage'] },
      { menuId: 'settings', actions: ['view', 'manage'] },
    ];
    return Promise.resolve(permissions);
  }
}
