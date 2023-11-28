import { Injectable } from '@nestjs/common';
import { CreateStockOutputDto } from './dto/create-stock-output.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundError } from 'src/errors';

@Injectable()
export class StockOutputsService {
  constructor(private prismaService: PrismaService) {}

  async create(createStockOutputDto: CreateStockOutputDto) {
    const product = await this.prismaService.product.findUnique({
      where: { id: createStockOutputDto.productId },
    });
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    if (product.qtty === 0) {
      throw new NotFoundError('Product out of stock');
    }
    if (
      createStockOutputDto.qtty > product.qtty ||
      product.qtty - createStockOutputDto.qtty < 0
    ) {
      throw new NotFoundError('Insufficient product quantity');
    }

    // lock row na tabela de produto
    const result = await this.prismaService.$transaction([
      this.prismaService.stockOutput.create({
        data: createStockOutputDto,
      }),
      this.prismaService.product.update({
        where: { id: createStockOutputDto.productId },
        data: {
          qtty: {
            decrement: createStockOutputDto.qtty,
          },
        },
      }),
    ]);
    return result[0];
  }

  findAll() {
    return this.prismaService.stockOutput.findMany();
  }

  async findOne(id: number) {
    try {
      return await this.prismaService.stockOutput.findUniqueOrThrow({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Stock output with ID ${id} not found`);
      }
    }
  }
}
