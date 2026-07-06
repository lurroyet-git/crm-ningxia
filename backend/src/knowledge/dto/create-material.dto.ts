import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMaterialDto {
  @ApiProperty({ description: '素材标题' })
  @IsString()
  title: string;

  @ApiProperty({ description: '类型', example: '方案' })
  @IsString()
  @IsIn(['方案', '培训', '案例', '工具', '文档'])
  type: string;

  @ApiProperty({ description: '分类' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ description: '标签JSON' })
  @IsOptional()
  tags?: any;

  @ApiPropertyOptional({ description: '内容' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: '文件URL' })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({ description: '文件大小' })
  @IsOptional()
  fileSize?: number;
}
