import { IsString, IsOptional, IsIn, IsJSON } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInspectionPlanDto {
  @ApiProperty({ description: '计划名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '巡检类型', example: '日常巡检' })
  @IsString()
  @IsIn(['日常巡检', '深度巡检', '专项巡检'])
  type: string;

  @ApiProperty({ description: '频率', example: '每周' })
  @IsString()
  @IsIn(['每日', '每周', '每月'])
  frequency: string;

  @ApiPropertyOptional({ description: '周期次数', default: 1 })
  @IsOptional()
  cycle?: number = 1;

  @ApiProperty({ description: '开始日期' })
  @IsString()
  startDate: string;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({ description: '执行人ID' })
  @IsString()
  executorId: string;

  @ApiProperty({ description: '巡检项JSON', example: '[{"content":"检查服务器CPU","standard":"<80%","method":"top命令"}]' })
  items: any;
}
