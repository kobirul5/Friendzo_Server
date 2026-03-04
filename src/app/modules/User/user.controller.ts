import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { userService } from "./user.services";
import { Request, Response } from "express";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createUserIntoDb(req.body);

  res.cookie("accessToken", result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User registered successfully",
    data: result,
  });
});

const updateProfile = catchAsync(async (req: any, res: Response) => {
  const userId = req.user.id;
  const updateData = JSON.parse(req.body.data);
  // Multer stores multiple images under `req.files.images`
  const filesObj = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;
  const files = filesObj?.images;

  const user = await userService.updateUserProfile(userId, updateData, files);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile updated successfully",
    data: user,
  });
});
const profileImageUpload = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const file = req.file as Express.Multer.File;

  const user = await userService.profileImageUpload(userId, file);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: " profile image updated successfully",
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
  const currentUserId = req.user.id;
  const user = await userService.getSingleUser(userId, currentUserId);
  res.status(200).json({
    success: true,
    message: "User profile retrieved successfully!",
    data: user,
  });
});

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

const decreaseAiMessageCount = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const user = await userService.decreaseAiMessageCount(userId);
  res.status(200).json({
    success: true,
    message: "Ai message count dicreased successfully!",
    data: user,
  });
})

const checkUser = catchAsync(async (req: Request, res: Response) => {
  const email = req.body.email;

  const result = await userService.checkUser(email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile retrieved successfully",
    data: result,
  });
});


export const userController = {
  createUser,
  updateProfile,
  profileImageUpload,
  getUserProfile,
  getSingleUser,
  getReferralCode,
  decreaseAiMessageCount,
  checkUser,
};
