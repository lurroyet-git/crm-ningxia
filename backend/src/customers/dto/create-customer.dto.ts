import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ description: '客户名称' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '类型' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: '城市' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: '区县' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: '地址' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: '行业' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ description: '等级', example: 'B' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ description: '健康状态', example: '健康' })
  @IsOptional()
  @IsString()
  healthStatus?: string;

  @ApiPropertyOptional({ description: '信用等级' })
  @IsOptional()
  @IsString()
  creditLevel?: string;

  @ApiPropertyOptional({ description: '来源' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: '年收入' })
  @IsOptional()
  @IsString()
  annualRevenue?: string;

  @ApiPropertyOptional({ description: '员工数' })
  @IsOptional()
  @IsString()
  employeeCount?: string;

  @ApiProperty({ description: '负责人ID' })
  @IsString()
  ownerId: string;

  @ApiPropertyOptional({ description: '联系电话' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ description: '联系邮箱' })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}
