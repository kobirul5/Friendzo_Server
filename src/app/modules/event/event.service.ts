import { PrismaClient, Event as EventModel } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import { haversine } from "../../../shared/haversine";

const prisma = new PrismaClient();

// Create Event
const createEvent = async (data: {
  image: string;
  description: string;
  address?: string;
  createdAt: Date;
  lat: number;
  lng: number;
  userId: string;
}): Promise<EventModel> => {
  return await prisma.event.create({ data });
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
  return await prisma.event.findUnique({
    where: { id },
  });
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

// Export all
export const eventService = {
  createEvent,
  getEventByUser,
  getEventById,
  updateEvent,
  deleteEvent,
  getAllEvents,
};
