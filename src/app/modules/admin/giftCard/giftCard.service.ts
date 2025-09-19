import httpStatus from "http-status";
import prisma from "../../../../shared/prisma";
import ApiError from "../../../../errors/ApiErrors";
import { fileUploader } from "../../../../helpars/fileUploader";
import { deleteFile } from "../../../../helpars/fileDelete";
import { Gender, GiftCategory } from "@prisma/client";

const createGiftCard = async ({ data, userId, imagesFile }: any) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");

  if (user.role !== "ADMIN")
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Unauthorized! Only Admin can create!"
    );

  if (!imagesFile) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Image is required.");
  }

  if (
    data.category !== GiftCategory.ESSENTIAL &&
    data.category !== GiftCategory.EXCLUSIVE &&
    data.category !== GiftCategory.MAJESTIC
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid category. category must be one of: ESSENTIAL, EXCLUSIVE, MAJESTIC"
    );
  }

  if (
    data.gender !== Gender.HIM &&
    data.gender !== Gender.HER &&
    data.gender !== Gender.EVERYONE
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid gender. gender must be one of: HIM, HER, EVERYONE"
    );
  }

  // Only take  image
  const uploaded = await fileUploader.uploadToDigitalOcean(imagesFile);

  const dataToSave: any = {
    ...data,
    price: parseFloat(data.price),
    image: uploaded.Location, // single string
  };

  const created = await prisma.giftCard.create({ data: dataToSave });
  if (!created) {
    await deleteFile.deleteFileFromDigitalOcean(uploaded.Location);
    throw new ApiError(500, "Failed to create fashion.");
  }

  return created;
};

//  buy gift card

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
    throw new ApiError(httpStatus.NOT_FOUND, "GiftCard not found! With this Id and giftCategory");


  if(user.totalCoins < giftCard.price) throw new ApiError(httpStatus.BAD_REQUEST, "You don't have enough coins to buy this gift card!");


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
      giftCard:true
    }
  });

  return result;
};

const getListFromDb = async () => {
  const result = await prisma.giftCard.findMany();
  return result;
};

const getByIdFromDb = async (id: string) => {
  const result = await prisma.giftCard.findUnique({ where: { id } });
  if (!result) {
    throw new Error("GiftCard not found");
  }
  return result;
};

const updateIntoDb = async (id: string, data: any) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const result = await prisma.giftCard.update({
      where: { id },
      data,
    });
    return result;
  });

  return transaction;
};

const deleteItemFromDb = async (id: string) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const deletedItem = await prisma.giftCard.delete({
      where: { id },
    });

    // Add any additional logic if necessary, e.g., cascading deletes
    return deletedItem;
  });

  return transaction;
};
export const giftCardService = {
  createGiftCard,
  buyGiftCard,
  getListFromDb,
  getByIdFromDb,
  updateIntoDb,
  deleteItemFromDb,
};
