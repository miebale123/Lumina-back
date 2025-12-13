import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { GetUser } from 'src/common';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Bookmark } from './bookmark.entity';
import { House } from 'src/houses/houses.entity';

@Controller('bookmarks')
export class BookmarksController {
  constructor(
    @InjectRepository(Bookmark)
    private bookmarkRepo: Repository<Bookmark>,

    @InjectRepository(House)
    private houseRepository: Repository<House>,
  ) {}

  @Get()
  async getBookmarks(@GetUser() user: User) {
    return this.bookmarkRepo.find({
      where: { user: { id: user.id } },
      relations: ['house'],
    });
  }

  @Post('create-bookmark')
  async createBookmark(
    @Body('houseId') houseId: string,
    @GetUser() user: User,
  ) {
    const house = await this.houseRepository.findOneBy({ id: houseId });

    if (!house) throw new NotFoundException('House not found');

    const newBookmark = this.bookmarkRepo.create({
      user,
      house,
    });

    const savedBookmark = await this.bookmarkRepo.save(newBookmark);

    return { message: 'Bookmarked', savedBookmark };
  }

  @Delete('deleteBookmark/:id')
  async deleteBookmark(@Param('id') id: string, @GetUser() user: User) {
    const existing = await this.bookmarkRepo.findOne({
      where: { id, user: { id: user.id } },
      relations: ['user'],
    });

    const result = await this.bookmarkRepo.delete(id);
    return { result };
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Bookmark, House])],
  controllers: [BookmarksController],
})
export class BookmarksModule {}
