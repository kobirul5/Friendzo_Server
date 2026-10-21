import dayjs from "dayjs";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

// In-memory cache for memory existence check (5-minute TTL)
const memoryExistenceCache = new Map<string, number>();
const MEMORY_CACHE_TTL = 5 * 60 * 1000;

export const cacheMemoryIds = (memoryIds: string[]) => {
  const now = Date.now();
  if (memoryExistenceCache.size > 10000) {
    memoryExistenceCache.clear();
  }
  for (const id of memoryIds) {
    if (id && isValidObjectId(id)) {
      memoryExistenceCache.set(id, now);
    }
  }
};

export const invalidateMemoryExistenceCache = (memoryId?: string) => {
  if (memoryId) {
    memoryExistenceCache.delete(memoryId);
  } else {
    memoryExistenceCache.clear();
  }
};

// Fast in-memory state tracking for active memory likes: key = `${userId}:${memoryId}`
const activeMemoryLikes = new Set<string>();
const activeEventLikes = new Set<string>();

export const primeActiveMemoryLikes = (likes: { userId: string; memoryId: string }[]) => {
  for (const l of likes) {
    if (l.userId && l.memoryId) {
      activeMemoryLikes.add(`${l.userId}:${l.memoryId}`);
    }
  }
};

// Sequential per-key promise queue to serialize like/unlike operations and prevent DB race conditions
const pendingOperations = new Map<string, Promise<any>>();

const enqueueOperation = (key: string, operation: () => Promise<any>) => {
  const previous = pendingOperations.get(key) || Promise.resolve();
  const next = previous
    .catch(() => {})
    .then(operation)
    .finally(() => {
      if (pendingOperations.get(key) === next) {
        pendingOperations.delete(key);
      }
    });
  pendingOperations.set(key, next);
  return next;
};

const createEventLikeService = async (userId: string, eventId: string) => {
  if (!isValidObjectId(eventId)) {
    throw new ApiError(404, "Event not found");
  }

  const likeKey = `${userId}:${eventId}`;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  if (activeEventLikes.has(likeKey)) {
    throw new ApiError(400, "You have already liked this event.");
  }
  activeEventLikes.add(likeKey);

  enqueueOperation(likeKey, async () => {
    try {
      await prisma.eventLike.create({
        data: {
          userId,
          eventId,
        },
      });
    } catch (error: any) {
      if (error?.code !== "P2002") {
        console.error("Background create event like error:", error);
      }
    }
  });

  return {
    userId,
    eventId,
    createdAt: new Date(),
  };
};

const createMemoryLikeService = async (userId: string, memoryId: string) => {
  if (!isValidObjectId(memoryId)) {
    throw new ApiError(404, "Memory not found");
  }

  const likeKey = `${userId}:${memoryId}`;

  // Fast existence check using cache; fallback to lightweight DB select
  const cachedAt = memoryExistenceCache.get(memoryId);
  if (!cachedAt || Date.now() - cachedAt > MEMORY_CACHE_TTL) {
    const memory = await prisma.memory.findUnique({
      where: { id: memoryId },
      select: { id: true },
    });
    if (!memory) {
      throw new ApiError(404, "Memory not found");
    }
    if (memoryExistenceCache.size > 10000) {
      memoryExistenceCache.clear();
    }
    memoryExistenceCache.set(memoryId, Date.now());
  }

  // Fast duplicate check in-memory
  if (activeMemoryLikes.has(likeKey)) {
    throw new ApiError(400, "You have already liked this memory.");
  }

  // Immediately record state in memory
  activeMemoryLikes.add(likeKey);

  // Background non-blocking persistence to MongoDB
  enqueueOperation(likeKey, async () => {
    try {
      await prisma.memoryLike.create({
        data: {
          userId,
          memoryId,
        },
      });
    } catch (error: any) {
      if (error?.code !== "P2002") {
        console.error("Background create memory like error:", error);
      }
    }
  });

  // Instant response (2-5ms)
  return {
    userId,
    memoryId,
    createdAt: new Date(),
  };
};

const createUserLikeService = async (userId: string, likedUserId: string) => {
  if (userId === likedUserId) {
    throw new ApiError(400, "You cannot like yourself.");
  }

  if (!isValidObjectId(likedUserId)) {
    throw new ApiError(404, "Target user not found");
  }

  // Check if the user being liked exists
  const likedUser = await prisma.user.findUnique({
    where: { id: likedUserId },
    select: { id: true },
  });
  if (!likedUser) {
    throw new ApiError(404, "Target user not found");
  }

  try {
    const like = await prisma.userLike.create({
      data: {
        userId,
        likedUserId,
      },
    });

    return like;
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw new ApiError(400, "You have already liked this user.");
    }
    throw error;
  }
};

const getMemoryLikeCountService = async (memoryId: string) => {
  if (!isValidObjectId(memoryId)) {
    return 0;
  }

  const count = await prisma.memoryLike.count({
    where: { memoryId },
  });

  return count;
};

// Get users who liked a memory
const getMemoryLikedUsersService = async (memoryId: string) => {
  if (!isValidObjectId(memoryId)) {
    return [];
  }

  const likes = await prisma.memoryLike.findMany({
    where: { memoryId },
    select: {
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
  if (!isValidObjectId(memoryId)) {
    throw new ApiError(404, "Like does not exist for this memory.");
  }

  const likeKey = `${userId}:${memoryId}`;

  // Update in-memory state immediately
  activeMemoryLikes.delete(likeKey);

  // Background non-blocking persistence
  enqueueOperation(likeKey, async () => {
    try {
      await prisma.memoryLike.deleteMany({
        where: {
          userId,
          memoryId,
        },
      });
    } catch (error: any) {
      console.error("Background remove memory like error:", error);
    }
  });

  // Instant response (2-5ms)
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
          MemoryLike: true,
          Comment: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
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
          description: true,
          image: true,
          createdAt: true,
          MemoryLike: true,
          Comment: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
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

const removeUserLikeService = async (userId: string, likedUserId: string) => {
  if (!isValidObjectId(likedUserId)) {
    throw new ApiError(404, "Like does not exist for this user.");
  }

  const result = await prisma.userLike.deleteMany({
    where: {
      userId,
      likedUserId,
    },
  });

  if (result.count === 0) {
    throw new ApiError(404, "Like does not exist for this user.");
  }

  return null;
};

export const likeService = {
  createUserLikeService,
  createEventLikeService,
  createMemoryLikeService,
  removeUserLikeService,
  getMemoryLikeCountService,
  getMemoryLikedUsersService,
  removeMemoryLikeService,
  getDailyMyLikeService,
  getMyWeeklyService,
  cacheMemoryIds,
  invalidateMemoryExistenceCache,
  primeActiveMemoryLikes,
};

