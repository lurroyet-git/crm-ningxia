import { IsOptional, IsString, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryCustomerDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumberString()
  page?: string = '1';

  @ApiPropertyOptional({ description: '每页条数', default: 10 })
  @IsOptional()
  @IsNumberString()
  pageSize?: string = '10';

  @ApiPropertyOptional({ description: '关键词（匹配名称）' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '等级筛选' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ description: '健康状态筛选' })
  @IsOptional()
  @IsString()
  healthStatus?: string;

  @ApiPropertyOptional({ description: '城市筛选' })
  @IsOptional()
  @IsString()
  city?: string;
}
