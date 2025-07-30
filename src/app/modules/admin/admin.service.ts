import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import { paginationHelper } from '../../../helpars/paginationHelper';
import { IPaginationOptions } from '../../../interfaces/paginations';



const getTotalReportService = async (options: IPaginationOptions) => {

  const totalReport = await prisma.report.count();

  return totalReport
};
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


const deleteUserService = async (userId: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }

  await prisma.block.deleteMany({
    where: {
      OR: [
        { blockerId: userId },
        { blockedUserId: userId },
      ]
    }
  });


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

const getMonthlyReportService = async () => {
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(today.getMonth() - 1);

  const reports = await prisma.report.findMany({
    where: {
      createdAt: {
        gte: oneMonthAgo,
        lte: today,
      },
    },
    include: {
      reporter: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      reportedUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return {
    from: oneMonthAgo,
    to: today,
    total: reports.length,
    reports,
  };
};



export const adminService = {

  getTotalUsersService,
  deleteUserService,
  getTotalReportService,
  getMonthlyReportService,

};