import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOpsRecordDto {
  @ApiPropertyOptional({ description: '工单标题' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '工单类型' })
  @IsOptional()
  @IsString()
  @IsIn(['故障', '变更', '咨询', '其他'])
  type?: string;

  @ApiPropertyOptional({ description: '优先级' })
  @IsOptional()
  @IsString()
  @IsIn(['高', '中', '低'])
  priority?: string;

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  @IsIn(['待处理', '处理中', '已完成', '已关闭'])
  status?: string;

  @ApiPropertyOptional({ description: '关联项目ID' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: '关联客户ID' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: '处理人ID' })
  @IsOptional()
  @IsString()
  handlerId?: string;

  @ApiPropertyOptional({ description: '问题描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '解决方案' })
  @IsOptional()
  @IsString()
  solution?: string;

  @ApiPropertyOptional({ description: 'SLA截止时间' })
  @IsOptional()
  @IsString()
  slaDeadline?: string;
}
