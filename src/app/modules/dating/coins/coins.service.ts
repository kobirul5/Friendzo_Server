
import httpStatus from 'http-status';
import ApiError from '../../../../errors/ApiErrors';
import prisma from '../../../../shared/prisma';
import { RequestStatus } from '@prisma/client';

const getCoinList = async ({userId}: any) => { 

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "Unauthorized!, User not found!");


  const result = await prisma.coins.findMany();
  return result;
};


const createGiftCoin = async ({
  coinAmount,
  userId, // sender
  recipients, // array of recipient user IDs
}: {
  coinAmount: number;
  userId: string;
  recipients: string[];
}) => {
  const sender = await prisma.user.findUnique({ where: { id: userId } });
  if (!sender) throw new ApiError(httpStatus.NOT_FOUND, "Sender not found");

  const totalCost = coinAmount * recipients.length;

  if (totalCost > sender.totalCoins) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `You don't have enough coins. You need ${totalCost} coins but only have ${sender.totalCoins}.`
    );
  }

  // Verify all recipients exist
  const recipientRecords = await prisma.user.findMany({
    where: { id: { in: recipients } },
    select: { id: true, firstName: true, lastName: true, fcmToken: true },
  });

  if (recipientRecords.length !== recipients.length) {
    const foundIds = recipientRecords.map((r) => r.id);
    const missingIds = recipients.filter((id) => !foundIds.includes(id));
    throw new ApiError(
      httpStatus.NOT_FOUND,
      `Recipient(s) not found: ${missingIds.join(", ")}`
    );
  }

  // Perform transaction
  const result = await prisma.$transaction(async (tx) => {
    // Deduct total coins from sender
    await tx.user.update({
      where: { id: userId },
      data: { totalCoins: { decrement: totalCost } },
    });

    // Increment coins for each recipient, log gift, and send notification
    for (const recipient of recipientRecords) {
      await tx.user.update({
        where: { id: recipient.id },
        data: { totalCoins: { increment: coinAmount } },
      });

      await tx.coinGiftSend.create({
        data: {
          senderId: userId,
          receiverId: recipient.id,
          totalCoin: coinAmount,
        },
      });
    }

    return { success: true, totalCoinsDeducted: totalCost };
  });

  return result;
};


const buyCoin = async ({ data, userId }: any) => {
 
  return "result";
};

export const coinsService = { 
  getCoinList,
  buyCoin,
  createGiftCoin
};