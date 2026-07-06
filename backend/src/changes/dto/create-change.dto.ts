import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChangeDto {
  @ApiProperty({ description: '关联客户ID' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: '变更类型', example: '工商变更' })
  @IsString()
  @IsIn(['工商变更', '人事变动', '业务扩展', '负面舆情'])
  changeType: string;

  @ApiPropertyOptional({ description: '旧值' })
  @IsOptional()
  @IsString()
  oldValue?: string;

  @ApiPropertyOptional({ description: '新值' })
  @IsOptional()
  @IsString()
  newValue?: string;

  @ApiPropertyOptional({ description: '数据来源' })
  @IsOptional()
  @IsString()
  source?: string;
}
