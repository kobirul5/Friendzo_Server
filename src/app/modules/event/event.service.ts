import { PrismaClient, Event as EventModel } from "@prisma/client";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import { haversine } from "../../../shared/haversine";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { fileUploader } from "../../../helpars/fileUploader";
import { deleteImageAndFile } from "../../../helpars/fileDelete";

const prisma = new PrismaClient();

// Create Event
const createEvent = async (payload: {
  file: Express.Multer.File;
  data: {
    title: string;
    description: string;
    startedAt : string;
    address?: string;
    lat: string;
    lng: string;
  };
  userId: string;
}): Promise<EventModel> => {
  const { file, data, userId } = payload;
  console.log("Received data for event creation:", data);
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Image file is required.");
  }

  if (!data.title || !data.description || !data.startedAt ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing required fields: title, description, startedAt");
  }

  const lat = parseFloat(data.lat);
  const lng = parseFloat(data.lng);

  if (isNaN(lat) || isNaN(lng)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid coordinates: lat and lng must be valid numbers");
  }

  // Upload image to DigitalOcean
  const uploadedFile = await fileUploader.uploadToDigitalOcean(file);
  const imageUrl = uploadedFile.Location;

  try {
    const event = await prisma.event.create({
      data: {
        title: data.title,
        image: imageUrl,
        description: data.description,
        address: data.address,
        startedAt : new Date(data.startedAt ),
        lat,
        lng,
        userId,
      },
    });

    return event;
  } catch (error) {
    // Rollback: delete uploaded image if event creation fails
    await deleteImageAndFile.deleteFileFromDigitalOcean(imageUrl);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create event");
  }
};

// Get all events by user
const getEventByUser = async (userId: string): Promise<EventModel[]> => {
  return await prisma.event.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

// Get single event by ID
const getEventById = async (id: string): Promise<EventModel | null> => {

  const result = await prisma.event.findUniqueOrThrow({
    where: { id },
    include:{
      user:{
        select:{
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          email: true,
        }
      }
    }
  })



  return result;
};

// Update event
const updateEvent = async (
  id: string,
  payload: {
    file?: Express.Multer.File;
    data: Partial<{
      title: string;
      description: string;
      startedAt: string;
      address: string;
      lat: string;
      lng: string;
    }>;
  }
): Promise<EventModel> => {
  const existingEvent = await prisma.event.findUnique({ where: { id } });
  if (!existingEvent) {
    throw new ApiError(httpStatus.NOT_FOUND, "Event not found");
  }

  const { file, data } = payload;
  const updateData: any = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.startedAt !== undefined) updateData.startedAt = new Date(data.startedAt);

  if (data.lat !== undefined) {
    const lat = parseFloat(data.lat);
    if (!isNaN(lat)) updateData.lat = lat;
  }
  if (data.lng !== undefined) {
    const lng = parseFloat(data.lng);
    if (!isNaN(lng)) updateData.lng = lng;
  }

  // Handle image update
  if (file) {
    const uploadedFile = await fileUploader.uploadToDigitalOcean(file);
    updateData.image = uploadedFile.Location;

    // Delete old image
    await deleteImageAndFile.deleteFileFromDigitalOcean(existingEvent.image);
  }

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No valid fields to update");
  }

  return await prisma.event.update({
    where: { id },
    data: updateData,
  });
};

// Delete event
const deleteEvent = async (id: string): Promise<EventModel> => {
  return await prisma.event.delete({
    where: { id },
  });
};

const getAllEvents = async (userId: string): Promise<any[]> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, "User Not authorized");
  }

  const events = await prisma.event.findMany({
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImage: true,
        },
      },
    },
  });

  const eventsWithDistance = events
    .map((event) => {
      let distanceInKm = null;

      if (
        user.lat != null &&
        user.lng != null &&
        event.lat != null &&
        event.lng != null
      ) {
        distanceInKm = haversine(
          { lat: user.lat, lng: user.lng },
          { lat: event.lat, lng: event.lng }
        );
      }

      return {
        ...event,
        distanceInKm,
      };
    })
    .filter(
      (event) =>
        event.distanceInKm !== null && event.distanceInKm <= 250
    );
  return eventsWithDistance;
};

const getPaginatedEvents = async (options: IPaginationOptions, currentUserId?: string): Promise<{
  meta: { page: number; limit: number; total: number };
  data: any[];
}> => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  const total = await prisma.event.count();
  const events = await prisma.event.findMany({
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImage: true,
        },
      },
      _count: {
        select: { EventLike: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: limit,
  });

  // Add like count and user's like status
  const eventsWithLikes = await Promise.all(
    events.map(async (event) => {
      let isLiked = false;
      if (currentUserId) {
        const like = await prisma.eventLike.findFirst({
          where: { eventId: event.id, userId: currentUserId },
        });
        isLiked = !!like;
      }

      return {
        ...event,
        likeCount: event._count.EventLike,
        isLiked,
      };
    })
  );

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: eventsWithLikes,
  };
};

// Toggle event like
const toggleEventLike = async (eventId: string, userId: string) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "Event not found");
  }

  const existingLike = await prisma.eventLike.findFirst({
    where: { eventId, userId },
  });

  if (existingLike) {
    // Unlike
    await prisma.eventLike.delete({ where: { id: existingLike.id } });
    const likeCount = await prisma.eventLike.count({ where: { eventId } });
    return { liked: false, likeCount };
  } else {
    // Like
    await prisma.eventLike.create({ data: { eventId, userId } });
    const likeCount = await prisma.eventLike.count({ where: { eventId } });
    return { liked: true, likeCount };
  }
};

// Get all events
const getAllEventsWithLikes = async (userId: string): Promise<any[]> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, "User Not authorized");
  }

  const events = await prisma.event.findMany({
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profileImage: true,
        },
      },
      _count: {
        select: { EventLike: true },
      },
    },
  });

  const eventsWithDistanceAndLikes = await Promise.all(
    events.map(async (event) => {
      let distanceInKm = null;

      if (
        user.lat != null &&
        user.lng != null &&
        event.lat != null &&
        event.lng != null
      ) {
        distanceInKm = haversine(
          { lat: user.lat, lng: user.lng },
          { lat: event.lat, lng: event.lng }
        );
      }

      const isLiked = await prisma.eventLike.findFirst({
        where: { eventId: event.id, userId },
      });

      return {
        ...event,
        distanceInKm,
        likeCount: event._count.EventLike,
        isLiked: !!isLiked,
      };
    })
  );

  // Filter after Promise.all resolves
  return eventsWithDistanceAndLikes.filter(
    (event) => event.distanceInKm !== null && event.distanceInKm <= 250
  );
};

// Export all
export const eventService = {
  createEvent,
  getEventByUser,
  getEventById,
  updateEvent,
  deleteEvent,
  getAllEvents,
  getPaginatedEvents,
  toggleEventLike,
  getAllEventsWithLikes,
};
