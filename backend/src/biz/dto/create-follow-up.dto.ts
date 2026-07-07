import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFollowUpDto {
  @ApiPropertyOptional({ description: '关联商机ID' })
  @IsOptional()
  @IsString()
  opportunityId?: string;

  @ApiPropertyOptional({ description: '关联客户ID' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ description: '跟进类型', example: '电话' })
  @IsString()
  @IsIn(['电话', '邮件', '拜访', '会议', '其他'])
  type: string;

  @ApiProperty({ description: '跟进内容' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: '下次计划' })
  @IsOptional()
  @IsString()
  nextPlan?: string;

  @ApiPropertyOptional({ description: '下次日期' })
  @IsOptional()
  @IsString()
  nextDate?: string;
}
