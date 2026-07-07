import { IsString, IsOptional, IsIn, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMeetingDto {
  @ApiProperty({ description: '关联项目ID' })
  @IsString()
  projectId: string;

  @ApiProperty({ description: '会议主题' })
  @IsString()
  title: string;

  @ApiProperty({ description: '会议类型', example: '周会' })
  @IsString()
  @IsIn(['周会', '评审会', '复盘会', '汇报会', '协调会', '项目启动', '方案评审', '需求确认'])
  type: string;

  @ApiProperty({ description: '开始时间' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: '结束时间' })
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ description: '会议地点' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: '参会人员JSON' })
  @IsOptional()
  attendees?: any;

  @ApiPropertyOptional({ description: '会议纪要' })
  @IsOptional()
  @IsString()
  minutes?: string;

  @ApiPropertyOptional({ description: '待办事项JSON' })
  @IsOptional()
  todos?: any;

  @ApiPropertyOptional({ description: '附件JSON' })
  @IsOptional()
  attachments?: any;

  @ApiPropertyOptional({ description: '是否开启提醒', default: true })
  @IsOptional()
  @IsBoolean()
  reminder?: boolean;
}
