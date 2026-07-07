import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AssignRoleDto } from './dto/assign-role.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RbacService } from './rbac.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('权限管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @ApiOperation({ summary: '获取所有角色' })
  @Get('roles')
  async findAllRoles() {
    return this.rbacService.findAllRoles();
  }

  @ApiOperation({ summary: '获取角色详情' })
  @Get('roles/:id')
  async findRoleById(@Param('id', ParseUUIDPipe) id: string) {
    return this.rbacService.findRoleById(id);
  }

  @ApiOperation({ summary: '创建角色' })
  @Post('roles')
  async createRole(@Body() dto: CreateRoleDto) {
    return this.rbacService.createRole(dto);
  }

  @ApiOperation({ summary: '更新角色' })
  @Put('roles/:id')
  async updateRole(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
    return this.rbacService.updateRole(id, dto);
  }

  @ApiOperation({ summary: '删除角色' })
  @Delete('roles/:id')
  async deleteRole(@Param('id', ParseUUIDPipe) id: string) {
    return this.rbacService.deleteRole(id);
  }

  @ApiOperation({ summary: '分配角色给用户' })
  @Post('assign')
  async assignRoleToUser(@Body() dto: AssignRoleDto) {
    return this.rbacService.assignRoleToUser(dto.userId, dto.roleId);
  }

  @ApiOperation({ summary: '获取用户角色' })
  @Get('users/:userId/roles')
  async getUserRoles(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.rbacService.getUserRoles(userId);
  }

  @ApiOperation({ summary: '获取所有权限列表' })
  @Get('permissions')
  async findAllPermissions() {
    return this.rbacService.findAllPermissions();
  }
}
