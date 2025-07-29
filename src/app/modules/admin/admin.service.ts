import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import { paginationHelper } from '../../../helpars/paginationHelper';
import { IPaginationOptions } from '../../../interfaces/paginations';



const getTotalUsersService = async (options:IPaginationOptions) => {

  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

  // total count
  const totalUsers = await prisma.user.count();

  // paginated users
  const users = await prisma.user.findMany({
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder, // dynamic field sort
    },
  });

  if (!users || users.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "No users found!");
  }

  return {
    meta: {
      page,
      limit,
      total: totalUsers,
    },
    data: users,
  };
};



export const adminService = {

  getTotalUsersService,

};