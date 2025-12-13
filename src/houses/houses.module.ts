import {
  Module,
  Controller,
  Post,
  Body,
  Get,
  Param,
  NotFoundException,
  Delete,
  UploadedFile,
  UseInterceptors,
  Query,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetUser, Public } from 'src/common';
import { User } from 'src/users/entities/user.entity';
import { MailModule } from 'src/mail/mail.module';
import { FileInterceptor } from '@nestjs/platform-express';
import { Broker } from 'src/brokers/broker.entity';
import { NotificationGateway } from '../notifications/notification.service';
import { Bookmark } from 'src/bookmarks/bookmark.entity';
import { House } from './houses.entity';
import { Notification } from '../notifications/notification.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CreateHouseDto } from './house.dto';

@Controller('houses')
export class HousesController {
  constructor(
    @InjectRepository(House)
    private houseRepository: Repository<House>,

    @InjectRepository(Broker)
    private brokerRepo: Repository<Broker>,

    private cloudnaryService: CloudinaryService,
  ) {}

  @Post('upload-house')
  @UseInterceptors(FileInterceptor('file'))
  async uploadHouse(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateHouseDto,
    @GetUser() user: User,
  ) {
    if (!file) throw new BadRequestException('File not received');

    const result = await this.cloudnaryService.uploadFile(file.buffer);

    const bedroom = parseInt(dto.bedroom);
    const bathroom = parseInt(dto.bathroom);
    const price = parseFloat(dto.price);

    if (isNaN(bedroom) || isNaN(bathroom) || isNaN(price)) {
      throw new BadRequestException('Invalid numeric fields');
    }

    const brokers = await this.brokerRepo.find({
      where: { location: dto.location, status: 'active' },
    });

    const broker = brokers.length ? brokers[0] : null;

    const newHouse = this.houseRepository.create({
      secure_url: result.secure_url,
      location: dto.location,
      price,
      bedroom,
      bathroom,
      area: dto.area,
      user,
      status: 'pending_initial',
      assignedBroker: broker,
    });

    const saved = await this.houseRepository.save(newHouse);

    const savedHouse = await this.houseRepository.findOne({
      where: { id: saved.id },
      relations: ['assignedBroker', 'user'],
    });

    return {
      savedHouse: {
        ...savedHouse,
        userId: savedHouse?.user.id,
        assignedBrokerCompanyName:
          savedHouse?.assignedBroker?.brokerCompanyName || null,
      },
    };
  }

  @Public()
  @Get()
  async getHouses(
    @Query('min') min?: string,
    @Query('max') max?: string,
    @Query('bedroomMin') bedroomMin?: string,
    @Query('bedroomMax') bedroomMax?: string,
    @Query('bathroomMin') bathroomMin?: string,
    @Query('bathroomMax') bathroomMax?: string,
    @Query('location') location?: string,
  ) {
    const qb = this.houseRepository
      .createQueryBuilder('house')
      .leftJoinAndSelect('house.user', 'user')
      .leftJoinAndSelect('house.assignedBroker', 'assignedBroker') // <-- join broker
      .orderBy('house.created_at', 'ASC');

    qb.andWhere('house.status = :status', { status: 'approved' });

    if (min) qb.andWhere('house.price >= :min', { min });
    if (max) qb.andWhere('house.price <= :max', { max });
    if (bedroomMin || bedroomMax) {
      if (bedroomMin)
        qb.andWhere('house.bedroom >= :bedroomMin', { bedroomMin });
      if (bedroomMax)
        qb.andWhere('house.bedroom <= :bedroomMax', { bedroomMax });
    }

    if (bathroomMin || bathroomMax) {
      if (bathroomMin)
        qb.andWhere('house.bathroom >= :bathroomMin', { bathroomMin });
      if (bathroomMax)
        qb.andWhere('house.bathroom <= :bathroomMax', { bathroomMax });
    }

    if (location) {
      qb.andWhere('LOWER(house.location) LIKE LOWER(:loc)', {
        loc: `%${location}%`,
      });
    }

    const houses = await qb.getMany();

    return houses.map((h) => ({
      id: h.id,
      secure_url: h.secure_url,
      location: h.location,
      price: h.price,
      previousPrice: h.previousPrice,
      // priceReduced: h.priceReduced,
      bedroom: h.bedroom,
      bathroom: h.bathroom,
      area: h.area,
      userId: h.user.id,
      assignedBrokerCompanyName: h.assignedBroker?.brokerCompanyName,
    }));
  }

  @Public()
  @Get(':id')
  async getHouse(@Param('id') id: string) {
    const house = await this.houseRepository.findOne({
      where: { id },
      relations: ['user', 'assignedBroker'],
    });

    if (!house) throw new NotFoundException('House not found');

    return {
      id: house.id,
      secure_url: house.secure_url,
      location: house.location,
      price: house.price,
      bedroom: house.bedroom,
      bathroom: house.bathroom,
      area: house.area,
      userId: house.user.id,
      assignedBrokerCompanyName: house.assignedBroker?.brokerCompanyName,
    };
  }

  @Delete('deleteHouse/:id')
  async deleteHouse(@Param('id') id: string) {
    const existing = await this.houseRepository.findOneBy({ id });
    if (!existing) throw new NotFoundException('House not found');

    return this.houseRepository.delete(id);
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([House, Bookmark, Notification, User, Broker]),
    MailModule,
    forwardRef(() => HousesModule),
  ],
  controllers: [HousesController],
  providers: [NotificationGateway, CloudinaryService],
})
export class HousesModule {}
