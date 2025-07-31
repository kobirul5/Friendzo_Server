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

const deleteUserService = async (userId: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }

  const result = await prisma.user.delete({
    where:{
      id: existingUser.id
    }
  })

  return result;

  // return await prisma.$transaction(async (tx) => {
  //   // Step 1: Delete blocks (blocker or blocked)
  //   await tx.block.deleteMany({
  //     where: {
  //       OR: [
  //         { blockerId: userId },
  //         { blockedUserId: userId },
  //       ],
  //     },
  //   });

  //   // Step 2: Delete follows (follower or following)
  //   await tx.follow.deleteMany({
  //     where: {
  //       OR: [
  //         { followerId: userId },
  //         { followingId: userId },
  //       ],
  //     },
  //   });

  //   // Step 3: Delete EventLikes by user
  //   await tx.eventLike.deleteMany({
  //     where: { userId },
  //   });

  //   // Step 4: Delete MemoryLikes by user
  //   await tx.memoryLike.deleteMany({
  //     where: { userId },
  //   });

  //   // Step 5: Delete Comments by user
  //   await tx.comment.deleteMany({
  //     where: { userId },
  //   });

  //   // Step 6: Delete Comments on user's memories
  //   const userMemories = await tx.memory.findMany({
  //     where: { userId },
  //     select: { id: true },
  //   });
  //   const memoryIds = userMemories.map((m) => m.id);
  //   if (memoryIds.length > 0) {
  //     await tx.comment.deleteMany({
  //       where: {
  //         memoryId: { in: memoryIds },
  //       },
  //     });
  //     await tx.memoryLike.deleteMany({
  //       where: {
  //         memoryId: { in: memoryIds },
  //       },
  //     });
  //   }

  //   // Step 7: Delete Events and EventLikes on those events
  //   const userEvents = await tx.event.findMany({
  //     where: { userId },
  //     select: { id: true },
  //   });
  //   const eventIds = userEvents.map((e) => e.id);
  //   if (eventIds.length > 0) {
  //     await tx.eventLike.deleteMany({
  //       where: {
  //         eventId: { in: eventIds },
  //       },
  //     });
  //   }

  //   await tx.event.deleteMany({
  //     where: { userId },
  //   });

  //   // Step 8: Delete Rooms and Chats (both sides)
  //   const userRooms = await tx.room.findMany({
  //     where: {
  //       OR: [
  //         { senderId: userId },
  //         { receiverId: userId },
  //       ],
  //     },
  //     select: { id: true },
  //   });

  //   const roomIds = userRooms.map((room) => room.id);

  //   if (roomIds.length > 0) {
  //     await tx.chat.deleteMany({
  //       where: {
  //         roomId: { in: roomIds },
  //       },
  //     });
  //   }

  //   await tx.room.deleteMany({
  //     where: {
  //       OR: [
  //         { senderId: userId },
  //         { receiverId: userId },
  //       ],
  //     },
  //   });

  //   // Step 9: Delete all chats where user is sender or receiver
  //   await tx.chat.deleteMany({
  //     where: {
  //       OR: [
  //         { senderId: userId },
  //         { receiverId: userId },
  //       ],
  //     },
  //   });

  //   // Step 10: Delete Memories
  //   await tx.memory.deleteMany({
  //     where: { userId },
  //   });

  //   // Step 11: Delete Reports (made by or on user)
  //   await tx.report.deleteMany({
  //     where: {
  //       OR: [
  //         { reporterId: userId },
  //         { reportedUserId: userId },
  //       ],
  //     },
  //   });

  //   // Step 12: (optional) Delete notifications if used
  //   // await tx.notification.deleteMany({
  //   //   where: { userId },
  //   // });

  //   // Step 13: Finally, delete the user
  //   const deletedUser = await tx.user.delete({
  //     where: { id: userId },
  //   });

  //   return deletedUser;
  // });
};




export const adminService = {

  getTotalUsersService,
  deleteUserService,
  getTotalReportService,
  getMonthlyReportService,

};