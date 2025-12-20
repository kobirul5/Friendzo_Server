import { Secret } from "jsonwebtoken";
import config from "../../../config";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import prisma from "../../../shared/prisma";
import * as bcrypt from "bcrypt";
import ApiError from "../../../errors/ApiErrors";
import emailSender from "../../../shared/emailSender";
import { UserRole, UserStatus } from "@prisma/client";
import httpStatus from "http-status";
import crypto from "crypto";
import {
  getGoogleUser,
  getFacebookUser,
} from "../../../shared/socilaAuthHelper";
import { getRefferId } from "../../../helpars/generateRefferId";

// user login
// const loginUser = async (payload: { email: string; password: string ; role: string; fcmToken?: string }) => {
//   const userData = await prisma.user.findFirst({
//     where: {
//       email: payload.email,
//       role: payload.role as UserRole,

//     },
//   });

//   if (!userData) {
//   throw new ApiError(
//     httpStatus.NOT_FOUND,
//     `User not found with email ${payload.email} and role ${payload.role}`
//   );
// }

//   if (!userData?.email) {
//     throw new ApiError(
//       httpStatus.NOT_FOUND,
//       "User not found! with this email " + payload.email
//     );
//   }
//   const isCorrectPassword: boolean = await bcrypt.compare(
//     payload.password,
//     userData.password
//   );

//   if (!isCorrectPassword) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Password incorrect!");
//   }
//   const accessToken = jwtHelpers.generateToken(
//     {
//       id: userData.id,
//       email: userData.email,
//       role: userData.role,
//     },
//     config.jwt.jwt_secret as Secret,
//     config.jwt.expires_in as string
//   );

//   return { token: accessToken , role: userData.role };
// };

const loginUser = async (payload: {
  email: string;
  password: string;
  fcmToken?: string;
}) => {
  const userData = await prisma.user.findFirst({
    where: {
      email: payload.email,
    },
  });

  if (!userData) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      `User not found with email ${payload.email} `
    );
  }

  if (!userData.password) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User password is not set.");
  }
  const isCorrectPassword = await bcrypt.compare(
    payload.password,
    userData.password
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password incorrect!");
  }

  //  FCM token save logic
  if (payload.fcmToken) {
    await prisma.user.update({
      where: { id: userData.id },
      data: { fcmToken: payload.fcmToken },
    });
  }

  const accessToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  const requiredFields = [
    userData.firstName,
    userData.lastName,
    userData.phoneNumber,
    userData.gender,
    userData.about,
    userData.interests?.length > 0,
    userData.profileImage,
  ];

  const profileComplete = requiredFields.every(Boolean);

  return {
    token: accessToken,
    role: userData.role,
    id: userData.id,
    isProfileComplete: profileComplete,
  };
};

