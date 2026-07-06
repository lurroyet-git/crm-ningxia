import { IsString, IsOptional, IsIn, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOpsRuleDto {
  @ApiProperty({ description: '规则名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '规则类型', example: '自动化' })
  @IsString()
  @IsIn(['自动化', '预警', 'SLA', '质量'])
  type: string;

  @ApiProperty({ description: '规则条件JSON' })
  @IsString()
  condition: string;

  @ApiProperty({ description: '执行动作JSON' })
  @IsString()
  action: string;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  enabled?: boolean = true;
}
