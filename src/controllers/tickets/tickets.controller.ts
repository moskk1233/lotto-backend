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
import { Prisma } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles/roles.decorator';
import { UserRoleEnum } from 'src/common/enums/user-role.enum';
import { IdParamDto } from 'src/dto/common/id-param.dto';
import { CreateTicketDto } from 'src/dto/tickets/create-ticket.dto';
import { QueryTicketDto } from 'src/dto/tickets/query-ticket.dto';
import { UpdateTicketDto } from 'src/dto/tickets/update-ticket.dto';
import { AuthGuard } from 'src/middlewares/auth/auth.guard';
import { RolesGuard } from 'src/middlewares/roles/roles.guard';
import { TicketsService } from 'src/services/tickets/tickets.service';

@Controller('tickets')
@UseGuards(AuthGuard)
export class TicketsController {
  constructor(private ticketService: TicketsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  async create(@Body() createTicketDto: CreateTicketDto) {
    const { ticketNumber } = createTicketDto;
    const existedTicket = await this.ticketService.getByNumber(ticketNumber);
    if (existedTicket) throw new BadRequestException('Existed ticket number');

    const newTicket = await this.ticketService.create(createTicketDto);
    return {
      data: newTicket,
    };
  }

  @Get()
  async findAll(@Query() query: QueryTicketDto) {
    const { page, limit, order, sort, q } = query;

    const where: Prisma.LotteryTicketsWhereInput | undefined = q
      ? { ticketNumber: { contains: q } }
      : undefined;

    const ticketCount = await this.ticketService.count({ where });
    const pageCount = Math.ceil(ticketCount / limit);

    const orderBy = sort ? { [sort]: order } : undefined;
    const tickets = await this.ticketService.getAll(page, limit, {
      orderBy,
      where,
    });

    return {
      data: tickets,
      meta: {
        page,
        pageCount,
      },
    };
  }

  @Get(':id')
  async findById(@Param() param: IdParamDto) {
    const { id } = param;
    const existedTicket = await this.ticketService.getById(id);
    if (!existedTicket) throw new NotFoundException('Ticket is not found');

    return {
      data: existedTicket,
    };
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  async updateById(
    @Param() param: IdParamDto,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    const { id } = param;
    const existedTicket = await this.ticketService.getById(id);
    if (!existedTicket) throw new NotFoundException('Ticket is not found');

    const updatedTicket = await this.ticketService.update(id, updateTicketDto);
    return {
      data: updatedTicket,
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteById(@Param() param: IdParamDto) {
    const { id } = param;
    const existedTicket = await this.ticketService.getById(id);
    if (!existedTicket) throw new NotFoundException('Ticket is not found');

    await this.ticketService.delete(id);
  }
}
