
import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import { haversine } from '../../../shared/haversine';
import ApiError from '../../../errors/ApiErrors';



 const getNearbyPeople = async (userId: string, lat: number, lng: number, radiusKm: number) => {
  // Make sure user exists
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!currentUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

  // Get other users with coordinates
  const users = await prisma.user.findMany({
    where: {
      id: { not: userId },
      lat: { not: null },
      lng: { not: null },
    },
  });

  
  // Filter by distance from (lat, lng)
 const nearbyUsers = users
  .map(user => {
    const { password, ...userWithoutPassword } = user;
    const distance = haversine({ lat, lng }, { lat: user.lat!, lng: user.lng! });
    return { ...userWithoutPassword, distanceInKm: +distance.toFixed(2) };
  })
  .filter(user => user.distanceInKm <= radiusKm);

  return nearbyUsers;
};

const getPeopleBySharedInterests = async (userId: string) => {
  // Get current user's interests
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      interests: true,
    },
  });

  if (!currentUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

  const currentUserInterests = currentUser.interests;

  if (!currentUserInterests || currentUserInterests.length === 0) {
    return []; // or throw an error if interests are required
  }

  // Get other users who share at least one interest
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
      interests: true,
      gender: true,
      dob: true,
    },
  });

  return matchedUsers;
};


export const discoverByInterestService = {
getNearbyPeople,
getPeopleBySharedInterests

};