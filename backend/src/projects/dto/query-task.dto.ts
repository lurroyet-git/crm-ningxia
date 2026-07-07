import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryTaskDto {
  @ApiPropertyOptional({ description: '关联项目ID' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: '关键词搜索（标题）' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '优先级' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ description: '看板列' })
  @IsOptional()
  @IsString()
  column?: string;

  @ApiPropertyOptional({ description: '负责人ID' })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({ description: '页码', default: '1' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ description: '每页条数', default: '10' })
  @IsOptional()
  @IsString()
  pageSize?: string;
}
