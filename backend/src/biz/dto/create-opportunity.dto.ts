import { IsString, IsOptional, IsIn, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOpportunityDto {
  @ApiProperty({ description: '商机标题' })
  @IsString()
  title: string;

  @ApiProperty({ description: '关联客户ID' })
  @IsString()
  customerId: string;

  @ApiPropertyOptional({ description: '预计金额' })
  @IsOptional()
  @IsString()
  amount?: string;

  @ApiPropertyOptional({ description: '阶段', example: '线索' })
  @IsOptional()
  @IsString()
  @IsIn(['线索', '商机', '方案', '报价', '谈判', '赢单', '丢单'])
  stage?: string = '线索';

  @ApiPropertyOptional({ description: '赢单概率 0-100', default: 10 })
  @IsOptional()
  probability?: number = 10;

  @ApiPropertyOptional({ description: '预计成交日期' })
  @IsOptional()
  @IsString()
  expectedCloseDate?: string;

  @ApiPropertyOptional({ description: '来源' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({ description: '负责人ID' })
  @IsString()
  ownerId: string;

  @ApiPropertyOptional({ description: '商机描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '竞争对手' })
  @IsOptional()
  @IsString()
  competitors?: string;

  @ApiPropertyOptional({ description: '状态', example: '跟进中' })
  @IsOptional()
  @IsString()
  status?: string = '跟进中';
}
