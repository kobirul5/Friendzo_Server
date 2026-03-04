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
import { Gender, RequestStatus, User } from "@prisma/client";
import { deleteImageAndFile } from "../../../helpars/fileDelete";

const createUserIntoDb = async (payload: IUser & { referredId?: string }) => {
  const { email, password, fcmToken, referredId } = payload;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `User already exists with this email ${email}`
    );
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

  if (referredId) {
    await prisma.user.update({
      where: { id: referredByUserId },
      data: {
        totalCoins: { increment: 20 },
      },
    });

    await prisma.user.update({
      where: { id: newUser.id },
      data: {
        totalCoins: { increment: 20 },
      },
    });
  }

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
    "Together App - Verify Your Email Address"
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
// Update user
const updateUserProfile = async (
  userId: string,
  updateData: Partial<User>,
  files?: Express.Multer.File[]
) => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (updateData.referralCode) {
    throw new ApiError(400, "Referral code cannot be updated");
  }

  if (updateData.referredBy) {
    throw new ApiError(400, "Referred by cannot be updated");
  }

  if (updateData.password) {
    throw new ApiError(400, "Password cannot be updated");
  }

  if (
    updateData.gender &&
    updateData.gender !== Gender.EVERYONE &&
    updateData.gender !== Gender.HIM &&
    updateData.gender !== Gender.HER
  ) {
    throw new ApiError(
      400,
      "Invalid gender. gender must be one of: HIM, HER, EVERYONE"
    );
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
    updateData.interests = updateData.interests;
  }
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (updateData.age !== undefined && typeof updateData.age === "number") {
    const age = updateData.age;

    const currentDate = new Date();

    const birthYear = currentDate.getFullYear() - age;

    const dateOfBirthObject = new Date(Date.UTC(birthYear, 0, 1, 0, 0, 0));

    updateData.dob = dateOfBirthObject;
  }

  // If files are uploaded, upload them
  if (files && files.length > 0) {
    const uploadedImages = await Promise.all(
      files.map((file) => fileUploader.uploadToDigitalOcean(file))
    );
    const uploadedImageUrl = uploadedImages.map((img) => img.Location);
    updateData.profileImage = uploadedImageUrl[0];
  }

  // Update user profile with only provided fields
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...updateData,
      updatedAt: new Date(),
    },
  });

  if (!updatedUser) {
    throw new ApiError(400, "Failed to update user profile");
  }

  return { ...updatedUser, password: undefined };
};

// upload profile image
const profileImageUpload = async (
  userId: string,
  file: Express.Multer.File
) => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!file) {
    throw new ApiError(400, "Profile image file is required");
  }

  // Upload new image
  const uploaded = await fileUploader.uploadToDigitalOcean(file);
  console.log("Uploaded image URL:", uploaded);

  // Update profile image
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      profileImage: uploaded.Location,
      updatedAt: new Date(),
    },
  });

  if (!updatedUser) {
    // Rollback upload if update fails
    await deleteImageAndFile.deleteFileFromDigitalOcean(uploaded.Location);
    throw new ApiError(400, "Failed to update profile image");
  }

  // Delete old image if exists
  if (user.profileImage) {
    await deleteImageAndFile.deleteFileFromDigitalOcean(user.profileImage);
  }

  return { ...updatedUser, password: undefined };
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

const getSingleUser = async (userId: string, currentUserId?: string) => {
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
      address: true,
      about: true,
      age: true,
      memories: true,
      event: true,
      interests: true,
      aiMessage: true,
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

  const followersCount = await prisma.follow.count({
    where: { followingId: userId },
  });
  const followingsCount = await prisma.follow.count({
    where: {
      followerId: userId,
      // requestStatus: RequestStatus.ACCEPTED,
    },
  });
  const gifts = await getGifts(userId);

  const profileComplete = user.about;

  // 6️⃣ Subscription check
  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      AND: [
        {
          OR: [
            { endedAt: null }, 
            { endedAt: { gte: new Date() } }, 
          ],
        },
      ],
    },
  });
  const isSubscribed = !!activeSubscription;

  const isMe = currentUserId === userId;
  if (currentUserId) {
    const isFriend = await isFriendOrFollow(currentUserId, userId);
    return {
      ...user,
      interestsDetails,
      followersCount,
      followingsCount,
      gifts,
      isProfileComplete: profileComplete,
      isFriend: isFriend.isFriend,
      followStatus: isFriend.requestStatus,
      userRequestStatus: isFriend.userRequestStatus,
      isMe,
    };
  }

  return {
    ...user,
    interestsDetails,
    followersCount,
    followingsCount,
    gifts,
    isProfileComplete: profileComplete,
    isSubscribed,
    isMe,
  };
};

