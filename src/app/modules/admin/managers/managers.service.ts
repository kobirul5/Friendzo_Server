import httpStatus from "http-status";
import prisma from "../../../../shared/prisma";
import { IGetAllOptions } from "../userInfo/userInfo.service";
import { paginationHelper } from "../../../../helpars/paginationHelper";
import ApiError from "../../../../errors/ApiErrors";
import { Prisma, UserRole, UserStatus } from "@prisma/client";

const createIntoDb = async (data: any) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const result = await prisma.user.create({ data });
    return result;
  });

  return transaction;
};

const getAllManagers = async (options: IGetAllOptions = {}, userId: string) => {
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
    role: UserRole.MANAGER,
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
  const result = await prisma.user.findUnique({
     where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        email: true,
        phoneNumber: true,
        gender: true,
        about: true,
        age: true,
        memories: true,
        event: true,
        interests: true,
      } 
    });
  if (!result) {
    throw new Error("Managers not found");
  }
  return result;
};

const updateIntoDb = async (id: string, data: any) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const result = await prisma.user.update({
      where: { id },
      data,
    });
    return result;
  });

  return transaction;
};

const deleteItemFromDb = async (id: string) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const deletedItem = await prisma.user.delete({
      where: { id },
    });

    // Add any additional logic if necessary, e.g., cascading deletes
    return deletedItem;
  });

  return transaction;
};
export const managersService = {
  createIntoDb,
  getAllManagers,
  getByIdFromDb,
  updateIntoDb,
  deleteItemFromDb,
};
