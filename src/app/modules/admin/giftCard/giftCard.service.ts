import httpStatus from "http-status";
import prisma from "../../../../shared/prisma";
import ApiError from "../../../../errors/ApiErrors";
import { fileUploader } from "../../../../helpars/fileUploader";
import { deleteFile } from "../../../../helpars/fileDelete";
import { GiftCategory } from "@prisma/client";

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

  if(data.category !== GiftCategory.ESSENTIAL && data.category !== GiftCategory.EXCLUSIVE && data.category !== GiftCategory.MAJESTIC){
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid category. category must be one of: ESSENTIAL, EXCLUSIVE, MAJESTIC");
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
  getListFromDb,
  getByIdFromDb,
  updateIntoDb,
  deleteItemFromDb,
};
