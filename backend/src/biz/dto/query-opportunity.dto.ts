import { IsOptional, IsString, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryOpportunityDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumberString()
  page?: string = '1';

  @ApiPropertyOptional({ description: '每页条数', default: 10 })
  @IsOptional()
  @IsNumberString()
  pageSize?: string = '10';

  @ApiPropertyOptional({ description: '关键词（匹配标题）' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '阶段筛选' })
  @IsOptional()
  @IsString()
  stage?: string;

  @ApiPropertyOptional({ description: '金额范围最小值' })
  @IsOptional()
  @IsString()
  amountMin?: string;

  @ApiPropertyOptional({ description: '金额范围最大值' })
  @IsOptional()
  @IsString()
  amountMax?: string;
}
