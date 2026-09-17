import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateRabbitHolesDto } from '../dto/create-rabbit-hole.dto';
import { UpdateRabbitHoleDto } from '../dto/update-rabbit-hole.dto';
import { RabbitHolesService } from '../../../modules/services/rabbit-holes.service';

@Controller('rabbit-holes')
export class RabbitHolesController {
  constructor(private readonly rabbitHolesService: RabbitHolesService) {}

  @Post()
  create(@Body() dto: CreateRabbitHolesDto) {
    return this.rabbitHolesService.create(dto.titles);
  }

  @Get()
  findAll() {
    return this.rabbitHolesService.findAll();
  }

  @Get('today')
  getToday() {
    return this.rabbitHolesService.getToday();
  }

  @Post('next')
  getNext() {
    return this.rabbitHolesService.getNext();
  }

  @Post('reset')
  @HttpCode(204)
  resetAll() {
    return this.rabbitHolesService.resetAll();
  }

  @Patch(':id/skip')
  skip(@Param('id', ParseUUIDPipe) id: string) {
    return this.rabbitHolesService.skip(id);
  }

  @Patch(':id/finish')
  finish(@Param('id', ParseUUIDPipe) id: string) {
    return this.rabbitHolesService.finish(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRabbitHoleDto,
  ) {
    return this.rabbitHolesService.update(id, dto.title);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rabbitHolesService.remove(id);
  }
}
