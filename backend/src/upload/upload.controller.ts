import { Controller, Post, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { UploadFileDto } from './dto/upload-file.dto';

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @ApiOperation({ summary: '文件上传' })
  @ApiConsumes('multipart/form-data')
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: any, @Body() dto: UploadFileDto) {
    return this.uploadService.uploadFile(file, dto.purpose);
  }

  @ApiOperation({ summary: '头像上传（限制2MB）' })
  @ApiConsumes('multipart/form-data')
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: any) {
    return this.uploadService.uploadAvatar(file);
  }

  @ApiOperation({ summary: '批量上传' })
  @ApiConsumes('multipart/form-data')
  @Post('batch')
  @UseInterceptors(FileInterceptor('files'))
  async uploadBatch(@UploadedFile() files: any[]) {
    return this.uploadService.uploadBatch(files);
  }
}
