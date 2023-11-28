import { Injectable } from '@nestjs/common';
import { CreateStockInputDto } from './dto/create-stock-input.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundError } from 'src/errors';

@Injectable()
export class StockInputsService {
  constructor(private prismaService: PrismaService) {}

  async create(createStockInputDto: CreateStockInputDto) {
    const product = await this.prismaService.product.findUnique({
      where: { id: createStockInputDto.productId },
    });
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // lock row na tabela de produto
    const result = await this.prismaService.$transaction([
      this.prismaService.stockInput.create({
        data: createStockInputDto,
      }),
      this.prismaService.product.update({
        where: { id: createStockInputDto.productId },
        data: {
          qtty: {
            increment: createStockInputDto.qtty,
          },
        },
      }),
    ]);
    return result[0];
  }

  findAll() {
    return this.prismaService.stockInput.findMany();
  }

  async findOne(id: number) {
    try {
      return await this.prismaService.stockInput.findUniqueOrThrow({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Stock input with ID ${id} not found`);
      }
    }
  }
}
