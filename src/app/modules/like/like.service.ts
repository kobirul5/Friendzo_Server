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

const getDayliMyLikeService = async (userId: string) => {

  const startOfToday = dayjs().startOf("day").toDate();
  const endOfToday = dayjs().endOf("day").toDate();

  const likes = await prisma.memoryLike.findMany({
    where: {
      userId,
      createdAt: {
        gte: startOfToday,
        lte: endOfToday,
      },
    },
  });

  return likes

}


const getDayliMyWeeklyService = async (userId: string) => {


 const now = new Date();
  const day = now.getDay(); 

  // Get ISO day index: Monday = 0, Sunday = 6
  const isoDay = (day + 6) % 7;

  // Start of ISO week (Monday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - isoDay);
  startOfWeek.setHours(0, 0, 0, 0);

  // End of ISO week (Sunday, 23:59:59)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  console.log("Start of week:", startOfWeek.toString());
  console.log("End of week:", endOfWeek.toString());
  console.log("Weekly range:", startOfWeek.toString(), "->", endOfWeek.toString());

  const likes = await prisma.memoryLike.findMany({
    where: {
      userId,
      createdAt: {
        gte: startOfWeek,
        lte: endOfWeek,
      },
    },
  });

  return likes;

}

export const likeService = {
  createEventLikeService,
  createMemoryLikeService,
  getMemoryLikeCountService,
  getMemoryLikedUsersService,
  removeMemoryLikeService,
  getDayliMyLikeService,
  getDayliMyWeeklyService
};