import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { fileUploader } from "../../../helpars/fileUploader";

const getTotalReportService = async (options: IPaginationOptions) => {
  const totalReport = await prisma.report.count();

  return totalReport;
};
const getTotalUsersService = async (options: IPaginationOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

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

  const result = await prisma.user.delete({
    where: {
      id: existingUser.id,
    },
  });

  return result;
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
      createdAt: "desc",
    },
  });

  return {
    from: oneMonthAgo,
    to: today,
    total: reports.length,
    reports,
  };
};

const getweeklyReportService = async () => {
  const today = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(today.getDate() - 7);

  const reports = await prisma.report.findMany({
    where: {
      createdAt: {
        gte: oneWeekAgo,
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
      createdAt: "desc",
    },
  });

  return {
    from: oneWeekAgo,
    to: today,
    total: reports.length,
    reports,
  };
};

const getDailyReportService = async () => {
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  );
  const reports = await prisma.report.findMany({
    where: {
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
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
      createdAt: "desc",
    },
  });
  return {
    from: startOfDay,
    to: endOfDay,
    total: reports.length,
    reports,
  };
};

const createInterestService = async (interestData: {
  name: string;
  image?: string;
  category: string;
}) => {
  // Check if interest with the same category already exists

  const existingInterest = await prisma.interest.findFirst({
    where: { category: interestData.category },
    select: { id: true, image: true, name: true, category: true },
  });

  if (existingInterest) {
    throw new ApiError(400, "Interest with the same category already exists");
  }

  const interest = await prisma.interest.create({
    data: {
      name: interestData.name,
      image: interestData.image,
      category: interestData.category as any, // Cast to enum type
    },
  });
  return interest;
};
// get all interests
const getAllInterestsService = async () => {
  const interests = await prisma.interest.findMany();
  return interests;
};

const getConversationService = async () => {
  const rooms = await prisma.room.findMany({
    include: {
      chats: {
        orderBy: { createdAt: "desc" },
        take: 1, // latest message per room
      },
      sender: { select: { id: true, firstName: true, lastName: true } },
      receiver: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  // Map rooms to readable format
  const conversations = rooms.map((room) => ({
    roomId: room.id,
    participants: {
      sender: room.sender,
      receiver: room.receiver,
    },
    lastMessage: room.chats[0] || null,
    unreadCount: room.chats.reduce(
      (acc, chat) => (chat.isRead ? acc : acc + 1),
      0
    ),
  }));

  return conversations;
};

// single conversation
const getSingleConversationService = async (roomId: string) => {
  // Fetch room with all chats/messages
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      chats: {
        orderBy: { createdAt: "asc" }, // chronological order
      },
      sender: { select: { id: true, firstName: true, lastName: true } },
      receiver: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!room) return null;

  // Map messages to a clean format
  const messages = room.chats.map((chat) => ({
    id: chat.id,
    senderId: chat.senderId,
    text: chat.message,
    images: chat.images,
    isRead: chat.isRead,
    createdAt: chat.createdAt,
  }));

  // Return conversation in a structured format
  return {
    roomId: room.id,
    totalMessages: messages.length,
    unreadCount: messages.reduce((acc, msg) => (msg.isRead ? acc : acc + 1), 0),
    participants: {
      sender: room.sender,
      receiver: room.receiver,
    },
    messages,
  };
};

// update interest

const updateInterestService = async (
  interestId: string,
  updateData: {
    name?: string;
    file: Express.Multer.File;
    category?: string;
  }
) => {
  console.log("Update data received in service:", updateData);
  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
  });
  if (!interest) throw new ApiError(404, "Interest not found");

  if (!updateData.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No image file provided");
  }

  let uploadedFile;
  try {
    uploadedFile = await fileUploader.uploadToDigitalOcean(updateData.file);
  } catch (error) {
    console.error("File upload failed:", error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "File upload failed");
  }

  if (!uploadedFile?.Location) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to get file URL"
    );
  }

  console.log("Uploaded file URL:", uploadedFile.Location);

  const updatedInterest = await prisma.interest.update({
    where: { id: interestId },
    data: {
      // ...updateData,
      image: uploadedFile.Location,
    },
  });

  return updatedInterest;
};

export const adminService = {
  getTotalUsersService,
  deleteUserService,
  getTotalReportService,
  getMonthlyReportService,
  getweeklyReportService,
  getDailyReportService,
  createInterestService,
  getAllInterestsService,
  getConversationService,
  getSingleConversationService,
  updateInterestService,
};
