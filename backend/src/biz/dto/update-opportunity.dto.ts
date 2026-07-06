import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOpportunityDto {
  @ApiPropertyOptional({ description: '商机标题' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '关联客户ID' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: '预计金额' })
  @IsOptional()
  @IsString()
  amount?: string;

  @ApiPropertyOptional({ description: '阶段' })
  @IsOptional()
  @IsString()
  @IsIn(['线索', '商机', '方案', '报价', '谈判', '赢单', '丢单'])
  stage?: string;

  @ApiPropertyOptional({ description: '赢单概率 0-100' })
  @IsOptional()
  probability?: number;

  @ApiPropertyOptional({ description: '预计成交日期' })
  @IsOptional()
  @IsString()
  expectedCloseDate?: string;

  @ApiPropertyOptional({ description: '来源' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: '负责人ID' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ description: '商机描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '竞争对手' })
  @IsOptional()
  @IsString()
  competitors?: string;

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string;
}
