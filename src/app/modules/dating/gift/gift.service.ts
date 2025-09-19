import httpStatus from "http-status";
import prisma from "../../../../shared/prisma";
import ApiError from "../../../../errors/ApiErrors";
import { Gender, GiftCategory } from "@prisma/client";

const buyGiftCard = async ({ data, userId }: any) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");

  if (
    data.giftCategory !== GiftCategory.ESSENTIAL &&
    data.giftCategory !== GiftCategory.EXCLUSIVE &&
    data.giftCategory !== GiftCategory.MAJESTIC
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid category. category must be one of: ESSENTIAL, EXCLUSIVE, MAJESTIC"
    );
  }

  const giftCard = await prisma.giftCard.findUnique({
    where: { id: data.giftCardId, category: data.giftCategory },
  });
  if (!giftCard)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "GiftCard not found! With this Id and giftCategory"
    );

  if (user.totalCoins < giftCard.price)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You don't have enough coins to buy this gift card!"
    );

  await prisma.user.update({
    where: { id: user.id },
    data: {
      totalCoins: user.totalCoins - giftCard.price,
    },
  });

  const result = await prisma.giftPurchase.create({
    data: {
      userId: user.id,
      giftCardId: giftCard.id,
      giftCategory: giftCard.category,
    },
    select: {
      giftCard: true,
    },
  });

  return result;
};

const getGiftCardList = async ({
  userId,
  gender,
}: {
  userId: string;
  gender: Gender;
}) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user)
    throw new ApiError(httpStatus.NOT_FOUND, "Unauthorized!, User not found!");

  if (
    gender !== Gender.HIM &&
    gender !== Gender.HER &&
    gender !== Gender.EVERYONE
  )
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid gender. gender must be one of: HIM, HER, EVERYONE"
    );

  const Essential = await prisma.giftCard.findMany({
    where: {
      gender: gender,
      category: GiftCategory.ESSENTIAL,
    },
  });

  const Exclusive = await prisma.giftCard.findMany({
    where: {
      gender: gender,
      category: GiftCategory.EXCLUSIVE,
    },
  });

  const Majestic = await prisma.giftCard.findMany({
    where: {
      gender: gender,
      category: GiftCategory.MAJESTIC,
    },
  });

  const result = {
    Essential,
    Exclusive,
    Majestic,
  };

  return result;
};

export const giftService = {
  buyGiftCard,
  getGiftCardList,
};
