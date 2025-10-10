import httpStatus from "http-status";
import prisma from "../../../../shared/prisma";
import { IGetAllOptions } from "../userInfo/userInfo.service";
import { paginationHelper } from "../../../../helpars/paginationHelper";
import ApiError from "../../../../errors/ApiErrors";
import { Prisma, UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { userValidation } from "./managers.validation";
import { fileUploader } from "../../../../helpars/fileUploader";
import { getRefferId } from "../../../../helpars/generateRefferId";
import { fileUploadService } from "../../fileUpload/fileUpload.service";
import { deleteImageAndFile } from "../../../../helpars/fileDelete";

interface CreateUserInput {
  userId: string;
  data: any;
  file?: Express.Multer.File;
}

const createUserService = async ({ userId, data, file }: CreateUserInput) => {
  const parsedData = data;

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: parsedData.email },
  });
  if (existingUser) {
    throw new ApiError(400, "Email already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(parsedData.password, 10);

  // Optional profile image upload
  let profileImageUrl: string | undefined;
  if (file) {
    const uploadedImage = await fileUploadService.uploadSingleImageService(
      file
    );
    profileImageUrl = uploadedImage;
  }

  // Generate unique referral code
  let newReferralCode = getRefferId();
  while (
    await prisma.user.findUnique({ where: { referralCode: newReferralCode } })
  ) {
    newReferralCode = getRefferId();
  }

  if (!parsedData.accessInput || parsedData.accessInput.length === 0) {
    throw new ApiError(400, "At least one access must be selected");
  }

  if (parsedData.accessInput.includes("fullAccess")) {
    // 
    if (parsedData.accessInput.length > 1) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "'fullAccess' cannot be combined with other permissions."
      );
    }
  }

  

  // Use transaction to create user and managerRole atomically
  const newUser = await prisma.$transaction(async (tx) => {
    // Create user
    const createdUser = await tx.user.create({
      data: {
        firstName: parsedData.firstName,
        email: parsedData.email,
        phoneNumber: parsedData.phoneNumber,
        role: UserRole.MANAGER,
        password: hashedPassword,
        managerRole: parsedData.accessInput,
        profileImage: profileImageUrl,
        referralCode: newReferralCode,
      },
      select: {
        id: true,
        firstName: true,
        email: true,
        phoneNumber: true,
        role: true,
        profileImage: true,
        managerRole: true,
        createdAt: true,
      },
    });

    return createdUser;
  });

  return newUser;
};

const getAllManagers = async (options: IGetAllOptions = {}, userId: string) => {
  const { skip, limit, sortBy, sortOrder, page } =
    paginationHelper.calculatePagination(options);

  // Find requesting user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (
    options.status &&
    options.status !== UserStatus.ACTIVE &&
    options.status !== UserStatus.INACTIVE &&
    options.status !== UserStatus.BLOCKED
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid status provided!, status should be ${UserStatus.ACTIVE}, ${UserStatus.INACTIVE} or ${UserStatus.BLOCKED} `
    );
  }

  // isDating query parameter
  let isDatingFilter: boolean | undefined;
  if (options.isDating !== undefined) {
    if (typeof options.isDating === "string") {
      isDatingFilter = options.isDating.toLowerCase() === "true";
    } else {
      isDatingFilter = options.isDating;
    }
  }

  // Search filter (filter by status if provided, default to ACTIVE)
  const searchFilter: Prisma.UserWhereInput = {
    role: UserRole.MANAGER,
    // search keyword filter
    ...(options.search
      ? {
          OR: [
            { firstName: { contains: options.search, mode: "insensitive" } },
            { lastName: { contains: options.search, mode: "insensitive" } },
            { email: { contains: options.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  // Fetch paginated users
  const users = await prisma.user.findMany({
    where: searchFilter,
    skip,
    take: limit,
    orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      profileImage: true,
      status: true, // include status in the response
      createdAt: true,
    },
  });

  if (!users || users.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "Users not found!");
  }

  // Total count of users matching the filter
  const totalUsersCount = await prisma.user.count({
    where: searchFilter,
  });

  // Add serial number
  const usersWithSerial = users.map((user, index) => ({
    serial: skip + index + 1,
    ...user,
  }));

  return {
    meta: {
      page,
      limit,
      totalUsers: totalUsersCount,
      totalPages: Math.ceil(totalUsersCount / limit),
    },
    data: usersWithSerial,
  };
};

const getByIdFromDb = async (id: string) => {


  
  const result = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profileImage: true,
      email: true,
      phoneNumber: true,
      gender: true,
      about: true,
      age: true,
      memories: true,
      event: true,
      interests: true,
      managerRole: true,
    },
  });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Managers not found");
  }
  return result;
};

const updateUserService = async ({
  targetUserId,
  data,
  file,
}: {
  targetUserId: string;
  data: Partial<{
    firstName: string;
    email: string;
    phoneNumber: string;
    password: string;
    setAccess: string[];
  }>;
  file?: Express.Multer.File;
}) => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });
  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // Prevent duplicate email
  if (data.email && data.email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (emailExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Email already exists");
    }
  }

  // Hash password if provided
  let hashedPassword: string | undefined;
  if (data.password) {
    hashedPassword = await bcrypt.hash(data.password, 10);
  }

  // Handle profile image
  let profileImageUrl: string | undefined;
  if (file) {
    const uploadedImage = await fileUploadService.uploadSingleImageService(
      file
    );
    profileImageUrl = uploadedImage;

    // delete old profile image if exists
    if (existingUser.profileImage) {
      await deleteImageAndFile.deleteFileFromDigitalOcean(
        existingUser.profileImage
      );
    }
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      firstName: data.firstName ?? existingUser.firstName,
      email: data.email ?? existingUser.email,
      phoneNumber: data.phoneNumber ?? existingUser.phoneNumber,
      password: hashedPassword ?? existingUser.password,
      profileImage: profileImageUrl ?? existingUser.profileImage,
      managerRole: data.setAccess ?? existingUser.managerRole, // overwrite managerRole if provided
      updatedAt: new Date(),
    },
    select: {
      id: true,
      firstName: true,
      email: true,
      phoneNumber: true,
      role: true,
      managerRole: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

const deleteItemFromDb = async (id: string) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const deletedItem = await prisma.user.delete({
      where: { id },
    });

    // Add any additional logic if necessary, e.g., cascading deletes
    return deletedItem;
  });

  return transaction;
};
export const managersService = {
  createUserService,
  getAllManagers,
  getByIdFromDb,
  updateUserService,
  deleteItemFromDb,
};
