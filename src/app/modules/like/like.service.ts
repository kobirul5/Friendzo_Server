import dayjs from "dayjs";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

const createEventLikeService = async (userId: string, eventId: string) => {
  // Check if like already exists
  const existingLike = await prisma.eventLike.findFirst({
    where: {
      userId,
      eventId,
    },
  });

  if (existingLike) {
    throw new ApiError(400, "You have already liked this event.");
  }

  const like = await prisma.eventLike.create({
    data: {
      userId,
      eventId,
    },
  });

  return like;
};


const createMemoryLikeService = async (userId: string, memoryId: string) => {
  const existingLike = await prisma.memoryLike.findFirst({
    where: {
      userId,
      memoryId,
    },
  });

  if (existingLike) {
    throw new ApiError(400, "You have already liked this memory.");
  }

  const like = await prisma.memoryLike.create({
    data: {
      userId,
      memoryId,
    },
  });

  return like;
};


const getMemoryLikeCountService = async (memoryId: string) => {
  const count = await prisma.memoryLike.count({
    where: { memoryId },
  });

  return count;
};

// Get users who liked a memory
const getMemoryLikedUsersService = async (memoryId: string) => {
  const likes = await prisma.memoryLike.findMany({
    where: { memoryId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,

        },
      },
    },
  });

  return likes.map((like) => like.user);
};


const removeMemoryLikeService = async (userId: string, memoryId: string) => {
  const existingLike = await prisma.memoryLike.findFirst({
    where: {
      userId,
      memoryId,
    },
  });

  if (!existingLike) {
    throw new ApiError(404, "Like does not exist for this memory.");
  }

  await prisma.memoryLike.delete({
    where: {
      id: existingLike.id,
    },
  });

  return { message: "Like removed successfully." };
};

const getDailyMyLikeService = async (userId: string) => {
  const startOfToday = dayjs().startOf("day").toDate();
  const endOfToday = dayjs().endOf("day").toDate();

  // Get today's likes with memory info
  const likes = await prisma.memoryLike.findMany({
    where: {
      userId,
      createdAt: {
        gte: startOfToday,
        lte: endOfToday,
      },
    },
    include: {
      memory: {
        select: {
          id: true,
          description: true,
          image: true,
          createdAt: true,
        },
      },
    },
  });

  // Extract memories (avoid duplicates if needed)
  const likedMemories = likes.map((like) => like.memory);

  return {
    totalLikes: likedMemories.length,
    likesMemory: likedMemories,
  };
};


// const getMyWeeklyService = async (userId: string) => {


//  const now = new Date();
//   const day = now.getDay(); 

//   // Get ISO day index: Monday = 0, Sunday = 6
//   const isoDay = (day + 6) % 7;

//   // Start of ISO week (Monday)
//   const startOfWeek = new Date(now);
//   startOfWeek.setDate(now.getDate() - isoDay);
//   startOfWeek.setHours(0, 0, 0, 0);

//   // End of ISO week (Sunday, 23:59:59)
//   const endOfWeek = new Date(startOfWeek);
//   endOfWeek.setDate(startOfWeek.getDate() + 6);
//   endOfWeek.setHours(23, 59, 59, 999);

//   const likes = await prisma.memoryLike.findMany({
//     where: {
//       userId,
//       createdAt: {
//         gte: startOfWeek,
//         lte: endOfWeek,
//       },
//     },
//   });

//   return likes;

// }

const getMyWeeklyService = async (userId: string) => {
  const now = new Date();
  const day = now.getDay();

  // Convert JS Sunday=0 to ISO Monday=0
  const isoDay = (day + 6) % 7;

  // Start of week (Monday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - isoDay);
  startOfWeek.setHours(0, 0, 0, 0);

  // End of week (Sunday 23:59:59)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Query all likes with memory details
  const likes = await prisma.memoryLike.findMany({
    where: {
      userId,
      createdAt: {
        gte: startOfWeek,
        lte: endOfWeek,
      },
    },
    include: {
      memory: {
        select: {
          id: true,
          // title: true,
          description: true,
          image: true,
          createdAt: true,
        },
      },
    },
  });

  // Extract memories
  const likedMemories = likes.map((like) => like.memory);

  return {
    totalLikes: likedMemories.length,
    likesMemory: likedMemories,
  };
};



export const likeService = {
  createEventLikeService,
  createMemoryLikeService,
  getMemoryLikeCountService,
  getMemoryLikedUsersService,
  removeMemoryLikeService,
  getDailyMyLikeService,
  getMyWeeklyService
};