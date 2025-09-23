import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { ModeType, RequestStatus, UserStatus } from "@prisma/client";

const createFollowerAndFollowingService = async (payload: {
  userId: string;
  followerId: string;
  modeType: ModeType;
}) => {
  const { userId, followerId, modeType } = payload;


  if (userId === followerId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot follow yourself");
  }

  if (modeType !== ModeType.DATING && modeType !== ModeType.SOCIAL) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid mode type, it should be DATING or SOCIAL"
    );
  }

  const following = await prisma.user.findUnique({
    where: { id: followerId, },
  });

  if (!following) {
    throw new ApiError(httpStatus.NOT_FOUND, "Following user not found");
  }

  //  Application-level check for duplicates
  const alreadyFollowing = await prisma.follow.findFirst({
    where: {
      followerId,
      followingId: userId,
      modeType,
    },
  });


  if (alreadyFollowing) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Already following this user with this mode"
    );
  }

  if (alreadyFollowing) {
    throw new ApiError(httpStatus.CONFLICT, "Already following this user");
  }

  const follow = await prisma.follow.create({
    data: {
      followerId,
      modeType,
      followingId: userId,
    },
  });

  return follow;
};

const getMyNetworkCount = async (userId: string) => {
  const followerCount = await prisma.follow.count({
    where: { followingId: userId },
  });

  const followingCount = await prisma.follow.count({
    where: { followerId: userId },
  });

  return {
    followerCount,
    followingCount,
  };
};

const getMyFollowerService = async (userId: string) => {
  const tootalFollowers = await prisma.follow.count({
    where: { followingId: userId },
  });

  const followers = await prisma.follow.findMany({
    where: { followingId: userId },
    include: {
      follower: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
        },
      },
    },
  });

  return {
    followers: followers.map((f) => f.follower),
    totalFollowers: tootalFollowers,
  };
};

const getMyFollowingService = async (userId: string) => {
  const totalFollowing = await prisma.follow.count({
    where: { followerId: userId },
  });

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    include: {
      following: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
        },
      },
    },
  });

  return {
    following: following.map((f) => f.following),
    totalFollowing: totalFollowing,
  };
};

const unfollowUserSocialService = async (
  followerId: string,
  followingId: string
) => {
  // Check if follow relation exists
  const follow = await prisma.follow.findFirst({
    where: {
      followerId,
      followingId,
      modeType: ModeType.SOCIAL,
    },
  });

  if (!follow) {
    throw new Error("Follow relationship not found");
  }

  // Delete the follow relation
  await prisma.follow.delete({
    where: {
      id: follow.id,
    },
  });

  return { unfollowed: true };
};

const unfollowUserDatingService = async (followId: string, userId: string) => {
  // Check if follow relation exists
  const follow = await prisma.follow.findFirst({
    where: {
      id: followId,
      //  modeType: ModeType.DATING
    },
  });

  if (!follow) {
    throw new ApiError(httpStatus.NOT_FOUND, "Follow relationship not found");
  }

  if (follow.followerId !== userId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You are not authorized to unfollow this user"
    );
  }

  // Delete the follow relation
  await prisma.follow.deleteMany({
    where: {
      id: follow.id,
    },
  });

  return { unfollowed: true };
};

const acceptOrRejectFollwershipRequestService = async (
  userId: string,
  followId: string,
  modeType: ModeType,
  status: "ACCEPTED" | "CANCELED"
) => {
  // Validate status
  if (![RequestStatus.ACCEPTED, RequestStatus.CANCELED].includes(status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid status. Status should be ACCEPTED or CANCELED"
    );
  }

  // Find the follow request
  const follow = await prisma.follow.findUnique({
    where: { id: followId },
  });

  if (!follow) {
    throw new ApiError(httpStatus.NOT_FOUND, "Follow relationship not found");
  }

  // Authorization: only the user being followed can accept/reject
  if (follow.followingId !== userId) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "You are not authorized to accept or reject this request"
    );
  }

  // Optional: ensure modeType matches
  if (follow.modeType !== modeType) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Mode type mismatch for this follow request"
    );
  }

  // Update single follow request
  const updatedFollow = await prisma.follow.update({
    where: { id: followId },
    data: { requestStatus: status },
  });

  return {
    message: `Follow request ${status.toLowerCase()} successfully`,
    follow: updatedFollow,
  };
};

