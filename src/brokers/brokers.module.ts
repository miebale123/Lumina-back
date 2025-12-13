import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Module,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { GetUser } from 'src/common';
import { User } from 'src/users/entities/user.entity';
import { Broker } from './broker.entity';
import { Repository } from 'typeorm';
import { MailModule, MailService } from 'src/mail/mail.module';
import { NotificationGateway } from 'src/notifications/notification.service';
import { House } from 'src/houses/houses.entity';
import { Notification } from 'src/notifications/notification.entity';
import { BrokerDto } from './broker.dto';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Controller('brokers')
export class BrokersController {
  constructor(
    @InjectRepository(Broker)
    private brokerRepo: Repository<Broker>,

    private notificationGateway: NotificationGateway,
    private mailService: MailService,
    private cloudinaryService: CloudinaryService,

    @InjectRepository(House)
    private houseRepository: Repository<House>,

    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  @UseInterceptors(FileInterceptor('file'))
  @Post('upload-broker-info')
  async uploadBrokerInfo(
    @UploadedFile() file: Express.Multer.File,

    @Body() dto: BrokerDto,
    @GetUser() user: User,
  ) {
    if (!file) throw new BadRequestException('File not received');
    const result = await this.cloudinaryService.uploadFile(file.buffer);

    const newBroker = this.brokerRepo.create({
      secure_url: result.secure_url,
      brokerCompanyName: dto.brokerCompanyName,
      location: dto.location,
      status: 'pending',
      user,
    });

    const savedBroker = await this.brokerRepo.save(newBroker);

    return { savedBroker };
  }

  @Get('pendingHouses')
  async getPendingHouses(@GetUser() user: User) {
    const broker = await this.brokerRepo.findOne({
      where: { user: { id: user.id } },
    });

    if (!broker) {
      throw new NotFoundException('Broker account not found');
    }

    const pendingHouses = await this.houseRepository.find({
      where: {
        assignedBroker: { id: broker.id },
        status: 'pending_initial',
      },
      relations: ['user', 'assignedBroker'],
    });

    return pendingHouses.map((h) => ({
      id: h.id,
      secure_url: h.secure_url,
      location: h.location,
      price: h.price,
      bedroom: h.bedroom,
      bathroom: h.bathroom,
      area: h.area,
      userId: h.user.id,
      assignedBrokerCompanyName: h.assignedBroker?.brokerCompanyName,
    }));
  }

  @Get('pendingHouses/:id/approve')
  async approveHouse(@Param('id') id: string, @GetUser() user: User) {
    const house = await this.houseRepository.findOne({
      where: { id, status: 'pending_initial' },
      relations: ['user', 'assignedBroker'],
    });

    if (!house) throw new NotFoundException('House not found');

    house.status = 'approved';

    const approvedHouse = await this.houseRepository.save(house);

    const notification = this.notificationRepo.create({
      type: 'house-approval',
      message: 'your house has been approved',
      read: false,
      user: house.user,
      house: house,
    });

    await this.notificationRepo.save(notification);

    if (this.notificationGateway.isUserOnline(house.user.id)) {
      this.notificationGateway.sendToUser(house.user.id, {
        type: 'house-approved',
        houseId: house.id,
        message: `Your house "${house.location}" has been approved.`,
      });
    } else {
      try {
        await this.mailService.sendHouseUploaded(house.user.email, house);
      } catch (err) {
        console.error('Failed to send approval email', err);
      }
    }

    return {
      approvedHouse: {
        id: approvedHouse.id,
        secure_url: approvedHouse.secure_url,
        location: approvedHouse.location,
        price: approvedHouse.price,
        previousPrice: approvedHouse.previousPrice,
        // priceReduced: approvedHouse.priceReduced,
        bedroom: approvedHouse.bedroom,
        bathroom: approvedHouse.bathroom,
        area: approvedHouse.area,
        userId: approvedHouse.user.id,
        assignedBrokerCompanyName:
          approvedHouse.assignedBroker?.brokerCompanyName,
      },
    };
  }

  @Get('houses')
  async getHouses(@GetUser() user: User) {
    const broker = await this.brokerRepo.findOne({
      where: { user: { id: user.id } },
    });

    if (!broker) {
      throw new NotFoundException('Broker account not found');
    }

    return await this.houseRepository.find({
      where: {
        assignedBroker: { id: broker.id },
        status: 'approved',
      },
      relations: ['user', 'assignedBroker'],
    });
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([Broker, House, Notification]),
    NotificationsModule,
    MailModule,
  ],
  controllers: [BrokersController],
  providers: [CloudinaryService],
})
export class BrokersModule {}
