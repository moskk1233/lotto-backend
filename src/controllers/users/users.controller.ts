import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IdParamDto } from 'src/dto/common/id-param.dto';
import { CreateUserDto } from 'src/dto/users/create-user.dto';
import { SearchUserQueryDto } from 'src/dto/users/search-user-query.dto';
import { UpdateUserByAdminDto } from 'src/dto/users/update-user.dto';
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
  async findById(@Param() param: IdParamDto) {
    const { id } = param;

    const user = await this.userService.getById(id);
    if (!user) throw new NotFound('User is not found');

    return {
      data: user,
    };
  }

  @Put(':id')
  async updateById(
    @Param() param: IdParamDto,
    @Body() updateUserDto: UpdateUserByAdminDto,
  ) {
    const { id } = param;

    const existedUser = await this.userService.getById(id);
    if (!existedUser) throw new NotFound('User is not found');

    const updatedUser = await this.userService.update(id, updateUserDto);
    return {
      data: updatedUser,
    };
  }
}
