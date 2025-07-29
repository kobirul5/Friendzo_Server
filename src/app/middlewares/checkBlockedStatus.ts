import prisma from "../../shared/prisma";

export const isBlocked = async (senderId: string, receiverId: string) => {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        {
          blockerId: senderId,
          blockedUserId: receiverId,
        },
        {
          blockerId: receiverId,
          blockedUserId: senderId,
        },
      ],
    },
  });

  return !!block;
};
