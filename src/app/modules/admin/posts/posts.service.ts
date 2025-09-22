
import httpStatus from 'http-status';
import prisma from '../../../../shared/prisma';
import { paginationHelper } from '../../../../helpars/paginationHelper';
import { Prisma } from '@prisma/client';




interface IGetListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  userId?: string;
}

export const getListFromDb = async (options: IGetListParams) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  // 🔍 Search filter
  const where: Prisma.MemoryWhereInput = {
    AND: [
      options.search
        ? {
            OR: [
              { description: { contains: options.search, mode: "insensitive" } },
              { address: { contains: options.search, mode: "insensitive" } },
            ],
          }
        : {},
      options.userId ? { userId: options.userId } : {},
    ],
  };

  const [items, total] = await Promise.all([
    prisma.memory.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
        MemoryLike: true,
        Comment: true,
      },
    }),
    prisma.memory.count({ where }),
  ]);

  return {
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    data: items,
  };
};
const getByIdFromDb = async (id: string) => {
  
    const result = await prisma.memory.findUnique({ where: { id } });
    if (!result) {
      throw new Error('memory not found');
    }
    return result;
  };



const updateIntoDb = async (id: string, data: any) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const result = await prisma.memory.update({
      where: { id },
      data,
    });
    return result;
  });

  return transaction;
};

const deleteItemFromDb = async (id: string) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const deletedItem = await prisma.memory.delete({
      where: { id },
    });

    // Add any additional logic if necessary, e.g., cascading deletes
    return deletedItem;
  });

  return transaction;
};


export const postsService = {
getListFromDb,
getByIdFromDb,
updateIntoDb,
deleteItemFromDb,
};