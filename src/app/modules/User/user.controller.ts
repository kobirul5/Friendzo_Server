import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { userService } from "./user.services";
import { Request, Response } from "express";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createUserIntoDb(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User registered successfully",
    data: result,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const updateData = JSON.parse(req.body.data);
  const file = req.file;

  const user = await userService.updateUserProfile(userId, updateData, file);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile updated successfully",
    data: user,
  });
});

const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const user = await userService.getSingleUser(userId);
  res.status(200).json({
    success: true,
    message: "User profile retrieved successfully!",
    data: user,
  });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const user = await userService.getSingleUser(userId);
  res.status(200).json({
    success: true,
    message: "User profile retrieved successfully!",
    data: user,
  });
});


//  updateDatingProfile

const updateDatingProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;

  // Parse JSON from form-data
  const updateData = JSON.parse(req.body.data);

  // Multiple files
  const filesObj = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

  // Get array for field 'images'
  const files = filesObj?.images; // array or undefined


  const user = await userService.updateDatingProfile(userId, updateData, files);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Dating profile updated successfully",
    data: user,
  });
});

// const deleteUserDocumentImage = catchAsync(async (req: Request, res: Response) => {
//   const userId = req.params.id;
//   const { imageUrl } = req.body;

//   if (!imageUrl) {
//     throw new ApiError(400, "Image URL is required");
//   }

//   const user = await userService.deleteUserDocumentImage(userId, imageUrl);

//   res.status(200).json({
//     success: true,
//     message: "Image deleted successfully!",
//     data: user,
//   });
// });

const getReferralCode = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  console.log(userId);
  const user = await userService.getReferralCode(userId);
  res.status(200).json({
    success: true,
    message: "Referral code retrieved successfully!",
    data: user,
  });
});

export const userController = {
  createUser,
  updateProfile,
  getUserProfile,
  getSingleUser,
  updateDatingProfile,
  getReferralCode
  // deleteUserDocumentImage,
};
