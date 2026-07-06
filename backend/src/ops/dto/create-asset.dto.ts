import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssetDto {
  @ApiProperty({ description: '资产名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '资产类别', example: '服务器' })
  @IsString()
  @IsIn(['服务器', '网络', '存储', '安全', '办公'])
  category: string;

  @ApiPropertyOptional({ description: '型号' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: '厂商' })
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiPropertyOptional({ description: '位置' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: '状态', example: '正常' })
  @IsOptional()
  @IsString()
  @IsIn(['正常', '维修', '报废', '闲置'])
  status?: string = '正常';

  @ApiPropertyOptional({ description: '采购日期' })
  @IsOptional()
  @IsString()
  purchaseDate?: string;

  @ApiPropertyOptional({ description: '保修截止日期' })
  @IsOptional()
  @IsString()
  warrantyDate?: string;

  @ApiPropertyOptional({ description: '价格' })
  @IsOptional()
  @IsString()
  price?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}
