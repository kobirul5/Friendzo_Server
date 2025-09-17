import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

const shareMemoryThorwChat = async ({
  userId,
  friendsIds,
  message,
  imageUrls = [],
}: {
  userId: string;
  friendsIds: string[];
  message: string;
  imageUrls?: string[];
}) => {
  if (!userId || !friendsIds?.length || !message) {
    throw new Error("Invalid parameters");
  }

  const results = [];

  for (const friendId of friendsIds) {
    // Find existing room or create new
    let room = await prisma.room.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
    });

    if (!room) {
      room = await prisma.room.create({
        data: { senderId: userId, receiverId: friendId },
      });
    }

    // Create chat message
    const chat = await prisma.chat.create({
      data: {
        senderId: userId,
        receiverId: friendId,
        roomId: room.id,
        message,
        images: { set: imageUrls },
      },
    });

    results.push(chat);
  }

  return results; // Return all chat objects
};

export const chatService = {
    shareMemoryThorwChat,
};
