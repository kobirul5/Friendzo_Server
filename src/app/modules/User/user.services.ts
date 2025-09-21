import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { IUser, UpdateDatingProfileInput } from "./user.interface";
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
import { Gender, User } from "@prisma/client";
import { deleteFile } from "../../../helpars/fileDelete";


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

  if(updateData.referralCode){
    throw new ApiError(400, "Referral code cannot be updated");
  }

  if(updateData.referredBy){
    throw new ApiError(400, "Referred by cannot be updated");
  }

  if (updateData.password) {
    throw new ApiError(400, "Password cannot be updated");
  }

  if(updateData.interestedGender !== Gender.EVERYONE && updateData.interestedGender !== Gender.HIM && updateData.interestedGender !== Gender.HER){
    throw new ApiError(400, "Invalid gender. gender must be one of: HIM, HER, EVERYONE");
  }

  if (updateData.email) {
    throw new ApiError(400, "Email cannot be updated");
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
  }
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

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

  if (!updatedUser) {
    throw new ApiError(400, "Failed to update user profile");
  }

  if (file && existingUser?.profileImage) {
    await deleteFile.deleteFileFromDigitalOcean(existingUser.profileImage);
  }

  return updatedUser;
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
      totalCoins: true,
      phoneNumber: true,
      gender: true,
      about: true,
      age: true,
      memories: true,
      event: true,
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

  const followrsCount = await prisma.follow.count({
    where: { followingId: userId },
  });
  const followingsCount = await prisma.follow.count({
    where: { followerId: userId },
  });
  const gifts = await getGifts(userId);

  return { ...user, interestsDetails, followrsCount, followingsCount, gifts};
};

// get gifts
const getGifts = async (userId: string) => {
  // 1. Purchases groupBy
  const purchases = await prisma.giftPurchase.groupBy({
    by: ["giftCardId"],
    where: { userId },
    _count: { giftCardId: true },
  });

  // Purchases giftCard details
  const purchaseGiftCards = await prisma.giftCard.findMany({
    where: { id: { in: purchases.map((p) => p.giftCardId) } },
  });

  const purchasesData = purchases.map((p) => {
    const giftCard = purchaseGiftCards.find((gc) => gc.id === p.giftCardId);
    return {
      giftCardId: p.giftCardId,
      count: p._count.giftCardId,
      giftCard,
    };
  });

  // 2. Received groupBy
  const received = await prisma.giftSend.groupBy({
    by: ["giftCardId"],
    where: { receiverId: userId },
    _count: { giftCardId: true },
  });

  // Received giftCard details
  const receivedGiftCards = await prisma.giftCard.findMany({
    where: { id: { in: received.map((r) => r.giftCardId) } },
  });

  const receivedData = received.map((r) => {
    const giftCard = receivedGiftCards.find((gc) => gc.id === r.giftCardId);
    return {
      giftCardId: r.giftCardId,
      count: r._count.giftCardId,
      giftCard,
    };
  });

  // 3. Final response
  return{
     purchases: purchasesData,
      received: receivedData,
  }
};


//  update dating profile
const updateDatingProfile = async (
  userId: string,
  updateData: UpdateDatingProfileInput,
  files?: Express.Multer.File[] // multiple files, optional
) => {
  // 1. Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // 2. Prepare merged data
  const mergedData: any = {};

  // Overwrite string fields
  if (updateData.interestedGender) {
    // Prisma expects array, wrap single string
    mergedData.interestedGender = updateData.interestedGender;
  }

  if (updateData.datingAbout) {
    mergedData.datingAbout = updateData.datingAbout;
  }

  // Validate datingInterests if provided
  if (updateData.datingInterests && updateData.datingInterests.length > 0) {
    const interests = await prisma.interest.findMany({ select: { name: true } });
    const CategoriesArray = interests.map(i => i.name);

    const invalidNames = updateData.datingInterests.filter(
      name => !CategoriesArray.includes(name)
    );

    if (invalidNames.length > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid interest names: ${invalidNames.join(", ")}. Must be one of: ${CategoriesArray.join(", ")}.`
      );
    }

    // Merge array
    mergedData.datingInterests = [
      ...new Set([...(user.datingInterests || []), ...updateData.datingInterests])
    ];
  }

  if(!files){
    throw new ApiError(400, "No files uploaded");
  }

  // Handle multiple file uploads if files are provided
  if (files && files.length > 0) {
    const uploadedUrls: string[] = [];
    for (const file of files) {
      const uploaded = await fileUploader.uploadToDigitalOcean(file);
      uploadedUrls.push(uploaded.Location);
    }

    mergedData.datingImage = [
      ...new Set([...(user.datingImage || []), ...uploadedUrls])
    ];
  }


  
  // 3. Update user profile
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...mergedData,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      datingAbout: true,
      datingInterests: true,
      datingImage: true,
      interestedGender: true,
      updatedAt: true,
    },
  });


  if (!updatedUser) {
    await deleteFile.deleteFileFromDigitalOcean(mergedData.datingImage);
    throw new ApiError(400, "Failed to update user profile");
  }

  return updatedUser;
};



export const userService = {
  createUserIntoDb,
  updateUserProfile,
  getUserProfile,
  getSingleUser,
  updateDatingProfile,
  // deleteUserDocumentImage,
};
