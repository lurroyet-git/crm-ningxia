import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVisitPlanDto {
  @ApiProperty({ description: '关联客户ID' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: '拜访目的' })
  @IsString()
  purpose: string;

  @ApiProperty({ description: '拜访日期' })
  @IsString()
  visitDate: string;

  @ApiPropertyOptional({ description: '拜访时间' })
  @IsOptional()
  @IsString()
  visitTime?: string;

  @ApiPropertyOptional({ description: '参与人员JSON' })
  @IsOptional()
  attendees?: any;

  @ApiPropertyOptional({ description: '地点' })
  @IsOptional()
  @IsString()
  location?: string;
}
