import { IsString, IsOptional, IsDateString, IsNumberString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ description: '项目名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '客户ID' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: '项目经理ID' })
  @IsString()
  pmId: string;

  @ApiProperty({ description: '阶段', example: '需求' })
  @IsString()
  stage: string;

  @ApiProperty({ description: '计划开始日期' })
  @IsDateString()
  planStart: string;

  @ApiProperty({ description: '计划结束日期' })
  @IsDateString()
  planEnd: string;

  @ApiPropertyOptional({ description: '项目描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '预算' })
  @IsOptional()
  @IsString()
  budget?: string;
}
