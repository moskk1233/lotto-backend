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
import { PrizeStatus } from 'src/common/enums/prize-status.enum';
import { UserRoleEnum } from 'src/common/enums/user-role.enum';
import { IdParamDto } from 'src/dto/common/id-param.dto';
import { CreatePrizeDto } from 'src/dto/prizes/create-prize.dto';
import { QueryPrizesDto } from 'src/dto/prizes/query.prizes.dto';
import { UpdatePrizeDto } from 'src/dto/prizes/update-prize.dto';
import { AuthGuard } from 'src/middlewares/auth/auth.guard';
import { RolesGuard } from 'src/middlewares/roles/roles.guard';
import { PrizesService } from 'src/services/prizes/prizes.service';
import { TicketsService } from 'src/services/tickets/tickets.service';

@ApiTags('Prizes')
@Controller('prizes')
@UseGuards(AuthGuard, RolesGuard)
@Roles(UserRoleEnum.ADMIN)
export class PrizesController {
  constructor(
    private prizeService: PrizesService,
    private ticketService: TicketsService,
  ) {}

  @Get()
  async findAll(@Query() query: QueryPrizesDto) {
    const { limit, page, order, sort } = query;

    const prizeCount = await this.prizeService.count();
    const pageCount = Math.ceil(prizeCount / limit);

    const orderBy = sort ? { [sort]: order } : undefined;
    const prizes = await this.prizeService.getAll(page, limit, {
      orderBy,
    });

    return {
      data: prizes,
      meta: {
        page,
        pageCount,
      },
    };
  }

  @Get(':id')
  async findById(@Param() param: IdParamDto) {
    const { id } = param;
    const existedPrize = await this.prizeService.getById(id);
    if (!existedPrize) throw new NotFoundException('Prize is not found');

    return {
      data: existedPrize,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPrize(@Body() createPrizeDto: CreatePrizeDto) {
    switch (createPrizeDto.type) {
      case PrizeStatus.RANKED: {
        const ticketPrize = await this.ticketService.getByNumber(
          createPrizeDto.ticketNumber,
        );
        if (!ticketPrize) throw new NotFoundException('Ticket is not found');

        const existedPrize = await this.prizeService.getById(ticketPrize.id);
        if (existedPrize) throw new BadRequestException('Prize already added');

        const result = await this.prizeService.create({
          prizeAmount: createPrizeDto.prizeAmount,
          prizeDescription: createPrizeDto.prizeDescription,
          winningTicketId: ticketPrize.id,
        });
        return {
          data: result,
        };
      }
      case PrizeStatus.LAST: {
        const ticketPrizes = await this.ticketService.getAll(1, 1000, {
          where: {
            ticketNumber: {
              endsWith: createPrizeDto.ticketNumber,
            },
          },
        });
        if (ticketPrizes.length === 0)
          throw new NotFoundException('No ticket win');

        const ticketIds = ticketPrizes.map((ticket) => ticket.id);

        const existingPrizes = await this.prizeService.getAll(1, 1000, {
          where: {
            winningTicketId: {
              in: ticketIds,
            },
          },
        });

        const ticketsWithPrizes = existingPrizes.map(
          (prize) => prize.winningTicketId,
        );

        const ticketsToCreatePrizesFor = ticketPrizes.filter(
          (ticket) => !ticketsWithPrizes.includes(ticket.id),
        );

        if (ticketsToCreatePrizesFor.length === 0) {
          return {
            data: {
              count: 0,
            },
          };
        }

        const result = await this.prizeService.createMany(
          ticketsToCreatePrizesFor.map((ticket) => ({
            prizeAmount: createPrizeDto.prizeAmount,
            prizeDescription: createPrizeDto.prizeDescription,
            winningTicketId: ticket.id,
          })),
        );

        return {
          data: result,
        };
      }
    }
  }

  @Put(':id')
  async updateById(
    @Param() param: IdParamDto,
    @Body() updatePrizeDto: UpdatePrizeDto,
  ) {
    const { id } = param;
    const existedPrize = await this.prizeService.getById(id);
    if (!existedPrize) throw new NotFoundException('Prize is not found');

    const { winningTicketIdTaken } =
      await this.prizeService.checkUniqueField(updatePrizeDto);
    if (winningTicketIdTaken)
      throw new BadRequestException('Winning Ticket is Taken');

    const updatedPrize = await this.prizeService.update(id, updatePrizeDto);
    return {
      data: updatedPrize,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteById(@Param() param: IdParamDto) {
    const { id } = param;
    const existedPrize = await this.prizeService.getById(id);
    if (!existedPrize) throw new NotFoundException('Prize is not found');

    await this.prizeService.delete(id);
  }
}
