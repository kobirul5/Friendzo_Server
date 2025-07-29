import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import { paginationHelper } from '../../../helpars/paginationHelper';
import { IPaginationOptions } from '../../../interfaces/paginations';



const getTotalUsersService = async (options: IPaginationOptions) => {

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


const deleteUserService = async (userId:string) => {
 const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
    }

    // Step 2: (optional) Delete related follow records first
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: userId },
          { followingId: userId }
        ]
      }
    });

    // Step 3: Delete user
    const deletedUser = await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return deletedUser;
};

export const adminService = {

  getTotalUsersService,
  deleteUserService

};