// get user profile
const getMyProfile = async (userToken: string) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const userProfile = await prisma.user.findUnique({
    where: {
      id: decodedToken.id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      // username: true,
      email: true,
      profileImage: true,
      // phoneNumber: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return userProfile;
};

// change password

const changePassword = async (
  userToken: string,
  newPassword: string,
  oldPassword: string
) => {
  const decodedToken = jwtHelpers.verifyToken(
    userToken,
    config.jwt.jwt_secret!
  );

  const user = await prisma.user.findUnique({
    where: { id: decodedToken?.id },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.password) {
    throw new ApiError(400, "User password is not set.");
  }
  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect old password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  const result = await prisma.user.update({
    where: {
      id: decodedToken.id,
    },
    data: {
      password: hashedPassword,
    },
  });
  return { message: "Password changed successfully" };
};

const forgotPassword = async (payload: { email: string }) => {
  // Fetch user data or throw if not found
  const userData = await prisma.user.findFirstOrThrow({
    where: {
      email: payload.email,
    },
  });

  // Generate a new OTP
  const otp = Number(crypto.randomInt(1000, 9999));

  // Set OTP expiration time to 10 minutes from now
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  // Create the email content
  const html = `
<div style="font-family: Arial, sans-serif; background:#f6f8fb; padding:40px;">
  <div style="max-width:600px; background:#fff; margin:auto; padding:30px; border-radius:6px;">

    <h2 style="color:#222;">Together App</h2>
    <p style="color:#555;">Password Reset Request</p>

    <p style="margin-top:20px;">
      We received a request to reset your password.
      Please use the OTP below to continue:
    </p>

    <div style="text-align:center; margin:30px 0;">
      <strong style="font-size:28px; letter-spacing:5px;">
        ${otp}
      </strong>
    </div>

    <p style="font-size:14px; color:#555;">
      This OTP will expire in <strong>10 minutes</strong>.
      If you did not request a password reset, please ignore this email.
    </p>

    <p style="font-size:12px; color:#999; margin-top:30px;">
      Together App Security Team
    </p>
  </div>
</div> `;

  // Send the OTP email to the user
  await emailSender(
    userData.email,
    html,
    "Together App - Password Reset Verification"
  );

  // Update the user's OTP and expiration in the database
  await prisma.user.update({
    where: { id: userData.id },
    data: {
      otp: otp,
      expirationOtp: otpExpires,
    },
  });

  return { message: "Reset password OTP sent to your email successfully", otp };
};

const resendOtp = async (email: string) => {
  // Check if the user exists
  const user = await prisma.user.findUnique({
    where: { email: email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  // Generate a new OTP
  const otp = Number(crypto.randomInt(1000, 9999));

  // Set OTP expiration time to 5 minutes from now
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  // Create email content
  const html = `
    <div style="font-family: Arial, sans-serif; background:#f5f7fa; padding:40px;">
  <div style="max-width:600px; background:#fff; margin:auto; padding:30px; border-radius:6px;">

    <h2>Together App</h2>

    <p>
      As requested, here is your new OTP code:
    </p>

    <div style="font-size:28px; font-weight:bold; margin:20px 0;">
      ${otp}
    </div>

    <p style="font-size:14px;">
      This code will expire in 5 minutes.
    </p>

    <p style="font-size:12px; color:#999; margin-top:30px;">
      Please do not share this code with anyone.
    </p>

  </div>
</div>
  `;

  // Send the OTP to user's email
  await emailSender(user.email, html, "Together App - Your Verification Code");

  // Update the user's profile with the new OTP and expiration
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      otp: otp,
      expirationOtp: otpExpires,
    },
  });

  return { message: "OTP resent successfully" };
};

const verifyForgotPasswordOtp = async (payload: {
  email: string;
  otp: number;
}) => {
  // Check if the user exists
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  // Check if the OTP is valid and not expired
  if (
    user.otp !== payload.otp ||
    !user.expirationOtp ||
    user.expirationOtp < new Date()
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  // Update the user's OTP, OTP expiration, and verification status
  await prisma.user.update({
    where: { id: user.id },
    data: {
      otp: null, // Clear the OTP
      expirationOtp: null, // Clear the OTP expiration
    },
  });

  // Generate JWT token
  const token = jwtHelpers.generateToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  return token;
};

// reset password
const resetPassword = async (payload: { password: string; email: string }) => {
  // Check if the user exists
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(payload.password, 10);

  // Update the user's password in the database
  await prisma.user.update({
    where: { email: payload.email },
    data: {
      password: hashedPassword, // Update with the hashed password
      otp: null, // Clear the OTP
      expirationOtp: null, // Clear OTP expiration
    },
  });

  return { message: "Password reset successfully" };
};

const socialLogin = async (
  provider: "google" | "facebook",
  accessToken: string
) => {
  let userData;

  if (provider === "google") {
    userData = await getGoogleUser(accessToken);
  } else if (provider === "facebook") {
    userData = await getFacebookUser(accessToken);
  } else {
    throw new Error("Invalid provider");
  }

  if (!userData.email) {
    throw new Error("Email not found from provider");
  }

  let user = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  // Generate unique referral code for the new user
  let newReferralCode = getRefferId();
  // Ensure uniqueness in DB
  while (
    await prisma.user.findUnique({ where: { referralCode: newReferralCode } })
  ) {
    newReferralCode = getRefferId();
  }

  // If user not found, create one
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: userData.email,
        firstName: userData.name || "",
        profileImage: userData.picture?.data?.url || userData.picture || "",
        isVerified: true,
        referralCode: newReferralCode,
        status: "ACTIVE",
        role: "USER",
      },
    });
  }

  const token = jwtHelpers.generateToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  return { token, user };
};

const deleteAccount = async (userId: string) => {
  // Check if the user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  // Delete the user account
  await prisma.user.delete({
    where: { id: userId },
  });
  return { message: "Account deleted successfully" };
};

export const AuthServices = {
  loginUser,
  socialLogin,
  getMyProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  resendOtp,
  verifyForgotPasswordOtp,
  deleteAccount,
};
