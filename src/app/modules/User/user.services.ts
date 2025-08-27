import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { IUser } from "./user.interface";
import * as bcrypt from "bcrypt";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { Prisma, User } from "@prisma/client";
import { userSearchAbleFields } from "./user.costant";
import config from "../../../config";
import httpStatus from "http-status";
import { Request } from "express";
import { fileUploader } from "../../../helpars/fileUploader";
import { string } from "zod";
import crypto from 'crypto';
import jwt, { Secret } from 'jsonwebtoken';
// import emailSender from "../../../shared/emailSender";
import { json } from "stream/consumers";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import emailSender from "../../../shared/emailSender";
import { registrationOtpTemplate } from "./registrationOtpTemplate";

// Create a new user in the database.




const createUserIntoDb = async (payload: IUser) => {
  const { email, password, fcmToken } = payload;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User already exists");
  }

  // Hash the password
  if (!password) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password is required");
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create the new user
  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: "USER",
      status: "ACTIVE",
      fcmToken,
    },
  });

  if (!newUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create user");
  }

  // Generate a new OTP
  const otp = Number(crypto.randomInt(1000, 9999));

  // Set OTP expiration time to 5 minutes from now
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

 

  // Update the user with the OTP and expiration time
  await prisma.user.update({
    where: { id: newUser.id },
    data: {
      otp,
      expirationOtp: otpExpires,
    },
  });
  
   await emailSender(newUser.email, registrationOtpTemplate(otp), 'User Email Verification OTP',);

  // Generate JWT token
  const token = jwtHelpers.generateToken(
    {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in!
  );

  // Return user info & token
  return {
    user: {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
    },
    accessToken: token,
  };
};


const updateUserProfile = async (userId: string, updateData: Partial<IUser>, file?: Express.Multer.File) => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }



  // If file exists, upload and set profileImage url
  if (file) {
    const uploadedImageUrl = await fileUploader.uploadToDigitalOcean(file);
    updateData.profileImage = uploadedImageUrl.Location;
  }

  // Update user profile with only provided fields
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...updateData,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      profileImage: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      interests: true,
    },
  });

  return updatedUser;
};






const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      profileImage: true,
      role: true,

      createdAt: true,
      updatedAt: true,
      isFaceVerified: true,
    },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};






export const userService = {
  createUserIntoDb,
  updateUserProfile,
  getUserProfile,
  // deleteUserDocumentImage,

}; 
