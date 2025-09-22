
import httpStatus from 'http-status';
import prisma from '../../../../shared/prisma';
import { paginationHelper } from '../../../../helpars/paginationHelper';
import { Prisma } from '@prisma/client';
import ApiError from '../../../../errors/ApiErrors';




interface IGetListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  userId?: string;
}

 const getPostsListFromDb = async (options: IGetListParams) => {
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
const memory = await prisma.memory.findUnique({ where: { id } });
if (!memory) {
  throw new ApiError(httpStatus.NOT_FOUND, "Memory not found");
}

  const result = await prisma.memory.findUnique({
    where: { id },
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
      Comment: {
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
        },
      },
      _count: {
        select: {
          MemoryLike: true,
          Comment: true,
        },
      },
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Memory not found");
  }

  return {
    ...result,
    likeCount: result._count.MemoryLike,
    commentCount: result._count.Comment,
  };
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

  const memory = await prisma.memory.findUnique({ where: { id } });
  if (!memory) {
    throw new ApiError(httpStatus.NOT_FOUND, "Memory not found");
  }

  const transaction = await prisma.$transaction(async (prisma) => {
    const deletedItem = await prisma.memory.delete({
      where: { id },
    });

    return deletedItem;
  });

  return transaction;
};


export const postsService = {
getPostsListFromDb,
getByIdFromDb,
updateIntoDb,
deleteItemFromDb,
};