import httpStatus from "http-status";
import prisma from "../../../../shared/prisma";
import ApiError from "../../../../errors/ApiErrors";
import { fileUploader } from "../../../../helpars/fileUploader";
import { Gender, GiftCategory } from "@prisma/client";
import { IGetGiftCardList } from "./giftCard.interface";
import { deleteImageAndFile } from "../../../../helpars/fileDelete";

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
    await deleteImageAndFile.deleteFileFromDigitalOcean(uploaded.Location);
    throw new ApiError(500, "Failed to create fashion.");
  }

  return created;
};



 const getGiftCardList = async ({ userId, type = "ALL" }: IGetGiftCardList) => {
  // check user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "Unauthorized!, User not found!");
  }

  if(type !== "ALL" && type !== "ESSENTIAL" && type !== "EXCLUSIVE" && type !== "MAJESTIC"){
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid type. type must be one of: ALL, ESSENTIAL, EXCLUSIVE, MAJESTIC"
    );
  }

  // build query dynamically
  const categories: GiftCategory[] =
    type === "ALL"
      ? [GiftCategory.ESSENTIAL, GiftCategory.EXCLUSIVE, GiftCategory.MAJESTIC]
      : [type as GiftCategory];

  const giftCards = await prisma.giftCard.findMany({
    where: {
      category: { in: categories },
    },
    orderBy: { createdAt: "desc" },
  });

  return giftCards; // ekta array e sob gift card
};

// delete
const deleteItemFromDb = async (id: string) => {
  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST,"Id is required");
  }

  const giftParches = await prisma.giftPurchase.findFirst({where:{giftCardId:id}});
  if(giftParches){
    throw new ApiError(httpStatus.BAD_REQUEST, "This gift card has already been purchased by users and cannot be deleted.");
  }
  const giftSend = await prisma.giftSend.findFirst({where:{giftCardId:id}});
  if(giftSend){
    throw new ApiError(httpStatus.BAD_REQUEST, "This gift card has already been purchased by users and cannot be deleted.");
  }


  const giftCard = await prisma.giftCard.findUnique({ where: { id } });
  if (!giftCard) {
    throw new ApiError(httpStatus.NOT_FOUND,"GiftCard not found");
  }
  const result = await prisma.giftCard.delete({ where: { id } });
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


export const giftCardService = {
  createGiftCard,
  getGiftCardList,
  getByIdFromDb,
  updateIntoDb,
  deleteItemFromDb,
};
