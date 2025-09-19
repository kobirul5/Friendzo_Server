import httpStatus from "http-status";

import { giftCardService } from "./giftCard.service";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";

const createGiftCard = catchAsync(async (req, res) => {
  const data = JSON.parse(req.body.data);
  const userId = req.user.id;
  const imagesFile = req.file as any;
  const result = await giftCardService.createGiftCard({
    data,
    userId,
    imagesFile,
  });
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "GiftCard created successfully",
    data: result,
  });
});




const getGiftCardList = catchAsync(async (req, res) => {
  const result = await giftCardService.getListFromDb();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "GiftCard list retrieved successfully",
    data: result,
  });
});

const getGiftCardById = catchAsync(async (req, res) => {
  const result = await giftCardService.getByIdFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "GiftCard details retrieved successfully",
    data: result,
  });
});

const updateGiftCard = catchAsync(async (req, res) => {
  const result = await giftCardService.updateIntoDb(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "GiftCard updated successfully",
    data: result,
  });
});

const deleteGiftCard = catchAsync(async (req, res) => {
  const result = await giftCardService.deleteItemFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "GiftCard deleted successfully",
    data: result,
  });
});

export const giftCardController = {
  createGiftCard,
  getGiftCardList,
  getGiftCardById,
  updateGiftCard,
  deleteGiftCard,
};
