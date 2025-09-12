import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from 'src/dto/users/create-user.dto';
import { ParamUserIdDto } from 'src/dto/users/param-user-id.dto';
import { SearchUserQueryDto } from 'src/dto/users/search-user-query.dto';
import { BadRequest } from 'src/exceptions/bad-request/bad-request';
import { NotFound } from 'src/exceptions/not-found/not-found';
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
  async findAll(@Query() query: SearchUserQueryDto) {
    const { page, limit } = query;

    const userCount = await this.userService.count();
    const pageCount = Math.ceil(userCount / limit);
    const users = await this.userService.getAll(page, limit);

    return {
      data: users,
      meta: {
        page: page,
        pageCount,
      },
    };
  }

  @Get(':id')
  async findById(@Param() param: ParamUserIdDto) {
    const { id } = param;

    const user = await this.userService.getById(id);
    if (!user) throw new NotFound('User is not found');

    return {
      data: user,
    };
  }
}
