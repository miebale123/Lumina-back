import { Controller, Delete, Get, Module, Param } from '@nestjs/common';
import { GetUser } from 'src/common';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { NotificationGateway } from './notification.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>) {}

  @Get()
  async getNotifications(@GetUser() user: User) {
    return this.notificationRepo.find({
      where: { user: { id: user.id } },
      relations: ['house', 'user'],
      order: { created_at: 'DESC' },
    });
  }

  @Delete('deleteNotification/:id')
  async deleteNotification(@Param('id') id: string, @GetUser() user: User) {
    const existing = await this.notificationRepo.findOne({
      where: { id, user: { id: user.id } },
      relations: ['user'],
    });

    const result = await this.notificationRepo.delete(id);
    return { result };
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [NotificationGateway],
  exports: [NotificationGateway]
})
export class NotificationsModule {}