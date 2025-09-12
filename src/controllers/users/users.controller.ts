import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { IdParamDto } from 'src/dto/common/id-param.dto';
import { CreateUserDto } from 'src/dto/users/create-user.dto';
import { SearchUserQueryDto } from 'src/dto/users/search-user-query.dto';
import { UpdateUserByAdminDto } from 'src/dto/users/update-user.dto';
import { UserRoleEnum } from 'src/common/enums/user-role.enum';
import { AuthGuard } from 'src/middlewares/auth/auth.guard';
import { UsersService } from 'src/services/users/users.service';
import { RolesGuard } from 'src/middlewares/roles/roles.guard';

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
      throw new BadRequestException('Username is existed');
    }

    if (emailTaken) {
      throw new BadRequestException('Email is existed');
    }

    if (phoneTaken) {
      throw new BadRequestException('Phone is existed');
    }

    const user = await this.userService.create(createUserDto);
    return {
      data: user,
    };
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
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
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  async findById(@Param() param: IdParamDto) {
    const { id } = param;

    const user = await this.userService.getById(id);
    if (!user) throw new NotFoundException('User is not found');

    return {
      data: user,
    };
  }

  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  async updateById(
    @Param() param: IdParamDto,
    @Body() updateUserDto: UpdateUserByAdminDto,
  ) {
    const { id } = param;

    const existedUser = await this.userService.getById(id);
    if (!existedUser) throw new NotFoundException('User is not found');

    const updatedUser = await this.userService.update(id, updateUserDto);
    return {
      data: updatedUser,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteById(@Param() param: IdParamDto) {
    const { id } = param;

    const existedUser = await this.userService.getById(id);
    if (!existedUser) throw new NotFoundException('User is not found');

    await this.userService.delete(id);
  }
}
