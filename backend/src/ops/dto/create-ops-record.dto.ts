import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOpsRecordDto {
  @ApiProperty({ description: '工单标题' })
  @IsString()
  title: string;

  @ApiProperty({ description: '工单类型', example: '故障' })
  @IsString()
  @IsIn(['故障', '变更', '咨询', '其他'])
  type: string;

  @ApiPropertyOptional({ description: '优先级', example: '中' })
  @IsOptional()
  @IsString()
  @IsIn(['高', '中', '低'])
  priority?: string = '中';

  @ApiPropertyOptional({ description: '关联项目ID' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: '关联客户ID' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ description: '处理人ID' })
  @IsString()
  handlerId: string;

  @ApiPropertyOptional({ description: '问题描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'SLA截止时间' })
  @IsOptional()
  @IsString()
  slaDeadline?: string;
}
