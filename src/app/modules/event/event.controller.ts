import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { eventService } from './event.service';
import ApiError from '../../../errors/ApiErrors';

const createEvent = catchAsync(async (req: any, res: Response) => {
  const userId = req.user.id;
  const file = req.file;

  let parsedData;
  try {
    parsedData = JSON.parse(req.body.data);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid JSON in 'data' field.");
  }

  const { title, description, startedAt , address, lat, lng } = parsedData;

  const event = await eventService.createEvent({
    file,
    data: { title, description, startedAt , address, lat, lng },
    userId,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true, 
    message: 'Event created successfully',
    data: event,
  });
});

 const getUserEvent = catchAsync(async (req: any, res: Response) => {
  const userId = req.user.id;

  const memories = await eventService.getEventByUser(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event fetched successfully',
    data: memories,
  });
});


const getSingleEvent = catchAsync(async (req: Request, res: Response) => {
  const memoryId = req.params.id;

  const memory = await eventService.getEventById(memoryId);

  if (!memory) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event fetched successfully',
    data: memory,
  });
});


const updateEvent = catchAsync(async (req: any, res: Response) => {
  const { id } = req.params;
  const file = req.file;

  let parsedData;
  try {
    parsedData = JSON.parse(req.body.data);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid JSON in 'data' field.");
  }

  const updated = await eventService.updateEvent(id, {
    file,
    data: parsedData,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event updated successfully',
    data: updated,
  });
});

const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const deletedMemory = await eventService.deleteEvent(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Event deleted successfully',
    data: deletedMemory,
  });
});

const getPaginatedEvents = catchAsync(async (req: any, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 6;
  const userId = req.user?.id;
  const result = await eventService.getPaginatedEvents({ page, limit }, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Paginated events fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const toggleLike = catchAsync(async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await eventService.toggleEventLike(id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.liked ? "Event liked successfully" : "Event unliked successfully",
    data: result,
  });
});

const getAllEvents = catchAsync(async (req: any, res: Response) => {
  const userId = req.user.id;
  const result = await eventService.getAllEventsWithLikes(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Events fetched successfully',
    data: result,
  });
});

export const eventController = {
    createEvent,
    getUserEvent,
    getSingleEvent,
    updateEvent,
    deleteEvent,
    getAllEvents,
    getPaginatedEvents,
    toggleLike,
}

