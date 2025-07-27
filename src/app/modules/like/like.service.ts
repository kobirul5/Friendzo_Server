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
    throw new ApiError(400,"You have already liked this event.");
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
    throw new ApiError(400,"You have already liked this memory.");
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



export const likeService = {
  createEventLikeService,
  createMemoryLikeService,
  getMemoryLikeCountService,
  getMemoryLikedUsersService,
  removeMemoryLikeService
};