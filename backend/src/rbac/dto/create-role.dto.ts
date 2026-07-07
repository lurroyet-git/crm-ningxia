import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class PermissionItemDto {
  @ApiProperty({ description: '菜单ID' })
  @IsString()
  @IsNotEmpty()
  menuId: string;

  @ApiProperty({ description: '允许的操作', type: [String] })
  @IsArray()
  @IsString({ each: true })
  actions: string[];
}

export class CreateRoleDto {
  @ApiProperty({ description: '角色名称' })
  @IsNotEmpty({ message: '角色名称不能为空' })
  @IsString()
  name: string;

  @ApiProperty({ description: '角色编码' })
  @IsNotEmpty({ message: '角色编码不能为空' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: '角色描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '权限配置', type: [PermissionItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionItemDto)
  permissions?: PermissionItemDto[];
}
