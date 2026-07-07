import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ description: '关联项目ID' })
  @IsString()
  projectId: string;

  @ApiProperty({ description: '任务标题' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: '任务描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '优先级', example: 'P2' })
  @IsOptional()
  @IsString()
  @IsIn(['P0', 'P1', 'P2', 'P3'])
  priority?: string;

  @ApiPropertyOptional({ description: '标签JSON' })
  @IsOptional()
  tags?: any;

  @ApiPropertyOptional({ description: '负责人ID' })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({ description: '看板列', example: '待跟进' })
  @IsOptional()
  @IsString()
  @IsIn(['本周重点', '进行中', '待跟进', '已完成'])
  column?: string;

  @ApiPropertyOptional({ description: '排序序号' })
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: '截止日期' })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional({ description: '进度 0-100' })
  @IsOptional()
  progress?: number;

  @ApiPropertyOptional({ description: '状态', example: '正常' })
  @IsOptional()
  @IsString()
  @IsIn(['正常', '预警', '阻塞'])
  status?: string;
}