const isFriendOrFollow = async (
  userId: string,
  friendId: string
): Promise<{
  isFriend: boolean;
  requestStatus: string;
  userRequestStatus: string;
}> => {
  // Check follows in both directions
  const follows = await prisma.follow.findMany({
    where: {
      OR: [
        {
          followerId: userId,
          followingId: friendId,
        },
        {
          followerId: friendId,
          followingId: userId,
        },
      ],
    },
    select: {
      requestStatus: true,
      followerId: true,
      followingId: true,
    },
  });

  if (follows.length === 0) {
    return {
      isFriend: false,
      requestStatus: "NOTFOLLOW",
      userRequestStatus: "NOTFOLLOW",
    };
  }

  // Social mode: one ACCEPTED follow is enough
  const accepted = follows.find((f) => f.requestStatus === "ACCEPTED");
  if (accepted) {
    return {
      isFriend: true,
      requestStatus: "ACCEPTED",
      userRequestStatus: "NOTFOLLOW",
    };
  }
  return {
    isFriend: false,
    requestStatus: follows[0]?.requestStatus || "NOTFOLLOW",
    userRequestStatus:
      follows.find((f) => f.followingId === userId)?.requestStatus ||
      "NOTFOLLOW",
  };
};

export const getGifts = async (userId: string) => {
  // 1. Purchases groupBy
  const purchases = await prisma.giftPurchase.groupBy({
    by: ["giftCardId"],
    where: { userId },
    _count: { giftCardId: true },
  });

  // Fetch all gift cards used in purchases
  const purchaseGiftCards = await prisma.giftCard.findMany({
    where: { id: { in: purchases.map((p) => p.giftCardId) } },
  });

  // Map purchases with counts
  const purchasesData = purchases.map((p) => {
    const giftCard = purchaseGiftCards.find((gc) => gc.id === p.giftCardId);
    return {
      ...giftCard,
      count: p._count.giftCardId,
    };
  });

  // 2. Received groupBy
  const received = await prisma.giftSend.groupBy({
    by: ["giftCardId"],
    where: { receiverId: userId },
    _count: { giftCardId: true },
  });

  const receivedGiftCards = await prisma.giftCard.findMany({
    where: { id: { in: received.map((r) => r.giftCardId) } },
  });

  const receivedData = received.map((r) => {
    const giftCard = receivedGiftCards.find((gc) => gc.id === r.giftCardId);
    return {
      ...giftCard,
      count: r._count.giftCardId,
    };
  });

  // 3. Group by category helper
  const groupByCategory = (
    data: typeof purchasesData | typeof receivedData
  ) => {
    return data.reduce((acc, item) => {
      if (!item.category) return acc;
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof data>);
  };

  return {
    purchases: groupByCategory(purchasesData),
    received: groupByCategory(receivedData),
  };
};

const getReferralCode = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      referralCode: true,
    },
  });
  return user;
};

const decreaseAiMessageCount = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      aiMessage: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (!user.aiMessage || user.aiMessage <= 0) {
    throw new ApiError(400, "No AI messages left to decrease");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      aiMessage: { decrement: 1 }, // Remove the last message
    },
    select: {
      id: true,
      aiMessage: true,
    },
  });
  return updatedUser;
};

const checkUser = async (email: string) => {
  const user = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });

  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      `User not found with email: ${email}`
    );
  }

  if (user.isVerified === false) {
    await prisma.user.delete({
      where: {
        id: user.id,
      },
    });
    throw new ApiError(
      httpStatus.NOT_FOUND,
      `User not found with email: ${email}`
    );
  }

  return "User already exists with this email";
};

export const userService = {
  createUserIntoDb,
  profileImageUpload,
  updateUserProfile,
  getUserProfile,
  getSingleUser,
  getReferralCode,
  decreaseAiMessageCount,
  checkUser,
};
