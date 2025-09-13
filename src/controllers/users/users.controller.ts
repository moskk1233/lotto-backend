import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import {
  UpdateUserByAdminDto,
  UpdateUserDto,
} from 'src/dto/users/update-user.dto';
import { UserRoleEnum } from 'src/common/enums/user-role.enum';
import { AuthGuard } from 'src/middlewares/auth/auth.guard';
import { UsersService } from 'src/services/users/users.service';
import { RolesGuard } from 'src/middlewares/roles/roles.guard';
import { User } from 'src/common/decorators/user-claim/user-claim.decorator';
import type { UserClaim } from 'src/common/types/user-claim';
import { PaginationDto } from 'src/dto/common/pagination.dto';
import { QueryTicketDto } from 'src/dto/tickets/query-ticket.dto';
import { TicketsService } from 'src/services/tickets/tickets.service';
import { Prisma } from '@prisma/client';
import { UserBuyTicketDto } from 'src/dto/users/buy-ticket.dto';
import { PrizesService } from 'src/services/prizes/prizes.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private userService: UsersService,
    private ticketService: TicketsService,
    private prizeService: PrizesService,
  ) {}

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
  async findAll(@Query() query: PaginationDto) {
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

  @Get('@me')
  @UseGuards(AuthGuard)
  async findMe(@User() userClaim: UserClaim) {
    const { userId } = userClaim;
    const user = await this.userService.getById(userId);
    if (!user) throw new NotFoundException('User is not found');

    return {
      data: user,
    };
  }

  @Put('@me')
  @UseGuards(AuthGuard)
  async updateMe(
    @User() userClaim: UserClaim,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const { userId } = userClaim;
    const existedUser = await this.userService.getById(userId);
    if (!existedUser) throw new NotFoundException('User is not found');

    const updatedUser = await this.userService.update(userId, updateUserDto);
    return {
      data: updatedUser,
    };
  }

  @Get('@me/tickets')
  @UseGuards(AuthGuard)
  async getCurrentUserTicket(
    @Query() query: QueryTicketDto,
    @User() userClaim: UserClaim,
  ) {
    const { page, limit, order, sort, q } = query;

    const where: Prisma.LotteryTicketsWhereInput = {};
    const orderBy: Prisma.LotteryTicketsOrderByWithRelationInput = {};

    where.ownerId = userClaim.userId;

    if (q) where.ticketNumber = { contains: q };
    if (sort) orderBy[sort] = order ?? undefined;

    const ticketCount = await this.ticketService.count({ where });
    const pageCount = Math.ceil(ticketCount / limit);
    const tickets = await this.ticketService.getAll(page, limit, {
      where,
      orderBy,
      omit: {
        ownerId: true,
        price: true,
      },
    });

    return {
      data: tickets,
      meta: {
        page,
        pageCount,
      },
    };
  }

  @Get('@me/tickets/:id/prize')
  @UseGuards(AuthGuard)
  async userGetOwnPrizes(
    @Param() param: IdParamDto,
    @User() userClaim: UserClaim,
  ) {
    const { id } = param;

    const ticket = await this.ticketService.getById(id);
    if (!ticket) throw new NotFoundException('Ticket is not found');
    if (ticket.ownerId !== userClaim.userId)
      throw new ForbiddenException('This ticket is not yours');

    const existedPrize = await this.prizeService.getByTicketId(id);
    if (!existedPrize)
      throw new NotFoundException('Sorry about that, but you not the winner');
    return existedPrize;
  }

  @Post('@me/tickets/purchase')
  @UseGuards(AuthGuard)
  async userBuyTicket(
    @Body() userBuyTicketDto: UserBuyTicketDto,
    @User() userClaim: UserClaim,
  ) {
    const existedTicket = await this.ticketService.getByNumber(
      userBuyTicketDto.ticketNumber,
    );
    if (!existedTicket) throw new NotFoundException('Ticket is not found');

    const userProfile = (await this.userService.getById(userClaim.userId))!;
    if (userProfile.money < existedTicket.price)
      throw new BadRequestException(
        "You don't have enough money to buy this ticket",
      );

    if (existedTicket.ownerId)
      throw new BadRequestException('This ticket has been sold');

    const updaatedTicket = await this.userService.buyTicket(
      userClaim.userId,
      existedTicket.id,
      existedTicket.price,
    );

    return {
      data: updaatedTicket,
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
