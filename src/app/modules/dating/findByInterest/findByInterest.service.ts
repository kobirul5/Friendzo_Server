import ApiError from "../../../../errors/ApiErrors";
import prisma from "../../../../shared/prisma";


const getPeopleBySharedInterests = async ({userId, interest}: {userId: string, interest: string}) => {
  // 1️ Get current user's interests
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      interests: true,
      gender: true,
      interestedGender: true,
    },
  });

  console.log(currentUser,"------------------")
  if (!currentUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

   const currentUserInterests = interest? [interest] :  currentUser.interests;

   if (currentUserInterests && currentUserInterests.length > 0) {
    // Validate interests against fixed array

    const interests = await prisma.interest.findMany({
      select: { name: true },
    });

    const CategoriesArray = interests.map((interest) => interest.name);

    const invalidNames = currentUserInterests.filter(
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


  if (!currentUserInterests || currentUserInterests.length === 0) {
    return []; // or throw an error if interests are required
  }

  // 2️ Get other users who share at least one interest
  const matchedUsers = await prisma.user.findMany({
    where: {
      id: { not: userId },
      isDatingMode: true,
      gender: currentUser.interestedGender,
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
    },
  });

  // 3️ Calculate shared interests percentage
  const usersWithMatchPercentage = matchedUsers.map((user) => {
    const sharedCount = user.interests.filter((i) =>
      currentUserInterests.includes(i)
    ).length;

    const matchPercentage =
      currentUserInterests.length > 0
        ? Math.round((sharedCount / currentUserInterests.length) * 100)
        : 0;

    return {
      ...user,
      interestPercentage: matchPercentage,
    };
  });

  // Optional: sort by highest match first
  usersWithMatchPercentage.sort(
    (a, b) => b.interestPercentage - a.interestPercentage
  );

  return usersWithMatchPercentage;
};


export const findByInterestService = {
  getPeopleBySharedInterests
};