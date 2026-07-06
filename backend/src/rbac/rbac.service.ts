import { Injectable } from '@nestjs/common';

@Injectable()
export class RbacService {
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
}
