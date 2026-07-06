import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @ApiOperation({ summary: '客户列表（支持筛选分页）' })
  @Get()
  async findAll(@Query() query: QueryCustomerDto) {
    return this.customersService.findAll(query);
  }

  @ApiOperation({ summary: '区域分布统计' })
  @Get('distribution')
  async distribution() {
    return this.customersService.distribution();
  }

  @ApiOperation({ summary: '客户详情' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @ApiOperation({ summary: '创建客户' })
  @Post()
  async create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @ApiOperation({ summary: '更新客户' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @ApiOperation({ summary: '删除客户' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }

  @ApiOperation({ summary: '关系人列表' })
  @Get(':id/persons')
  async findPersons(@Param('id') id: string) {
    return this.customersService.findPersons(id);
  }

  @ApiOperation({ summary: '添加关系人' })
  @Post(':id/persons')
  async createPerson(
    @Param('id') customerId: string,
    @Body() body: { name: string; position?: string; role?: string; phone?: string; email?: string; influence?: number; relationStrength?: number; attitude?: string; remark?: string },
  ) {
    return this.customersService.createPerson(customerId, body);
  }

  @ApiOperation({ summary: '更新关系人' })
  @Put('persons/:id')
  async updatePerson(
    @Param('id') id: string,
    @Body() body: { name?: string; position?: string; role?: string; phone?: string; email?: string; influence?: number; relationStrength?: number; attitude?: string; remark?: string },
  ) {
    return this.customersService.updatePerson(id, body);
  }

  @ApiOperation({ summary: '删除关系人' })
  @Delete('persons/:id')
  async removePerson(@Param('id') id: string) {
    return this.customersService.removePerson(id);
  }
}
