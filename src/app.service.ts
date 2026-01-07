import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly startTime = Date.now();

  getHello(): string {
    return 'STUDY BACKEND API';
  }

  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000), // seconds
      service: 'study-app-backend',
      version: '1.0.0',
    };
  }
}
