import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from 'src/dto/users/create-user.dto';
import { BadRequest } from 'src/exceptions/bad-request/bad-request';
import { UsersService } from 'src/services/users/users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const { emailTaken, phoneTaken, usernameTaken } =
      await this.userService.checkUniqueField(createUserDto);

    if (usernameTaken) {
      throw new BadRequest('Username is existed');
    }

    if (emailTaken) {
      throw new BadRequest('Email is existed');
    }

    if (phoneTaken) {
      throw new BadRequest('Phone is existed');
    }

    const user = await this.userService.create(createUserDto);
    return {
      data: user,
    };
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    let pageNumber = parseInt(page, 10);
    let limitNumber = parseInt(limit, 10);

    // ป้องกันเลขต่ำกว่า 1
    if (isNaN(pageNumber) || pageNumber < 1) {
      pageNumber = 1;
    }
    if (isNaN(limitNumber) || limitNumber < 1) {
      limitNumber = 10;
    }

    const userCount = await this.userService.count();
    const pageCount = Math.ceil(userCount / limitNumber);
    const users = await this.userService.getAll(pageNumber, limitNumber);

    return {
      data: users,
      meta: {
        page: pageNumber,
        pageCount,
      },
    };
  }
}
