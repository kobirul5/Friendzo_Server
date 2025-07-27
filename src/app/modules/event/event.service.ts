import { PrismaClient, Event as EventModel } from '@prisma/client';

const prisma = new PrismaClient();

// Create Event
const createEvent = async (data: {
  image: string;
  description: string;
  address?: string;
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
    orderBy: { createdAt: 'desc' },
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
  data: Partial<Pick<EventModel, 'image' | 'description' | 'address' | 'lat' | 'lng'>>
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

// Export all
export const eventService = {
  createEvent,
  getEventByUser,
  getEventById,
  updateEvent,
  deleteEvent,
};
