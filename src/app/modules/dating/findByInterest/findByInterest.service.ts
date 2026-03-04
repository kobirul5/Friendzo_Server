import httpStatus from "http-status";
import ApiError from "../../../../errors/ApiErrors";
import prisma from "../../../../shared/prisma";

const getPeopleBySharedInterests = async ({
  userId,
  interest,
}: {
  userId: string;
  interest: string;
}) => {
  // 1️ Get current user's interests
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      interests: true,
      gender: true,
    },
  });


  if (!currentUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

  const currentUserInterests = interest
    ? [interest]
    : currentUser.interests;

  if (currentUserInterests && currentUserInterests.length > 0) {
    // Validate interests against fixed array

    const interests = await prisma.interest.findMany({
      select: { name: true },
    });

    const CategoriesArray = interests.map((interest) => interest.name);

    const invalidNames = currentUserInterests.filter(
      (name: string) =>
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

  

  if (!currentUserInterests || currentUserInterests.length === 0) {
    return []; // or throw an error if interests are required
  }

  // 2️ Get other users who share at least one interest
  const matchedUsers = await prisma.user.findMany({
    where: {
      id: { not: userId },
      interests: {
        hasSome: currentUserInterests,
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profileImage: true,
      email: true,
      address: true,
      interests: true,
      gender: true,
      dob: true,
      likesReceived: true,
    },
  });



  // 3️ Calculate shared interests percentage
  const usersWithMatchPercentage = matchedUsers.map((user) => {
    const sharedCount = user.interests.filter((i: string) =>
      currentUserInterests.includes(i)
    ).length;

    const matchPercentage =
      currentUserInterests.length > 0
        ? Math.round((sharedCount / currentUserInterests.length) * 100)
        : 0;

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
      email: user.email,
      address: user.address,
      interests: user.interests,
      gender: user.gender,
      dob: user.dob,
      // New fields
      interestPercentage: matchPercentage,
      totalLikesReceived: user.likesReceived.length,
      likedByCurrentUser: user.likesReceived.length > 0,
    };
  });

  // Optional: sort by highest match first
  usersWithMatchPercentage.sort(
    (a, b) => b.interestPercentage - a.interestPercentage
  );

  const totalLikes = matchedUsers
    .map((user) => user.likesReceived.length)
    .reduce((a, b) => a + b, 0);

  return usersWithMatchPercentage;
};

export const findByInterestService = {
  getPeopleBySharedInterests,
};
