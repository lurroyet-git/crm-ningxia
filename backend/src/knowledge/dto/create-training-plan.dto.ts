import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTrainingPlanDto {
  @ApiProperty({ description: '计划标题' })
  @IsString()
  title: string;

  @ApiProperty({ description: '培训类型', example: '技术培训' })
  @IsString()
  @IsIn(['技术培训', '产品培训', '管理培训'])
  type: string;

  @ApiPropertyOptional({ description: '培训对象' })
  @IsOptional()
  @IsString()
  target?: string;

  @ApiProperty({ description: '开始日期' })
  @IsString()
  startDate: string;

  @ApiProperty({ description: '结束日期' })
  @IsString()
  endDate: string;

  @ApiPropertyOptional({ description: '讲师' })
  @IsOptional()
  @IsString()
  instructor?: string;

  @ApiPropertyOptional({ description: '地点' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: '关联素材ID列表JSON' })
  @IsOptional()
  materialIds?: any;
}
