import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditQueryService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  // Get all logs
  async getAllLogs() {
    return this.auditRepo.find({
      order: { createdAt: 'DESC' }, // latest first
    });
  }

  // Get logs by IP address
  async getLogsByIp(ip: string) {
    return this.auditRepo.find({
      where: { ip },
      order: { createdAt: 'DESC' },
    });
  }

  // Get logs by user (guest or specific userId)
  async getLogsByUser(userId: string) {
    return this.auditRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // Get logs filtered by action (e.g., failed login attempts)
  async getLogsByAction(action: string) {
    return this.auditRepo
      .createQueryBuilder('audit')
      .where('audit.action LIKE :action', { action: `%${action}%` })
      .orderBy('audit.createdAt', 'DESC')
      .getMany();
  }
}
