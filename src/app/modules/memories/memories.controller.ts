import { Request, Response } from 'express';



import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { memoriesService } from './memories.service';
import { fileUploader } from '../../../helpars/fileUploader';

 const createMemory = catchAsync(async (req: any, res: Response) => {
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
  const memory = await memoriesService.createMemory({
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
    message: 'Memory created successfully',
    data: memory,
  });
});

 const getUserMemories = catchAsync(async (req: any, res: Response) => {
  const userId = req.user.id;

  const memories = await memoriesService.getMemoriesByUser(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Memories fetched successfully',
    data: memories,
  });
});

 const updateMemory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = await memoriesService.updateMemory(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Memory updated successfully',
    data: updated,
  });
});

//  const deleteMemory = catchAsync(async (req: Request, res: Response) => {
//   const { id } = req.params;
//    const delete =  await memoriesService.deleteMemory(id);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Memory deleted successfully',
//   });
// });

export const memoriesController = {
    createMemory,
    getUserMemories,
    updateMemory,
    // deleteMemory
}

