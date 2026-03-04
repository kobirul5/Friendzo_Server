import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { AuthServices } from "./auth.service";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { string } from "zod";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.loginUser(req.body);

  res.cookie("accessToken", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully",
    data: result,
  });
});


const logoutUser = catchAsync(async (req: Request, res: Response) => {
  // Clear the token cookies
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  // Clear user's fcmToken from DB
  await prisma.user.update({
    where: { id: req.user.id },
    data: { fcmToken: null },
  });

  // Send success response
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User successfully logged out",
    data: null,
  });
});


// get user profile
const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.headers.authorization;

  const result = await AuthServices.getMyProfile(userToken as string);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "User profile retrieved successfully",
    data: result,
  });
});

// change password
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const userToken = req.headers.authorization;
  const { oldPassword, newPassword } = req.body;

  const result = await AuthServices.changePassword(
    userToken as string,
    newPassword,
    oldPassword
  );
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Password changed successfully",
    data: result,
  });
});


// forgot password
const forgotPassword = catchAsync(async (req: Request, res: Response) => {

  const result = await AuthServices.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Check your email!",
    data: result
  })
});
const resendOtp = catchAsync(async (req: Request, res: Response) => {

  const result = await AuthServices.resendOtp(req.body.email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Check your email!",
    data: result
  })
});
const verifyForgotPasswordOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.verifyForgotPasswordOtp(req.body);

  res.cookie("accessToken", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP verification successful",
    data: result,
  });
});


const resetPassword = catchAsync(async (req: Request, res: Response) => {



  await AuthServices.resetPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password Reset!",
    data: null
  })
});



const socialLoginController = catchAsync(async (req: Request, res: Response) => {
  const { provider, accessToken } = req.body;
  if (!provider || !accessToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Provider and access token are required");
  }

  const result = await AuthServices.socialLogin(provider, accessToken);
  if (!result) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Social login failed");
  }

  res.cookie("accessToken", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully",
    data: result,
  });
});

const deleteAccount = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  await AuthServices.deleteAccount(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Account deleted successfully",
    data: null,
  });
});


export const AuthController = {
  loginUser,
  logoutUser,
  getMyProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  resendOtp,
  verifyForgotPasswordOtp,
  socialLoginController,
  deleteAccount

};
