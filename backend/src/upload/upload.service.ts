import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * 文件上传服务
 * 
 * 依赖安装说明：
 * - 如需接入 MinIO，请安装: npm install minio
 * - 类型声明需安装: npm install -D @types/multer
 * - 当前实现为本地存储模式，上传文件保存在 ./uploads 目录
 * - 生产环境建议接入 MinIO/S3 对象存储
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  /**
   * 上传文件（通用）
   * 文件命名规则: {uuid}-{timestamp}-{originalname}
   */
  async uploadFile(file: any, purpose?: string): Promise<{ url: string; name: string; size: number; mimeType: string }> {
    try {
      const timestamp = Date.now();
      const uuid = crypto.randomUUID();
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\u4e00-\u9fa5_-]/g, '_');
      const filename = `${uuid}-${timestamp}-${sanitizedName}`;

      // TODO: 接入 MinIO 后替换为以下代码
      // const minioClient = new Client({ endPoint: 'localhost', port: 9000, useSSL: false, accessKey: 'minio', secretKey: 'minio123' });
      // await minioClient.putObject('crm-bucket', filename, file.buffer, file.size, { 'Content-Type': file.mimetype });
      // const url = await minioClient.presignedGetObject('crm-bucket', filename, 24 * 60 * 60);

      // 当前返回模拟 URL
      const url = `/uploads/${purpose || 'files'}/${filename}`;

      this.logger.log(`文件上传成功: ${filename}, purpose=${purpose || 'general'}`);

      return {
        url,
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      this.logger.error('uploadFile failed', error);
      throw error;
    }
  }

  async uploadAvatar(file: any): Promise<{ url: string; name: string; size: number; mimeType: string }> {
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('头像文件大小不能超过 2MB');
    }
    return this.uploadFile(file, 'avatars');
  }

  async uploadBatch(files: any[]): Promise<Array<{ url: string; name: string; size: number; mimeType: string }>> {
    try {
      const results = await Promise.all(files.map((file) => this.uploadFile(file, 'batch')));
      return results;
    } catch (error) {
      this.logger.error('uploadBatch failed', error);
      throw error;
    }
  }
}