const getMyAllFriends = async (userId: string, type: string) => {
  if (type !== "social" && type !== "dating" && type !== "all") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid type. type should be social, dating or all, type muste be social or dating"
    );
  }

  let modeType: ModeType | undefined = undefined;
  if (type === "social") {
    modeType = ModeType.SOCIAL;
  } else if (type === "dating") {
    modeType = ModeType.DATING;
  }

  // Friends are users who have accepted each other's follow requests
  const friends = await prisma.follow.findMany({
    where: {
      OR: [
        {
          followerId: userId,
          requestStatus: RequestStatus.ACCEPTED,
          modeType,
        },
        {
          followingId: userId,
          requestStatus: RequestStatus.ACCEPTED,
          modeType,
        },
      ],
    },
    include: {
      follower: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          address: true,
        },
      },
      following: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          address: true,
        },
      },
    },
  });

  return {
    friends: friends.map((f) =>
      f.followerId === userId ? f.following : f.follower
    ),
  };
};

const getMyAllFollwerRequest = async ({
  userId,
  type,
}: {
  userId: string;
  type: string;
}) => {
  if (type !== "social" && type !== "dating") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid type. type should be social, dating, type muste be social or dating"
    );
  }

  let modeType: ModeType | undefined = undefined;
  if (type === "social") {
    modeType = ModeType.SOCIAL;
  } else if (type === "dating") {
    modeType = ModeType.DATING;
  }

  const follwerRequests = await prisma.follow.findMany({
    where: {
      followerId: userId,
      requestStatus: RequestStatus.PENDING,
      modeType,
    },
    include: {
      following: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          address: true,
        },
      },
    },
  });

  return follwerRequests;
};

const getMyAllFollwingRequest = async ({
  userId,
  type,
}: {
  userId: string;
  type: string;
}) => {
  if (type !== "social" && type !== "dating") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid type. type should be social, dating, type muste be social or dating"
    );
  }

  let modeType: ModeType | undefined = undefined;
  if (type === "social") {
    modeType = ModeType.SOCIAL;
  } else if (type === "dating") {
    modeType = ModeType.DATING;
  }

 

  const follwingRequests = await prisma.follow.findMany({
    where: {
      followingId: userId,
      requestStatus: RequestStatus.PENDING,
      modeType,
    },
    include: {
      follower: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          address: true,
        },
      },
    },
  });


  return follwingRequests;
};

//  getAllSuggestedUsers

const getAllSuggestedUsers = async ({
  userId,
  type,
}: {
  userId: string;
  type: string;
}) => {
  if (type !== "social" && type !== "dating") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Invalid type. Type must be "social" or "dating"'
    );
  }

  const modeType: ModeType =
    type === "social" ? ModeType.SOCIAL : ModeType.DATING;

  // 1️ Get the current user
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { interests: true, lat: true, lng: true },
  });

  if (!currentUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // 2️ Get all users except blocked & self
  const users = await prisma.user.findMany({
    where: {
      id: { not: userId },
      isDatingMode: type === "dating" ? true : undefined,
      blockedByUsers: { none: { blockerId: userId } },
      blockedUsers: { none: { blockerId: userId } },
      status: UserStatus.ACTIVE,
      followers: {
        none: {
          followerId: userId,
          modeType: modeType, // <-- only remove already followed in this mode
        },
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profileImage: true,
      address: true,
      interests: true,
      createdAt: true,
      lat: true,
      lng: true,
    },
  });

  // 3️ Sort users
  const suggestedUsers = users
    .map((user) => {
      let score = 0;

      // Interest match score
      const commonInterests = user.interests.filter((i) =>
        currentUser.interests.includes(i)
      );
      score += commonInterests.length * 10;

      // Optional: proximity score (simple distance formula)
      if (user.lat && user.lng && currentUser.lat && currentUser.lng) {
        const distance = Math.sqrt(
          (user.lat - currentUser.lat) ** 2 + (user.lng - currentUser.lng) ** 2
        );
        score += 1 / (distance + 0.01); // closer users get slightly higher score
      }

      // New user boost
      const isNew =
        new Date().getTime() - new Date(user.createdAt).getTime() <
        7 * 24 * 60 * 60 * 1000; // 1 week
      if (isNew) score += 5;

      return { ...user, score };
    })
    .sort((a, b) => b.score - a.score); // descending

  return suggestedUsers.map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImage: user.profileImage,
    address: user.address,
    interests: user.interests,
  }));
};

export const follwerService = {
  createFollowerAndFollowingService,
  unfollowUserSocialService,
  unfollowUserDatingService,
  getMyFollowerService,
  getMyNetworkCount,
  getMyFollowingService,
  acceptOrRejectFollwershipRequestService,
  getMyAllFriends,
  getMyAllFollwerRequest,
  getMyAllFollwingRequest,
  getAllSuggestedUsers,
};
