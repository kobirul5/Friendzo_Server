import httpStatus from "http-status";

import { giftService } from "./gift.service";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import { Gender } from "@prisma/client";

const buyGiftCard = catchAsync(async (req, res) => {
  const data = req.body;
  const userId = req.user.id;
  const result = await giftService.buyGiftCard({
    data,
    userId,
  });
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "GiftCard created successfully",
    data: result,
  });
});

const getGiftCardList = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const gender = req.query.gender as Gender;
  const result = await giftService.getGiftCardList({ userId, gender });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "GiftCard list retrieved successfully",
    data: result,
  });
});

// getGiftCardList



export const giftController = {
  buyGiftCard,
  getGiftCardList
};
