import httpStatus from "http-status";
import prisma from "../../../../shared/prisma";
import ApiError from "../../../../errors/ApiErrors";
import { paginationHelper } from "../../../../helpars/paginationHelper";
import { Prisma, UserStatus } from "@prisma/client";
import { getGifts } from "../../User/user.services";

export interface IGetAllOptions {
  page?: number; // Current page number
  limit?: number; // Number of items per page
  sortBy?: string; // Field to sort by
  sortOrder?: "asc" | "desc"; // Sorting order
  search?: string; // Optional search keyword
  status?: UserStatus;
  isDating?: any;
}

const dashboardStats = async (options: IGetAllOptions = {}, userId: string) => {
  const { skip, limit, sortBy, sortOrder, page } =
    paginationHelper.calculatePagination(options);

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
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
  });
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
      totalInactiveUsers: totalInactiveUsers,
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

  if (
    options.status &&
    options.status !== UserStatus.ACTIVE &&
    options.status !== UserStatus.INACTIVE &&
    options.status !== UserStatus.BLOCKED
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid status provided!, status should be ${UserStatus.ACTIVE}, ${UserStatus.INACTIVE} or ${UserStatus.BLOCKED} `
    );
  }

  // isDating query parameter
  let isDatingFilter: boolean | undefined;
  if (options.isDating !== undefined) {
    if (typeof options.isDating === "string") {
      isDatingFilter = options.isDating.toLowerCase() === "true";
    } else {
      isDatingFilter = options.isDating;
    }
  }

  // Search filter (filter by status if provided, default to ACTIVE)
  const searchFilter: Prisma.UserWhereInput = {
    // status filter if provided
    ...(options.status ? { status: options.status } : {}),

    // isDating filter if provided
    ...(isDatingFilter !== undefined ? { isDatingMode: isDatingFilter } : {}),

    // search keyword filter
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
      status: true, // include status in the response
      createdAt: true,
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
    serial: skip + index + 1,
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
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profileImage: true,
      email: true,
      totalCoins: true,
      phoneNumber: true,
      gender: true,
      about: true,
      age: true,
      memories: true,
      event: true,
      interests: true, // string[]
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "UserInfo not found");
  }

  if (!user) throw new ApiError(404, "User not found");

  const interestsDetails = await prisma.interest.findMany({
    where: {
      OR: user.interests.map((name) => ({
        name: { equals: name, mode: "insensitive" },
      })),
    },
    select: { id: true, name: true, image: true, category: true },
  });

  const followrsCount = await prisma.follow.count({
    where: { followingId: id },
  });
  const followingsCount = await prisma.follow.count({
    where: { followerId: id },
  });

  const gifts = await getGifts(id);

  return { ...user, interestsDetails, followrsCount, followingsCount, gifts };
};

const deleteUserByIdFromDb = async (userId: string, id: string) => {

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!currentUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "authorized!");
  }

  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  const deletedUser = await prisma.user.delete({
    where: { id },
  });
  return null;
};

const blockedAndUnblockedUserByIdFromDb = async (userId: string, id: string, status: UserStatus) => {

  if(id === userId){
    throw new ApiError(httpStatus.BAD_REQUEST, "You can't block yourself!");
  }

  if(!id || id.length === 0){
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid id");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
  });



  if (!currentUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "authorized!");
  }


  if(status !== UserStatus.BLOCKED && status !== UserStatus.ACTIVE){
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status, status should be BLOCKED or ACTIVE");
  }

  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if(user.status === status){
    throw new ApiError(httpStatus.BAD_REQUEST, "User is already in this status");
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      status: status,
    },
  });
  return
}

export const userInfoService = {
  dashboardStats,
  allUsers,
  getByIdFromDb,
  deleteUserByIdFromDb,
  blockedAndUnblockedUserByIdFromDb
};
