import { Request, Response } from 'express';



import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { eventService } from './event.service';
import { fileUploader } from '../../../helpars/fileUploader';
import ApiError from '../../../errors/ApiErrors';

 const createEvent = catchAsync(async (req: any, res: Response) => {
  const userId = req.user.id;
  const file = req.file;

  if (!file) {
    throw new Error("Image file is required.");
  }

  // Step 1: Parse form-data 'data' field
  let parsedData;
  try {
    parsedData = JSON.parse(req.body.data);
  } catch (error) {
    throw new Error("Invalid JSON in 'data' field.");
  }

  const { description, address, lat, lng } = parsedData;

  // Step 2: Upload image to DigitalOcean Spaces
  const uploadedFile = await fileUploader.uploadToDigitalOcean(file);
  const imageUrl = uploadedFile.Location;

  // Step 3: Save memory
  const memory = await eventService.createEvent({
    image: imageUrl,
    description,
    address,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    userId,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Event created successfully',
    data: memory,
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


 const updateEvent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await eventService.updateEvent(id, req.body);

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

const getAllEvents = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await eventService.getAllEvents(userId);
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
    getAllEvents
}

