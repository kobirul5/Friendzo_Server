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

  // check target user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: followerId },
  });

  if (!targetUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "Target user not found");
  }

  // check already following
  const alreadyFollowing = await prisma.follow.findFirst({
    where: {
      followerId: userId, // ✅ যে follow করছে
      followingId: followerId, // ✅ যাকে follow করা হচ্ছে
      modeType,
    },
  });

  // যদি আগে follow cancel করা থাকে → আবার pending করা হবে
  if (
    alreadyFollowing &&
    alreadyFollowing.requestStatus === RequestStatus.CANCELED
  ) {
    const result = await prisma.follow.update({
      where: { id: alreadyFollowing.id },
      data: { requestStatus: RequestStatus.PENDING },
    });
    return result;
  }

  // যদি আগে থেকে follow করা থাকে
  if (alreadyFollowing) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Already following this user with this mode"
    );
  }

  // নতুন follow তৈরি করা হচ্ছে
  const follow = await prisma.follow.create({
    data: {
      followerId: userId, // ✅ যে follow করছে
      followingId: followerId, // ✅ যাকে follow করা হচ্ছে
      modeType,
      requestStatus: RequestStatus.PENDING, // default pending
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
      "Invalid type. type should be social, dating or all, type must be social or dating"
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

 const rawFriends = friends.map((f) =>
    f.followerId === userId ? f.following : f.follower
  );

  // 3️ Remove duplicates by user.id
  const uniqueFriends = Array.from(
    new Map(rawFriends.map((friend) => [friend.id, friend])).values()
  );

  return { friends: uniqueFriends };
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      followers: {
        where: { requestStatus: RequestStatus.PENDING, modeType },
        include: { follower: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            address: true,
          },
        } },
      },
    },
  });

  return user?.followers
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      following: {
        where: { requestStatus: RequestStatus.PENDING, modeType: modeType },
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
        }
      },
    },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // const follwingRequests = await prisma.follow.findMany({
  //   where: {
  //     followingId: userId,
  //     requestStatus: RequestStatus.PENDING,
  //     modeType,
  //   },
  //   include: {
  //     follower: {
  //       select: {
  //         id: true,
  //         firstName: true,
  //         lastName: true,
  //         profileImage: true,
  //         address: true,
  //       },
  //     },
  //   },
  // });

  return user.following
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
    select: { id: true, datingInterests: true, lat: true, lng: true },
  });

  if (!currentUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // // 1️⃣ Get already followed userIds in this mode
  // const alreadyFollowedIds = await prisma.follow.findMany({
  //   where: {
  //     followerId: userId,
  //     // requestStatus: RequestStatus.ACCEPTED,
  //     modeType: modeType,
  //   },
  //   select: { followerId: true },
  // });
const alreadyFollowed = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    following: {
      where: {
        requestStatus: RequestStatus.PENDING,
        modeType: modeType,
      },
      select: { followingId: true }, // ✅ 
    },
  },
});

const excludeIds = alreadyFollowed?.following.map(f => f.followingId) || [];

  const whereId =
    excludeIds.length > 0 ? [currentUser.id, ...excludeIds] : [currentUser.id];

  // 2️ Get all users except blocked & self
  const users = await prisma.user.findMany({
    where: {
      id: { notIn: whereId },
      isDatingMode: type === "dating" ? true : undefined,
      blockedByUsers: { none: { blockerId: userId } },
      blockedUsers: { none: { blockerId: userId } },
      status: UserStatus.ACTIVE,
      // followers: {
      //   none: {
      //     followerId: userId,
      //     requestStatus: RequestStatus.ACCEPTED,
      //     modeType: modeType, // <-- only remove already followed in this mode
      //   },
      // },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profileImage: true,
      address: true,
      isDatingMode: true,
      datingInterests: true,
      createdAt: true,
      lat: true,
      lng: true,
      followers: true,
    },
  });

  if (users.length === 0) {
    return [];
  }

  const suggestedUsers = users
    .map((user) => {
      let score = 0;

      // Interest match score
      const commonInterests = user.datingInterests.filter((i) =>
        currentUser.datingInterests.includes(i)
      );
      score += commonInterests.length * 10;

      // Proximity score
      if (user.lat && user.lng && currentUser.lat && currentUser.lng) {
        const distance = Math.sqrt(
          (user.lat - currentUser.lat) ** 2 + (user.lng - currentUser.lng) ** 2
        );
        score += 1 / (distance + 0.01);
      }

      // New user boost
      const isNew =
        new Date().getTime() - new Date(user.createdAt).getTime() <
        7 * 24 * 60 * 60 * 1000;
      if (isNew) score += 5;

      return { ...user, score };
    })
    .sort((a, b) => b.score - a.score);

  return suggestedUsers.map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImage: user.profileImage,
    address: user.address,
    datingInterests: user.datingInterests,
  }));
};

// un friend
const unfriendUser = async ({userId, friendId, type}: {userId: string, friendId: string, type: string}) => {
  
  if (type !== "dating" && type !== "social") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid type. Type must be 'dating'");
  }

  const modeType = type === "dating" ? ModeType.DATING : ModeType.SOCIAL;


  const follow = await prisma.follow.findFirst({
    where: {
      OR: [
        { followerId: userId, followingId: friendId, modeType },
        { followerId: friendId, followingId: userId, modeType },
      ],
    },
  });

  if (!follow) {
    throw new ApiError(httpStatus.NOT_FOUND, "Friend relationship not found");
  }
  const result = await prisma.follow.update({
    where: {
      id: follow.id,
    },
    data: {
      requestStatus: RequestStatus.CANCELED,
    },
  });

  const myFollow = await prisma.follow.findFirst({
    where: {
      followerId: userId,
      followingId: friendId,
      modeType,
    },
  });

   if (myFollow && myFollow.followerId === userId && myFollow.requestStatus === RequestStatus.PENDING) {
    await prisma.follow.delete({
      where: { id: follow.id },
    });
    return { message: "Follow request canceled (deleted)" };
  }

  return result

}

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
  unfriendUser
};
