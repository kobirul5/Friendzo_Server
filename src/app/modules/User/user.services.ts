import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { IUser } from "./user.interface";
import * as bcrypt from "bcrypt";
import config from "../../../config";
import httpStatus from "http-status";
import { Request } from "express";
import { fileUploader } from "../../../helpars/fileUploader";
import { string } from "zod";
import crypto from "crypto";
import jwt, { Secret } from "jsonwebtoken";
// import emailSender from "../../../shared/emailSender";
import { json } from "stream/consumers";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import emailSender from "../../../shared/emailSender";
import { registrationOtpTemplate } from "./registrationOtpTemplate";
import { getRefferId } from "../../../helpars/generateRefferId";
import { User } from "@prisma/client";

// const createUserIntoDb = async (payload: IUser) => {
//   const { email, password, fcmToken, referredBy } = payload;

//   // Check if user already exists
//   const existingUser = await prisma.user.findUnique({
//     where: { email },
//   });

//   if (existingUser) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "User already exists");
//   }

//   const refID = getRefferId();

//   // Hash the password
//   if (!password) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Password is required");
//   }
//   const hashedPassword = await bcrypt.hash(password, 10);

//   // Create the new user
//   const newUser = await prisma.user.create({
//     data: {
//       email,
//       password: hashedPassword,
//       referralCode: refID,

//       role: "USER",
//       status: "ACTIVE",
//       fcmToken,
//     },
//   });

//   if (!newUser) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create user");
//   }

//   // Generate a new OTP
//   const otp = Number(crypto.randomInt(1000, 9999));

//   // Set OTP expiration time to 5 minutes from now
//   const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

//   // Update the user with the OTP and expiration time
//   await prisma.user.update({
//     where: { id: newUser.id },
//     data: {
//       otp,
//       expirationOtp: otpExpires,
//     },
//   });

//   await emailSender(
//     newUser.email,
//     registrationOtpTemplate(otp),
//     "User Email Verification OTP"
//   );

//   // Generate JWT token
//   const token = jwtHelpers.generateToken(
//     {
//       id: newUser.id,
//       email: newUser.email,
//       role: newUser.role,
//     },
//     config.jwt.jwt_secret as Secret,
//     config.jwt.expires_in!
//   );

//   // Return user info & token
//   return {
//     user: {
//       id: newUser.id,
//       email: newUser.email,
//       role: newUser.role,
//       status: newUser.status,
//     },
//     accessToken: token,
//   };
// };

const createUserIntoDb = async (payload: IUser & { referredId?: string }) => {
  const { email, password, fcmToken, referredId } = payload;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User already exists");
  }

  // Hash password
  if (!password)
    throw new ApiError(httpStatus.BAD_REQUEST, "Password is required");
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate unique referral code for the new user
  let newReferralCode = getRefferId();
  // Ensure uniqueness in DB
  while (
    await prisma.user.findUnique({ where: { referralCode: newReferralCode } })
  ) {
    newReferralCode = getRefferId();
  }

  // Handle referral if a referral code was provided
  let referredByUserId: string | undefined;
  if (referredId) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: referredId },
    });
    if (!referrer) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid referral code");
    }
    referredByUserId = referrer.id;
  }

  // Create the new user
  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: "USER",
      status: "ACTIVE",
      fcmToken,
      referralCode: newReferralCode,
      referredBy: referredByUserId,
    },
  });

  if (!newUser)
    throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create user");

  // Generate OTP
  const otp = Number(crypto.randomInt(1000, 9999));
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.user.update({
    where: { id: newUser.id },
    data: { otp, expirationOtp: otpExpires },
  });

  await emailSender(
    newUser.email,
    registrationOtpTemplate(otp),
    "User Email Verification OTP"
  );

  // Generate JWT token
  const token = jwtHelpers.generateToken(
    { id: newUser.id, email: newUser.email, role: newUser.role },
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
      referralCode: newUser.referralCode,
      referredBy: newUser.referredBy || null,
    },
    accessToken: token,
  };
};

const updateUserProfile = async (
  userId: string,
  updateData: Partial<User>,
  file?: Express.Multer.File
) => {
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

  if (updateData.interests && updateData.interests.length > 0) {
    // Validate interests against fixed array

    const interests = await prisma.interest.findMany({
      select: { name: true },
    });

    const CategoriesArray = interests.map((interest) => interest.name);

    const invalidNames = updateData.interests.filter(
      (name) =>
        !CategoriesArray.includes(name as (typeof CategoriesArray)[number])
    );

    if (invalidNames.length > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid interest names: ${invalidNames.join(", ")}. ` +
          `You must use one of the following names: ${CategoriesArray.join(
            ", "
          )}.`
      );
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
  }
};

const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};

const getSingleUser = async (userId: string) => {
  // 1️⃣ fetch user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profileImage: true,
      email: true,
      interests: true, // string[]
    },
  });

  if (!user) throw new ApiError(404, "User not found");

  const interestsDetails = await prisma.interest.findMany({
    where: {
      OR: user.interests.map((name) => ({
        name: { equals: name, mode: "insensitive" },
      })),
    },
    select: { id: true, name: true, image: true, category: true },
  });

  return { ...user, interestsDetails };
};

export const userService = {
  createUserIntoDb,
  updateUserProfile,
  getUserProfile,
  getSingleUser,
  // deleteUserDocumentImage,
};
