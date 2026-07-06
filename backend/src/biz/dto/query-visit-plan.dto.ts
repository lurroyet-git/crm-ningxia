import { IsOptional, IsString, IsIn, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryVisitPlanDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumberString()
  page?: string = '1';

  @ApiPropertyOptional({ description: '每页条数', default: 10 })
  @IsOptional()
  @IsNumberString()
  pageSize?: string = '10';

  @ApiPropertyOptional({ description: '日期筛选（YYYY-MM-DD）' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ description: '状态筛选' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '视图类型', example: 'list' })
  @IsOptional()
  @IsString()
  @IsIn(['list', 'calendar'])
  view?: string;
}
