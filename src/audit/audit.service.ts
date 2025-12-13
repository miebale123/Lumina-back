import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(
    userId: string,
    action: string,
    metadata?: Record<string, any>,
    ip?: string,
    userAgent?: string,
  ) {
    const audit = this.auditRepo.create({
      userId,
      action,
      metadata,
      ip,
      userAgent,
    });
    return this.auditRepo.save(audit);
  }
}
