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
    startedAt: Date;
    address?: string;
    lat: string;
    lng: string;
  };
  userId: string;
}): Promise<EventModel> => {
  const { file, data, userId } = payload;

  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Image file is required.");
  }

  if (!data.description || !data.startedAt) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing required fields: description, startedAt");
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
        startAt: new Date(data.startedAt),
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
  data: Partial<
    Pick<EventModel, "image" | "description" | "address" | "lat" | "lng">
  >
): Promise<EventModel> => {
  return await prisma.event.update({
    where: { id },
    data,
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

const getPaginatedEvents = async (options: IPaginationOptions): Promise<{
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
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: limit,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: events,
  };
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
};
