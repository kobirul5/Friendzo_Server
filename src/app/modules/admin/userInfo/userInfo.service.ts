import httpStatus from "http-status";
import prisma from "../../../../shared/prisma";
import ApiError from "../../../../errors/ApiErrors";
import { paginationHelper } from "../../../../helpars/paginationHelper";
import { Prisma, UserStatus } from "@prisma/client";

export interface IGetAllOptions {
  page?: number; // Current page number
  limit?: number; // Number of items per page
  sortBy?: string; // Field to sort by
  sortOrder?: "asc" | "desc"; // Sorting order
  search?: string; // Optional search keyword
}

const dashboardStats = async (options: IGetAllOptions = {}, userId: string) => {
  const { skip, limit, sortBy, sortOrder, page } =
    paginationHelper.calculatePagination(options);


    const  user = await prisma.user.findUnique({
      where: {
        id: userId
      }
    })
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
    }
  // Search filter (if search is provided)
  const searchFilter: Prisma.UserWhereInput = {
    status: UserStatus.ACTIVE, // Only active users
    ...(options.search
      ? {
          OR: [
            { firstName: { contains: options.search, mode: "insensitive" } },
            { lastName: { contains: options.search, mode: "insensitive" } },
            { email: { contains: options.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  // Fetch user list
  const users = await prisma.user.findMany({
    where: searchFilter,
    skip,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      profileImage: true,
    },
  });

  if (!users || users.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "Users not found!");
  }

  // Total count of users
  const totalUsers = await prisma.user.count({
    where: searchFilter,
  });
  // Total revenue
  const totalRevenue = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },
  });

  const totalCoins = await prisma.payment.aggregate({
    _sum: {
      totalCoins: true,
    },
  });

  const totalDatingUsers = await prisma.user.count({
    where: {
      isDatingMode: true,
      status: UserStatus.ACTIVE,
    },
  });

  const totalSocialUsers = await prisma.user.count({
    where: {
      isDatingMode: false,
      status: UserStatus.ACTIVE,
    },
  });

  // total gift card
  const totalGiftCard = await prisma.giftCard.count();

  // total blocked users
  const totalBlockedUsers = await prisma.user.count({
    where: {
      status: UserStatus.BLOCKED,
    },
  });

  const totalInactiveUsers = await prisma.user.count({
    where: {
      status: UserStatus.INACTIVE,
    },
  })
  // TODO:
  const totalVisitors = await prisma.totalVisitors.count();

  // new users
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const totalUsersLast7Days = await prisma.user.count({
    where: {
      status: UserStatus.ACTIVE,
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
  });


  return {
    stats: {
      totalRevenue: totalRevenue._sum.amount,
      totalUsers: totalUsers,
      totalVisitors: totalVisitors,
      newUsers: totalUsersLast7Days,
      totalCoinSales: totalCoins._sum.totalCoins,
      totalDatingUsers: totalDatingUsers,
      totalSocialUsers: totalSocialUsers,
      totalGiftCard: totalGiftCard,
      totalBlockedUsers: totalBlockedUsers,
      totalInactiveUsers: totalInactiveUsers
    },
    meta: {
      page,
      limit,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
    },
    data: users,
  };
};
const allUsers = async (options: IGetAllOptions = {}, userId: string) => {
  const { skip, limit, sortBy, sortOrder, page } =
    paginationHelper.calculatePagination(options);

  // Find requesting user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }

  // Search filter (only active users)
  const searchFilter: Prisma.UserWhereInput = {
    status: UserStatus.ACTIVE,
    ...(options.search
      ? {
          OR: [
            { firstName: { contains: options.search, mode: "insensitive" } },
            { lastName: { contains: options.search, mode: "insensitive" } },
            { email: { contains: options.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  // Fetch paginated users
  const users = await prisma.user.findMany({
    where: searchFilter,
    skip,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      profileImage: true,
    },
  });

  if (!users || users.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "Users not found!");
  }

  // Total count of users matching the filter
  const totalUsersCount = await prisma.user.count({
    where: searchFilter,
  });

  // Add serial number
  const usersWithSerial = users.map((user, index) => ({
    serial: skip + index + 1, // serial starts from 1 for first user on first page
    ...user,
  }));

  return {
    meta: {
      page,
      limit,
      totalUsers: totalUsersCount,
      totalPages: Math.ceil(totalUsersCount / limit),
    },
    data: usersWithSerial,
  };
};

const getByIdFromDb = async (id: string) => {
  const result = await prisma.user.findUnique({ where: { id } });
  if (!result) {
    throw new Error("UserInfo not found");
  }
  return result;
};

export const userInfoService = {
  dashboardStats,
  allUsers,
  getByIdFromDb,
};
